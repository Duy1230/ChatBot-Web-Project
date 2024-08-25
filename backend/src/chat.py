from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from dotenv import load_dotenv

# load environment variables
load_dotenv()


# create LLM model
model = ChatOpenAI(model_name='gpt-4o-mini')

# Initialize chat history
history = [SystemMessage(content="You are a helpful assistant.")]


def chat_with_bot(message: str):
    global history
    history.append(HumanMessage(content=message))
    response = model.invoke(history)
    history.append(AIMessage(content=response.content))

    return {
        "message": response.content,
        "model": response.response_metadata['model_name'],
        "usage_metadata": response.usage_metadata,
    }
