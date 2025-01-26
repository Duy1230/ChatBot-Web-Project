from src.agents.template_agent import *
# from src.agents.retrieval_agent import retrieval_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from tavily import TavilyClient
from src.utils import process_message, get_current_settings
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import base64
import os
import json
from PIL import Image
from io import BytesIO
from utils.embedder import embedder
from utils.document_tree import document_tree
from utils.data_search import tree_search, find_unique_header

load_dotenv()

settings = get_current_settings()


def extract_document_and_id(query, headers):
    template = """
            You are a highly precise reaserch assistant. Always respond in the exact format specified.
            Your job is identify the paragraph IDs (they are always in <a> tag like this <a id="paragraphsName_id"></a>) from the provided markdown document that are relevant to answering the query.
            You also need to include IDs of other paragraphs nearby which provided the context (but not directly) answer hte query
            Output the EXACTLY paragraph IDs separated by commas (see FORMAT and EXAMPLE section)
            If a paragraph might be relevant, include its ID. If no paragraphs are relevant, output "N/A".

            IMPORTANT NOTE: DO NOT ask, DO NOT directly answer the query, ONLY answer using the format provided above.
            If no document can answer the question say "N/A". The ID is in this format <NAME>_<ID> see FORMAT for example.
            DO NOT return ID of documents that are NOT helpful or relevant to answer the query

            FORMAT: demo-doc_1, reaserchPaper_254, v4375bv35v3_3,...
            The format of your overall response should look like what's shown above. Make sure to follow the formatting and spacing exactly.
            Here is an **example**:

            Query: What's model is presented in the paper? Is there any github link?
            Document:
            #Header
            <a id="Attention is all you need_93"></a>In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention.
            <a id="Attention is all you need_94"></a>The code we used to train and evaluate our models is available at https://github.com/ tensorflow/tensor2tensor.
            <a id="Attention is all you need_95"></a>IAcknowledgements We are grateful to Nal Kalchbrenner and Stephan Gouws for their fruitful comments, corrections and inspiration.

            Output: Attention is all you need_93, Attention is all you need_94

            ### BEGIN!
            Query: {query}
            Document:
            <BEGIN>
            {doc}
            <END>

            Output:
    """
    prompt = PromptTemplate(
        input_variables=["query", "doc"],
        template=template,
    )

    chat = ChatOpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
        model="google/gemini-flash-1.5-8b",
        temperature=0.5
    )

    relevant_paragraph_ids = []
    print("Header num: ", len(headers))
    for doc in headers:
        # Create message with text and image
        message = HumanMessage(
            content=prompt.format(query=query, doc=doc)
        )

        # Get response
        response = (chat.invoke([message])).content
        if 'N/A' in response:
            continue
        ids = response.split(",")
        relevant_paragraph_ids.extend([idx.strip() for idx in ids])

    all_docs = ""
    for idx in relevant_paragraph_ids:
        doc_name = idx.rsplit("_", 1)
        doc = tree_search(document_tree.get_tree(), "id", idx,
                          doc_name=doc_name)[0]["text"]
        all_docs += f"<id>{idx}</id>\n{doc}\n\n"

    return all_docs


def retrieve_doc(query: str) -> str:
    """
    Enter a query and the tool will return relevant documents to the query
    Example input:
    query: "What is the main purpose of the document?"
    """

    # Perform a search
    distances, indices = embedder.search(query, k=10)
    documents = []
    idx = []

    for index in indices[0]:
        search_results = tree_search(
            document_tree.get_tree(), "index", index, node_type="Paragraph")[0]
        documents.append(search_results['text'])
        idx.append(search_results['id'])

    # print(f"\nQuery: {query}")
    # print("Nearest Neighbors:")
    # for pos, value in enumerate(range(len(indices[0]))):
    #     index = indices[0][value]
    #     print(
    #         f"  - Index: {index}, Distance: {distances[0][pos]}, Document: {documents[pos]}")

    # Get unique header and merge document
    headers, merged_indices, merged_lengths = find_unique_header(
        document_tree.get_tree(), idx)
    print("merged_indices ", merged_indices)
    print("merged_length ", merged_lengths)

    return extract_document_and_id(query, headers)


@tool
def tavily_web_search(query: str) -> str:
    """
    Search the web for information.
    Using this when user provide an URL
    Example input:
    query: "https://en.wikipedia.org/wiki/Artificial_intelligence"
    """
    client = TavilyClient()
    response = client.extract(urls=[query])
    content = process_message(response['results'][0]['raw_content'])
    return content


