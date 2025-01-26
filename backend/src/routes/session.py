from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.chat_history import start_new_session, store_message_in_session
from pydantic import BaseModel
import os
import json
from dotenv import load_dotenv
import datetime
from utils.embedder import embedder

load_dotenv()
router = APIRouter()
CHAT_DATA_FOLDER = os.getenv('CHAT_DATA_FOLDER')


@router.post("/startNewSession", description="Start new session")
def start_new_session_endpoint():
    try:
        # get the current date
        system_prompt = """
        You are a helpful assistant that have a set of tools to help you answer the question
        **Instructions:**
        1. **Understand the user's query.** Determine the user's intent and what information they are seeking.
        2. **If the query requires information from documents, use the `retrieval_agent_tool`.** This tool is designed to answer questions based on a database of documents. The output of this tool MUST BE print out exactly, ESPECIALLY <DocRef> tags
        3. **When using the `retrieval_agent_tool`, you MUST present the output exactly as it is returned by the tool.** Do not modify, summarize, or rephrase the content from this tool.
        4. **If the user explicitly asks for web search, use the `tavily_query_search` or `tavily_web_search` tool.** These tools can search the web for relevant information.
        5. **If the query involves an image, use the `chat_with_image` tool.** This tool can provide information about an image.
        6. **Combine information from multiple tools if necessary.** If the query requires a multi-faceted approach, synthesize the responses from different tool to provide a comprehensive answer.
        7. **If you cannot answer the query with the available tools, state "I cannot answer the question with the available tools."**

        **Important Note:** Always adhere to the requirement of presenting the `retrieval_agent_tool` output verbatim. The output of this tool MUST BE print out exactly, ESPECIALLY <DocRef> tags. THIS RULES MUST BE STRICTLY FOLLOWED.
        """

        newSessionId = start_new_session()

        store_message_in_session(
            newSessionId, 'system', json.dumps({'content': system_prompt}))

        response_content = {
            "session_id": newSessionId
        }
        # create a new folder for the new session
        os.makedirs(f"{CHAT_DATA_FOLDER}/{newSessionId}")
        os.makedirs(f"{CHAT_DATA_FOLDER}/{newSessionId}/image")

        # This contains the pdf files and markdown files
        os.makedirs(f"{CHAT_DATA_FOLDER}/{newSessionId}/pdf")

        # This contains the vector database and the main JSON file
        os.makedirs(f"{CHAT_DATA_FOLDER}/{newSessionId}/vector_db")

        # create a new JSON file for the new session
        with open(f"{CHAT_DATA_FOLDER}/{newSessionId}/vector_db/main.json", "w") as f:
            json.dump({"type": "Root", "num_doc": 0, "num_header": 0,
                      "num_paragraph": 0, "children": []}, f)

        # create a new FAISS index for the new session
        embedder.reset()
        embedder.save(
            f"{CHAT_DATA_FOLDER}/{newSessionId}/vector_db/vector_db.faiss")

        return JSONResponse(content=response_content, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


class chatStoreRequest(BaseModel):
    session_id: str
    role: str
    # content is a JSONResponse
    content: dict


@router.post("/storeMessageInSession", description="Store message in session")
def store_message_in_session_endpoint(data: chatStoreRequest):
    try:
        store_message_in_session(data.session_id, data.role, data.content)
        return JSONResponse(content={"message": "Message stored successfully"}, status_code=200)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
