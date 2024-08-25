from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse

app = FastAPI()


@app.post("/chat")
def chat(message: str):
    return JSONResponse(content={"message": message}, status_code=200)
