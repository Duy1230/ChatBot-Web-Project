from src.agents.template_agent import *
from src.agents.retrieval_agent import retrieval_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from tavily import TavilyClient
from src.utils import process_message

from dotenv import load_dotenv
import base64
import os
import json
from PIL import Image
from io import BytesIO

load_dotenv()
MAX_RESULTS = 2


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
            if image.size[0] > 224 or image.size[1] > 224:
                image = image.resize((224, 224))  # Resize to 224x224

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
        model = ChatOpenAI(model="gpt-4o-mini")
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
    This is an agent that have access to a database of documents and can answer your questions.
    Provide your question and the document name to the agent in the following example format:
    query: {"question": "How many section are there in the document?", "document_name": "doc1"}
    """
    system_content = f"""
                You are a helpful assistant. Your role is to understand the user's question and what document they are interested in.
                Then use the appropriate tool to get the information they need.
                """
    system_message = SystemMessage(content=system_content)
    message = retrieval_agent.get_answer({"messages": [
        system_message,
        HumanMessage(content=query)
    ]})
    return message['messages'][-1].content


tool = TavilySearchResults(max_results=MAX_RESULTS)

tools = [tool, chat_with_image, tavily_web_search, retrieval_agent_tool]


class SupervisorAgent(TemplateAgent):
    def __init__(self, tools: list, agent_name: str, model_name="gpt-4o-mini"):
        super().__init__(tools, agent_name, model_name)

    def chat(self, state: State):
        result = self.graph.invoke(state)
        return {
            "message": result['messages'][-1].content,
            "model": result['messages'][-1].response_metadata['model_name'],
            "usage_metadata": result['messages'][-1].response_metadata['token_usage']
        }


supervisor_agent = SupervisorAgent(tools, "supervisor_agent")
