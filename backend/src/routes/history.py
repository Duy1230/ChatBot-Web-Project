from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from src.chat_history import load_history_by_session, load_all_sessions

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/getChatHistory", description="Get chat history")
def get_chat_history():
    try:
        response1, response2 = load_all_sessions()
        response_content = {
            "chat_history": response1,
            "chat_description": response2
        }
        return JSONResponse(content=response_content, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/getChatHistoryBySession", description="Get chat history by session")
def get_chat_history_by_session(request: ChatRequest):
    try:
        response = load_history_by_session(request.message)
        response_content = {
            "chat_content": response
        }
        return JSONResponse(content=response_content, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

