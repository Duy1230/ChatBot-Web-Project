from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import shutil
import requests
import json
# RAG library
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader

# Document tree
from utils.document_tree import document_tree
from utils.data_search import extract_headers_and_paragraphs_with_markdown, extract_data_by_type
from utils.embedder import embedder


load_dotenv()
router = APIRouter()
CHAT_DATA_FOLDER = os.getenv('CHAT_DATA_FOLDER')


@router.get("/pdf/get_pdfs/{session_id}")
async def get_pdfs(session_id: str):
    pdf_folder_path = os.path.join(CHAT_DATA_FOLDER, session_id, "pdf")

    # Get the pdf files only
    pdf_files = [f for f in os.listdir(pdf_folder_path) if f.endswith('.pdf')]
    return JSONResponse(status_code=200, content={"pdf_files": pdf_files})


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
        file_name = file.filename
        folder_path = os.path.join(CHAT_DATA_FOLDER, chat_folder_name)

        os.makedirs(folder_path, exist_ok=True)

        if "image" in file_type:
            file_path = os.path.join(folder_path, "image", file_name)
        elif "pdf" in file_type:
            file_path = os.path.join(folder_path, "pdf", file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if "pdf" in file_type:
            # Send the file to the external API for text extraction
            try:
                with open(file_path, 'rb') as file:
                    files = {'file': file}
                    response = requests.post(
                        "https://8064-104-196-240-101.ngrok-free.app/extract_text/",
                        files=files
                    )
                    response.raise_for_status()
            except Exception as e:
                print("Error extracting text: ", e)
                raise HTTPException(
                    status_code=500, detail=f"Error extracting text: {str(e)}")

            if response.status_code == 200:
                extracted_text = response.json()
                extracted_text = extracted_text['text']
                # print("Extracted text: ", extracted_text)

                # Save the extracted text to a markdown file
                with open(os.path.join(folder_path, "pdf", file_name.split(".")[0] + ".md"), "w", encoding="utf-8") as f:
                    f.write(extracted_text)

                # Add the document to the tree
                document_tree.add_to_tree(file_name, extracted_text)
                document_tree.save_tree(os.path.join(
                    CHAT_DATA_FOLDER, chat_folder_name, "vector_db", "main.json"))

                # Check if there is exist a vectordb
                vector_db_path = os.path.join(
                    folder_path, "vector_db", "vector_db.faiss")
                if not os.path.exists(vector_db_path):
                    print(f"No FAISS index found at {
                          vector_db_path}. Creating a new empty index for {file_name}")
                    embedder.save(vector_db_path)
                else:
                    print(f"FAISS index found at {
                          vector_db_path}. Loading the index for {file_name}")
                    embedder.load(vector_db_path)
                    branch = next((item for item in document_tree.get_tree()[
                                  'children'] if item['text'] == file_name), None)
                    paragraphs = extract_data_by_type(branch, "Paragraph")
                    embedder.embed_documents(paragraphs)
                    embedder.save(vector_db_path)
                    print(f"Number of vectors in FAISS index: {
                          embedder.get_faiss_index().ntotal}")

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


@router.post("/tree/load_tree/{session_id}")
async def load_document_tree(session_id: str):
    print("Loading tree for session: ", session_id)
    print("Tree path: ", os.path.join(
        CHAT_DATA_FOLDER, session_id, "vector_db", "main.json"))
    document_tree.load_tree(os.path.join(
        CHAT_DATA_FOLDER, session_id, "vector_db", "main.json"))
    return JSONResponse(status_code=200, content={"message": "Tree loaded successfully"})


@router.post("/tree/save_tree/{session_id}")
async def save_document_tree(session_id: str):
    document_tree.save_tree(os.path.join(
        CHAT_DATA_FOLDER, session_id, "vector_db", "main.json"))
    return JSONResponse(status_code=200, content={"message": "Tree saved successfully"})


@router.post("/tree/reset_tree")
async def reset_document_tree():
    document_tree.reset_tree()
    return JSONResponse(status_code=200, content={"message": "Tree reset successfully"})


@router.get("/tree/get_pdf_data/{pdf_name}")
async def get_pdf_data(pdf_name: str):
    matched_pdfs = next(
        (item for item in document_tree.get_tree()['children'] if item['text'] == pdf_name), None)
    if matched_pdfs is None:
        raise HTTPException(status_code=404, detail="PDF not found")
    pdf_data = extract_headers_and_paragraphs_with_markdown(matched_pdfs)
    print("PDF data: ", pdf_data)
    return JSONResponse(status_code=200, content={
        "message": "PDF data retrieved successfully",
        "pdf_data": pdf_data,
        "order": list(pdf_data.keys())  # This preserves the original order
    })


@router.post("/vector_db/load_index/{session_id}")
async def load_vector_db(session_id: str):
    vector_db_path = os.path.join(
        CHAT_DATA_FOLDER, session_id, "vector_db", "vector_db.faiss")
    embedder.load(vector_db_path)
    return JSONResponse(status_code=200, content={"message": "Vector DB loaded successfully"})
