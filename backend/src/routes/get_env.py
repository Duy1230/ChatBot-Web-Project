from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os

router = APIRouter()


@router.get("/getEnvVar", description="Get environment variable")
def get_env():
    try:
        env_value_1 = os.getenv("CHAT_DATA_FOLDER")
        env_value_2 = os.getenv("API_URL")
        return JSONResponse(status_code=200, content={"CHAT_DATA_FOLDER": env_value_1, "API_URL": env_value_2})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
