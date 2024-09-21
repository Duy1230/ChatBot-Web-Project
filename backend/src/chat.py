from typing import TypedDict, Annotated
from langchain_openai.chat_models.base import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph.message import add_messages
from langchain_community.tools.tavily_search import TavilySearchResults
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage
import json
import base64
import os
from PIL import Image
from io import BytesIO

# load environment variables
load_dotenv()


# define the tools
MAX_RESULTS = 1


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
        os.getenv("CHAT_DATA_FOLDER"), session_id, image_name)

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


tool = TavilySearchResults(max_results=MAX_RESULTS)

tools = [tool, chat_with_image]


class State(TypedDict):
    messages: Annotated[list, add_messages]


class ChatAgent:
    def __init__(self,  model_name="gpt-4o-mini"):
        self.model = ChatOpenAI(model=model_name).bind_tools(tools)
        self.tools = tools
        self.graph = self.create_graph()

    def create_graph(self):
        graph_builder = StateGraph(State)
        graph_builder.add_node("chatbot", self.chatbot)
        graph_builder.add_node("tools", ToolNode(self.tools))
        graph_builder.add_conditional_edges(
            "chatbot",
            tools_condition,
        )
        graph_builder.add_edge("tools", "chatbot")
        graph_builder.set_entry_point("chatbot")
        graph = graph_builder.compile()
        return graph

    def chatbot(self, state: State):
        result = self.model.invoke(state['messages'])
        print(result)
        return {"messages": [result]}

    def chat(self, state: State):
        result = self.graph.invoke(state)
        return {
            "message": result['messages'][-1].content,
            "model": result['messages'][-1].response_metadata['model_name'],
            "usage_metadata": result['messages'][-1].response_metadata['token_usage']
        }


agent = ChatAgent()
