from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import shutil
import requests
# RAG library
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader

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
    file: UploadFile = File(...),
    file_type: str = Form(...)
):
    if not chat_folder_name or not file:
        raise HTTPException(
            status_code=422, detail="chat_folder_name and file are required")

    try:
        folder_path = os.path.join(CHAT_DATA_FOLDER, chat_folder_name)

        os.makedirs(folder_path, exist_ok=True)

        if "image" in file_type:
            file_path = os.path.join(folder_path, "image", file.filename)
        elif "pdf" in file_type:
            file_path = os.path.join(folder_path, "pdf", file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if "pdf" in file_type:
            # Send the file to the external API for text extraction
            try:
                with open(file_path, 'rb') as file:
                    files = {'file': file}
                    response = requests.post(
                        "https://b3f4-34-133-48-213.ngrok-free.app/extract_text/",
                        files=files
                    )
            except Exception as e:
                print("Error extracting text: ", e)
                raise HTTPException(
                    status_code=500, detail=f"Error extracting text: {str(e)}")

            if response.status_code == 200:
                extracted_text = response.json()

            else:
                print("Error extracting text from PDF: ", response.text)
                raise HTTPException(
                    status_code=response.status_code, detail=f"Error extracting text from PDF: {
                        response.text}"
                )

        print("Successfully copied file to: ", file_path)

        return JSONResponse(status_code=200, content={"message": "File processed successfully"})
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error copying file: {str(e)}")


@router.get("/image/{session_id}/{image_name}", description="Serve image")
async def serve_image(session_id: str, image_name: str):
    image_path = os.path.join(
        CHAT_DATA_FOLDER, session_id, "image", image_name)
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image_path)


@router.get("/pdf/{session_id}/{pdf_name}", description="Serve pdf")
async def serve_pdf(session_id: str, pdf_name: str):
    pdf_path = os.path.join(
        CHAT_DATA_FOLDER, session_id, "pdf", pdf_name)
    print("PDF path: ", pdf_path)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(pdf_path)
