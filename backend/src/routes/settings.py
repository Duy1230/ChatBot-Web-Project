from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json


router = APIRouter()

# Path to the JSON file that stores settings

settings_file = 'settings.json'

# Helper function to read settings


def read_settings():
    try:
        with open(settings_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

# Helper function to write settings


def write_settings(settings):
    with open(settings_file, 'w') as f:
        json.dump(settings, f, indent=4)


@router.get("/getSettings", description="Get settings")
async def get_settings():
    settings = read_settings()

    return settings


class UpdateSettingsRequest(BaseModel):
    key: str
    value: str


@router.post("/updateSettings", description="Update settings")
async def update_settings(request: UpdateSettingsRequest):
    settings = read_settings()

    settings[request.key] = request.value
    write_settings(settings)
    return JSONResponse(content={"status": "success", "updated_setting": {request.key: request.value}}, status_code=200)
