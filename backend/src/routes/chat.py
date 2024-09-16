from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from src.chat import model
from src.chat_history import store_message_in_session
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage

router = APIRouter()


class ChatHistoryResponse(BaseModel):
    session_id: str
    chat_content: list[list[str]]


def parse_to_langchain_messages(chat_history):
    langchain_messages = []
    for role, content in chat_history:
        # Assuming the role is either "user" or "chatbot"
        if role == "user":
            message = HumanMessage(content=content)
        elif role == "chatbot":
            message = AIMessage(content=content)
        else:
            message = SystemMessage(content=content)
        langchain_messages.append(message)
    return langchain_messages

# This is for chat with the bot without generating a chat description and adding it to the chat history


def process_message(message):
    # replace \( and \) with $
    message = message.replace("\(", "$").replace("\)", "$")
    message = message.replace("\[", "```math").replace("\]", "```")
    return message


@router.post("/chat", description="Chat with the bot")
def chat_endpoint(data: ChatHistoryResponse):
    try:
        chat_content = data.chat_content
        langchain_messages = parse_to_langchain_messages(chat_content)
        response = model.chat(langchain_messages)

        # store the response in the session to databases
        store_message_in_session(
            data.session_id, 'chatbot', process_message(response["message"]))
        response_content = {
            # "question": request.message,
            "message": process_message(response["message"]),
            "model": response["model"],
            "usage_metadata": response["usage_metadata"],
        }
        return JSONResponse(content=response_content, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/generate_description", description="Generate chat description")
def chat_endpoint(data: ChatHistoryResponse):
    try:
        chat_content = data.chat_content
        chat_content.append([
            "user",
            "You take the role of a third person who is not part of the conversation, the above conversation is between a user and a chatbot. Please generate context for this conversation don't use more than 6 words"
        ])
        langchain_messages = parse_to_langchain_messages(chat_content)
        response = model.chat(langchain_messages)
        response_content = {
            # "question": request.message,
            "message": response["message"],
            "model": response["model"],
            "usage_metadata": response["usage_metadata"],
        }
        return JSONResponse(content=response_content, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
