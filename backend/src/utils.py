import re


def process_message(message):
    # Replace \( and \) with $
    message = message.replace(r"\(", "$").replace(r"\)", "$")
    # Replace opening delimiters with ```math\n
    message = re.sub(r'\\\[(\s*\n)?', '```math\n', message)
    # Replace closing delimiters with \n```
    message = re.sub(r'(\n\s*)?\\]', '\n```', message)

    return message
