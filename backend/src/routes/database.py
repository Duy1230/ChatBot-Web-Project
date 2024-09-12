from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from src.chat_history import general_update, update_a_column
from typing import Any


router = APIRouter()


class UpdateDatabaseRequest(BaseModel):
    table_name: str
    column_name: str
    column_value: Any


@router.post("/updateDatabase", description="Update database")
def update_database(request: UpdateDatabaseRequest):
    try:
        update_a_column(request.table_name, request.column_name,
                        request.column_value)
        return JSONResponse(content={"message": "Database updated"}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)


class GeneralUpdateRequest(BaseModel):
    query: str
    params: list


@router.post("/generalUpdate", description="General update")
def do_general_update(request: GeneralUpdateRequest):
    try:
        # Convert list to tuple for SQLite execution
        params = tuple(request.params)

        general_update(request.query, params)
        return JSONResponse(content={"message": "Database updated"}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)
