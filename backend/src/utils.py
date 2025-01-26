import re
import json
import os


def process_message(message):
    # Replace \( and \) with $
    message = message.replace(r"\(", "$").replace(r"\)", "$")
    # Replace opening delimiters with ```math\n
    message = re.sub(r'\\\[(\s*\n)?', '```math\n', message)
    # Replace closing delimiters with \n```
    message = re.sub(r'(\n\s*)?\\]', '\n```', message)

    return message


def load_settings(attribute_name):
    settings_path = "./settings.json"
    with open(settings_path, "r") as f:
        settings = json.load(f)
    return settings.get(attribute_name)


def get_current_settings():
    return {
        "MODEL_NAME": load_settings("MODEL_NAME"),
        "TAVILY_MAX_RESULT": load_settings("TAVILY_MAX_RESULT"),
        "IMAGE_WIDTH": load_settings("IMAGE_WIDTH"),
        "IMAGE_HEIGHT": load_settings("IMAGE_HEIGHT")
    }
