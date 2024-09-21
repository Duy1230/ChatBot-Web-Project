from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.chat_history import start_new_session, store_message_in_session
from pydantic import BaseModel
import os
import json
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
CHAT_DATA_FOLDER = os.getenv('CHAT_DATA_FOLDER')


@router.post("/startNewSession", description="Start new session")
def start_new_session_endpoint():
    try:
        system_prompt = """
        You are a helpful assistant. Please answer user questions,
        if you don't know the answer, please say you don't know.
        """
        newSessionId = start_new_session()

        store_message_in_session(
            newSessionId, 'system', json.dumps({'content': system_prompt}))

        response_content = {
            "session_id": newSessionId
        }
        # create a new folder for the new session
        os.makedirs(f"{CHAT_DATA_FOLDER}/{newSessionId}")

        return JSONResponse(content=response_content, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


class chatStoreRequest(BaseModel):
    session_id: str
    role: str
    # content is a JSONResponse
    content: dict


@router.post("/storeMessageInSession", description="Store message in session")
def store_message_in_session_endpoint(data: chatStoreRequest):
    try:
        store_message_in_session(data.session_id, data.role, data.content)
        return JSONResponse(content={"message": "Message stored successfully"}, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
