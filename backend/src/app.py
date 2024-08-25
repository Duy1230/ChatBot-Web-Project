from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from src.chat import chat_with_bot  # Import the updated function

app = FastAPI(
    title="Chatbot API",
    description="A simple chatbot API",
    version="1.0.0",
)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.post("/chat", description="Chat with the bot")
def chat_endpoint(request: ChatRequest):
    try:
        response = chat_with_bot(request.message)
        response_content = {
            "question": request.message,
            "message": response["message"],
            "model": response["model"],
            "usage_metadata": response["usage_metadata"],
        }
        return JSONResponse(content=response_content, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
