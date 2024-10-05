import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from src.agents.supervior_agent import supervisor_agent
from src.chat_history import store_message_in_session
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage

router = APIRouter()


class ChatHistoryResponse(BaseModel):
    session_id: str
    chat_content: list[list]


def parse_to_langchain_messages(chat_content):
    message_map = {
        "system": SystemMessage,
        "user": HumanMessage,
        "chatbot": AIMessage
    }
    special_fields = ['content', 'image', 'pdf']
    parsed_messages = []
    for role, content in chat_content:
        file_info = {}
        message_class = message_map.get(role, SystemMessage)
        if isinstance(content, dict):
            # Extract known fields, remove 'content' as it's handled separately
            additional_info = {k: v for k, v in content.items(
            ) if k not in special_fields and v is not None}
            if content.get('image', '') is not "":
                file_info["image_name"] = content.get('image', '')
            if content.get('pdf', '') is not "":
                file_info["pdf_name"] = content.get('pdf', '')
            if not file_info:
                file_info = ""
            message = message_class(content=content.get(
                'content', '') + " " + str(file_info), additional_kwargs=additional_info)

        else:
            message = message_class(content=content)
        parsed_messages.append(message)

    return parsed_messages

# This is for chat with the bot without generating a chat description and adding it to the chat history


def process_message(message):
    # Replace \( and \) with $
    message = message.replace(r"\(", "$").replace(r"\)", "$")
    # Replace opening delimiters with ```math\n
    message = re.sub(r'\\\[(\s*\n)?', '```math\n', message)
    # Replace closing delimiters with \n```
    message = re.sub(r'(\n\s*)?\\]', '\n```', message)

    return message


@router.post("/chat", description="Chat with the bot")
def chat_endpoint(data: ChatHistoryResponse):
    try:
        chat_content = data.chat_content
        langchain_messages = parse_to_langchain_messages(chat_content)
        response = supervisor_agent.chat({"messages": langchain_messages})

        # store the response in the session to databases
        store_message_in_session(
            data.session_id,
            'chatbot',
            {
                "content": process_message(response["message"]),
                "model": response["model"],
                "usage_metadata": response["usage_metadata"]
            })
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
        response = supervisor_agent.chat({"messages": langchain_messages})
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
