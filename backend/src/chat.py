from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from dotenv import load_dotenv

# load environment variables
load_dotenv()


class ChatModel:
    def __init__(self, task="default", model_name="gpt-4o-mini"):
        self.model = ChatOpenAI(model_name=model_name)
        self.task = task


    def chat(self, message):
        response = self.model.invoke(message)
        return {
            "message": response.content,
            "model": response.response_metadata['model_name'],
            "usage_metadata": response.usage_metadata,
        }
    

model = ChatModel()



