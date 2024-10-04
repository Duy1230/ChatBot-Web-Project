from typing import TypedDict, Annotated
from langchain_openai.chat_models.base import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from dotenv import load_dotenv


class State(TypedDict):
    messages: Annotated[list, add_messages]


def branch_condition(state: State):
    kwarg_keys = list(state['messages'][-1].additional_kwargs.keys())
    if 'tool_calls' in kwarg_keys:
        return "tools"
    else:
        return END


class TemplateAgent:
    def __init__(self, tools: list, agent_name: str, model_name="gpt-4o-mini"):
        self.model = ChatOpenAI(model=model_name).bind_tools(tools)
        self.tools = tools
        self.agent_name = agent_name
        self.graph = self.create_graph()

    def create_graph(self, ):
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
