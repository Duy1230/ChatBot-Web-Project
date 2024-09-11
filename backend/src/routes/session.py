from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.chat_history import start_new_session, store_message_in_session
from pydantic import BaseModel

router = APIRouter()

@router.post("/startNewSession", description="Start new session")
def start_new_session_endpoint():
    try:
        newSessionId = start_new_session()
        store_message_in_session(
            newSessionId, 'system', 'You are a helpful assistant.')
        response_content = {
            "session_id": newSessionId
        }
        return JSONResponse(content=response_content, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    

class chatStoreRequest(BaseModel):
    session_id: str
    role: str
    content: str


@router.post("/storeMessageInSession", description="Store message in session")
def store_message_in_session_endpoint(data: chatStoreRequest):
    try:
        store_message_in_session(data.session_id, data.role, data.content)
        return JSONResponse(content={"message": "Message stored successfully"}, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")