from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import chat, session, history

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

# Include routers
app.include_router(chat.router, prefix="/chat")
app.include_router(session.router, prefix="/session")
app.include_router(history.router, prefix="/history")