@tool
def chat_with_image(prompt: str, image_name: str) -> str:
    """
    Provide information about the image.
    Use this when user asks a question about an image.
    Example input:
    prompt: "How many dogs are in the image?"
    image_name: "image.png"
    """
    settings = get_current_settings()
    # Load session ID from JSON settings
    try:
        with open("settings.json", 'r') as f:
            settings = json.load(f)
        session_id = settings["CURRENT_SESSION_ID"]
    except (FileNotFoundError, json.JSONDecodeError):
        return "Error: Unable to load session settings."

    # Construct the image path
    data_path = os.path.join(
        os.getenv("CHAT_DATA_FOLDER"), session_id, "image", image_name)

    if not os.path.exists(data_path):
        return "Error: Image not found at specified path."

    try:
        # Open the image and resize if necessary
        with open(data_path, "rb") as image_file:
            image = Image.open(image_file)
            if image.size[0] > settings["IMAGE_WIDTH"] or image.size[1] > settings["IMAGE_HEIGHT"]:
                image = image.resize(
                    # Resize to 224x224
                    (settings["IMAGE_WIDTH"], settings["IMAGE_HEIGHT"]))

            # Save the resized image to a BytesIO buffer
            buffer = BytesIO()
            image.save(buffer, format="JPEG")
            buffer.seek(0)

            # Base64 encode the image
            encoded_string = base64.b64encode(buffer.read()).decode('utf-8')
    except Exception as e:
        return f"Error processing image: {str(e)}"

    # Prepare message for chatbot
    try:
        model = ChatOpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=OPENROUTER_API_KEY,
            model="openai/gpt-4o-mini")
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {
                    "url": f"data:image/jpeg;base64,{encoded_string}"}}
            ]
        )

        # Get the response from the chatbot
        result = model.invoke([message])
        return result.content
    except Exception as e:
        return f"Error during model invocation: {str(e)}"


@tool
def retrieval_agent_tool(query: str) -> str:
    """
    This is an expert that have access to a database of documents and can answer your questions.
    IF YOU USING THIS TOOL ALWAYS RE-WRITE EXACTLY WHAT RETURNED TO USER
    IMPORTANT: This tool provides final answers, no need to process the response further.
    Example input:
    question: "How many section are there in the document?"
    """
    template = """
            You are a helpful and precise document-based question-answering assistant. Your task is to answer user queries based solely on the information provided in a set of document paragraphs.
            **Instructions:**

            1. **Read the provided document paragraphs carefully.** Each paragraph has a unique ID enclosed in `<id>` and `</id>` tags.
            2. **Answer the user's query using only the information found within the document paragraphs.** Do not use any external knowledge or make assumptions.
            3. **If the answer cannot be found in the documents, state "The answer cannot be found in the provided documents."**
            4. **Quote the ID of each paragraph used to answer the query in the format:** `<DocRef name="paragraph_id">quote_order</DocRef>`
                *   Replace `paragraph_id` with the actual ID of the paragraph (e.g., `2544CYX3TC3T5QB2NTVXD3IUFM654GXK_5052`).
                *   Replace `quote_order` with the order number of the current quote (start from 1 to 2 and 3,...).
            5. **Structure your response as follows:**
                *   Follow with the answer to the query. 
                *   Conclude with the `<DocRef>` tags referencing the paragraphs used, as described in step 4.
                *   For each paragraph you said a <DocRef> MUST BE directly follow if exist
            6. **Additional instructions**:
                * Carefully analyze the document and always provide additional information if possible (quote it with `<DocRef>` as well).
                * Answer using markdown format including write equation and draw table
            **Example:**
            If the document set is:
            <id>ABC_1</id>
            ''(1) Apples are red.
            <id>DEF_2</id>
            ''(2) Bananas are delicious

            And the query is: "What color are bananas and are they edible?"
            Your response should be:
            Bananas are yellow.<DocRef name="DEF_2">1</DocRef>\n And their are also edible.<DocRef name="DEF_2">2</DocRef>
            **Now, please process the following document and query:**

            **Document:**
            {doc}
            **Query:**
            {query}
        """
    prompt = PromptTemplate(
        input_variables=["query", "doc"],
        template=template,
    )
    all_docs = retrieve_doc(query)
    print(all_docs)

    chat = ChatOpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
        model="deepseek/deepseek-chat",
        temperature=0.5
    )
    message = HumanMessage(
        content=prompt.format(query=query, doc=all_docs)
    )

    response = chat.invoke([message])
    # Make it clear this is a final answer
    return f"Final Answer: {response.content}"


tavily_query_search = TavilySearchResults(
    max_results=settings["TAVILY_MAX_RESULT"])

tools = [tavily_query_search, chat_with_image,
         tavily_web_search, retrieval_agent_tool]


class SupervisorAgent(TemplateAgent):
    def __init__(self, tools: list, agent_name: str, model_name=settings["MODEL_NAME"]):
        super().__init__(tools, agent_name, model_name)

    def chat(self, state: State):
        result = self.graph.invoke(state)
        return {
            "message": result['messages'][-1].content,
            "model": result['messages'][-1].response_metadata['model_name'],
            "usage_metadata": result['messages'][-1].response_metadata['token_usage']
        }

    def get_lastest_settings(self):
        settings = get_current_settings()
        tavily_query_search = TavilySearchResults(
            max_results=settings["TAVILY_MAX_RESULT"])
        self.tools = [tavily_query_search, chat_with_image,
                      tavily_web_search, retrieval_agent_tool]
        self.model = ChatOpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=OPENROUTER_API_KEY,
            model=settings["MODEL_NAME"]).bind_tools(self.tools)


supervisor_agent = SupervisorAgent(tools, "supervisor_agent")
