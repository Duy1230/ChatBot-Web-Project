from src.agents.template_agent import *
import json
import os
from langchain_community.embeddings import OpenAIEmbeddings

from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

load_dotenv()


script_dir = os.path.dirname(os.path.abspath(__file__))
settings_path = os.path.join(script_dir, "..", "..", "settings.json")


@tool
def retrieval(query: str, database_name: str) -> str:
    """
    Use this when user ask a question about the document
    This will give you the awnser to the user's question
    Example input:
    query: "What is the main purpose of the document?"
    database_name: "doc1"
    """
    # Load session ID from JSON settings
    try:
        with open(settings_path, 'r') as f:
            settings = json.load(f)
        session_id = settings["CURRENT_SESSION_ID"]
    except (FileNotFoundError, json.JSONDecodeError):
        return "Error: Unable to load session settings."

    # Construct the vector database path
    database_path = os.path.join(
        os.getenv("CHAT_DATA_FOLDER"), session_id, "vector_db", database_name.split(".")[0])

    if not os.path.exists(database_path):
        return "Error: Database not found at specified path."

    # Load the vector database
    loaded_db = FAISS.load_local(database_path, OpenAIEmbeddings(
        model="text-embedding-3-small"), allow_dangerous_deserialization=True)

    # Perform retrieval
    retriever = loaded_db.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 4, "fetch_k": 10, "lambda_mult": 0.5}
    )
    system_prompt = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. If you don't know the answer, say that you "
        "don't know. Use three sentences maximum and keep the "
        "answer concise."
        "\n\n"
        "{context}"
    )
    llm = ChatOpenAI(model="gpt-4o-mini")
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{input}"),
        ]
    )

    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    result = rag_chain.invoke({"input": query})
    return result['answer']


class RetrievalAgent(TemplateAgent):
    def __init__(self, tools: list, agent_name: str, model_name="gpt-4o-mini"):
        super().__init__(tools, agent_name, model_name)


retrieval_agent = RetrievalAgent([retrieval], "retrieval_agent")
