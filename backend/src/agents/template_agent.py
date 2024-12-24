import os
from typing import TypedDict, Annotated
from langchain_openai.chat_models.base import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from dotenv import load_dotenv
from src.utils import get_current_settings

settings = get_current_settings()

load_dotenv()
OPENROUTER_BASE_URL = os.getenv('OPENROUTER_BASE_URL')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

class State(TypedDict):
    messages: Annotated[list, add_messages]


def branch_condition(state: State):
    kwarg_keys = list(state['messages'][-1].additional_kwargs.keys())
    if 'tool_calls' in kwarg_keys:
        return "tools"
    else:
        return END


class TemplateAgent:
    def __init__(self, tools: list, agent_name: str, model_name=settings["MODEL_NAME"]):
        self.model = ChatOpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=OPENROUTER_API_KEY,
            model=model_name).bind_tools(tools)
        self.tools = tools
        self.agent_name = agent_name
        self.graph = self.create_graph()

    def create_graph(self):
        graph_builder = StateGraph(State)
        graph_builder.add_node(self.agent_name, self.chatbot)
        graph_builder.add_node("tools", ToolNode(self.tools))
        graph_builder.add_conditional_edges(self.agent_name, branch_condition)
        graph_builder.add_edge("tools", self.agent_name)
        graph_builder.set_entry_point(self.agent_name)
        graph = graph_builder.compile()
        return graph

    def chatbot(self, state: State):
        result = self.model.invoke(state['messages'])
        return {"messages": [result]}

    def get_answer(self, state: State):
        result = self.graph.invoke(state)
        return result

    def get_lastest_settings(self):
        settings = get_current_settings()
        self.model = ChatOpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=OPENROUTER_API_KEY,
            model=settings["MODEL_NAME"]).bind_tools(self.tools)
