from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import shutil

load_dotenv()
router = APIRouter()
CHAT_DATA_FOLDER = os.getenv('CHAT_DATA_FOLDER')


class DeleteChatDataRequest(BaseModel):
    chat_folder_name: str


@router.post("/deleteChatData", description="Delete chat data")
async def delete_folder_endpoint(request: DeleteChatDataRequest):
    if not request.chat_folder_name:
        raise HTTPException(
            status_code=422, detail="chat_folder_name is required")

    folder_path = os.path.join(CHAT_DATA_FOLDER, request.chat_folder_name)
    try:
        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)
            return JSONResponse(status_code=200, content={"message": "Folder deleted successfully"})
        else:
            return JSONResponse(status_code=404, content={"message": f"Folder not found: {folder_path}"})
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error deleting folder: {str(e)}")
