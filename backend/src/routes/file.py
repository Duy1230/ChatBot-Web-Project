from fastapi import APIRouter, HTTPException, UploadFile, File, Form
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


@router.post("/writeChatData", description="Write chat data")
async def write_chat_data_endpoint(
    chat_folder_name: str = Form(...),
    data_path: UploadFile = File(...)
):
    if not chat_folder_name or not data_path:
        raise HTTPException(
            status_code=422, detail="chat_folder_name and data_path are required")

    try:
        folder_path = os.path.join(CHAT_DATA_FOLDER, chat_folder_name)
        os.makedirs(folder_path, exist_ok=True)

        file_path = os.path.join(folder_path, data_path.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(data_path.file, buffer)

        return JSONResponse(status_code=200, content={"message": "File copied successfully"})
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error copying file: {str(e)}")
