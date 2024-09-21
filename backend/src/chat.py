from typing import TypedDict, Annotated
from langchain_openai.chat_models.base import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph.message import add_messages
from langchain_community.tools.tavily_search import TavilySearchResults
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage
# load environment variables
load_dotenv()

# define the tools
MAX_RESULTS = 1
tool = TavilySearchResults(max_results=MAX_RESULTS)
tools = [tool]


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
