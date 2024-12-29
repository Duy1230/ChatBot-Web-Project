import re
import json


def markdown_to_hierarchical_json(markdown_text, markdown_name="default",
                                  header_start_index=0, paragraph_start_index=0):
    """
    Converts Markdown text into a hierarchical JSON structure.

    Args:
        markdown_text: The Markdown text to process.

    Returns:
        A JSON object representing the hierarchical structure.
    """
    root = {"type": "Document", "text": markdown_name, "children": []}
    lines = markdown_text.split("\n")
    stack = [root]  # Use a stack to track the current parent
    paragraph_text = ""

    paragraph_id = 0
    header_id = 0
    i = 0
    while i < len(lines):
        line = lines[i]

        # Skip empty lines
        if not line.strip():
            i += 1
            continue

        # Check for headers
        header_match = re.match(r"^(#+)\s+(.*)", line)
        if header_match:
            if len(paragraph_text.strip()) != 0:
                if len(stack[-1]["children"]) != 0:
                    stack[-1]["children"][-1]["text"] += paragraph_text.strip()
                    paragraph_text = ""
                else:
                    new_paragraph = {"type": "Paragraph",
                                     "index": paragraph_start_index + paragraph_id,
                                     "id": markdown_name + "_" + str(paragraph_start_index + paragraph_id),
                                     "text": paragraph_text.strip()}
                    stack[-1]["children"].append(new_paragraph)
                    paragraph_text = ""
                    paragraph_id += 1

            level = len(header_match.group(1))
            text = header_match.group(2).strip()
            new_header = {"type": "Header",
                          "index": header_start_index + header_id,
                          "text": text,
                          "begin": paragraph_start_index + paragraph_id,
                          "end": paragraph_start_index,
                          "children": []}

            if stack[-1]["type"] != "Document" and len(stack[-1]["children"]) == 0:
                stack[-1]["end"] = paragraph_start_index + paragraph_id
            elif stack[-1]["type"] != "Document":
                stack[-1]["end"] = paragraph_start_index + paragraph_id - 1

            # Adjust stack based on header level
            while len(stack) > level:
                stack.pop()
                if stack[-1]["type"] != "Document":
                    stack[-1]["end"] = paragraph_start_index + paragraph_id - 1

            stack[-1]["children"].append(new_header)
            stack.append(new_header)
            header_id += 1
            i += 1
            continue

        # CURRENTLY THIS NEED MODIFICATION TO WORK
        # Check for figures (assuming a line with an image, followed by a caption)
        # if line.strip().startswith("!"):
        #     if i + 1 < len(lines) and lines[i+1].strip().startswith("Figure"):
        #         figure_caption = lines[i+1].strip()
        #         new_figure = {"type": "Figure", "caption": figure_caption, "image": line.strip()}
        #         stack[-1]["children"].append(new_figure)
        #         i += 2
        #         continue

        # Check for Footnotes
        # if line.strip().startswith("<sup>"):
        #   footnote = {"type": "Footnote", "text": line.strip()}
        #   stack[-1]["children"].append(footnote)
        #   i += 1
        #   continue

        # Otherwise, treat as a paragraph
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#+)\s+(.*)", lines[i]):
            if lines[i].strip().startswith("!") and i + 1 < len(lines) and lines[i+1].strip().startswith("Figure"):
                break
            # if lines[i].strip().startswith("<sup>"):
            #   break
            paragraph_text += lines[i] + " "
            i += 1

        if len(paragraph_text.strip()) > 200:
            new_paragraph = {"type": "Paragraph",
                             "index": paragraph_start_index + paragraph_id,
                             "id": markdown_name + "_" + str(paragraph_start_index + paragraph_id),
                             "text": paragraph_text.strip()}
            stack[-1]["children"].append(new_paragraph)
            paragraph_text = ""
            paragraph_id += 1

    while stack[-1]["type"] != "Document":
        stack[-1]["end"] = paragraph_start_index + paragraph_id - 1
        stack.pop()

    return root, paragraph_id, header_id


def add_to_tree(document_tree, doc_name, doc_markdown):
    output_json, paragraph_counts, header_counts = markdown_to_hierarchical_json(
        doc_markdown,
        markdown_name=doc_name,
        paragraph_start_index=document_tree['num_paragraph'],
        header_start_index=document_tree['num_header'])
    document_tree['children'].append(output_json)
    document_tree['num_doc'] += 1
    document_tree['num_paragraph'] += paragraph_counts
    document_tree['num_header'] += header_counts
    return document_tree


def convert_to_markdown(data):
    """
    Converts a nested dictionary representing a document structure into Markdown format.

    Args:
        data: A dictionary representing the document structure.

    Returns:
        A string containing the Markdown formatted document.
    """

    markdown_output = ""

    def process_item(item, level=0):
        nonlocal markdown_output
        if item["type"] == "Header":
            markdown_output += "#" * level + " " + item["text"] + "\n\n"
        elif item["type"] == "Paragraph":
            if "id" in item:
                markdown_output += f'<a id="{item["id"]}"></a>'

            markdown_output += item["text"] + "\n\n"

        if "children" in item:
            for child in item["children"]:
                process_item(child, level + 1)

    process_item(data, level=1)  # Start with level 1 for the top-level header
    return markdown_output


def merge_documents(indices, lengths, documents, max_length=40000):
    """
    Merges documents to minimize the number of documents while respecting the max_length constraint.

    Args:
        indices: List of document indices.
        lengths: List of document lengths.
        documents: List of document strings.
        max_length: Maximum allowed length for a merged document.

    Returns:
        Tuple of (merged_indices, merged_lengths, merged_documents).
    """
    # Create a list of tuples (length, index, document) for sorting
    items = sorted(zip(lengths, indices, documents))

    merged_indices = []
    merged_lengths = []
    merged_documents = []

    while items:
        current_length, current_index, current_document = items.pop(0)  # Get the shortest document
        combined_length = current_length
        combined_indices = [current_index]
        combined_document = current_document

        # Greedily merge with other documents if possible
        i = 0
        while i < len(items):
            next_length, next_index, next_document = items[i]
            if combined_length + next_length <= max_length:
                combined_length += next_length
                combined_indices.append(next_index)
                combined_document += " " + next_document  # Or any desired separator
                items.pop(i)  # Remove the merged document
            else:
                i += 1

        merged_indices.append(combined_indices)
        merged_lengths.append(combined_length)
        merged_documents.append(combined_document)

    return merged_indices, merged_lengths, merged_documents