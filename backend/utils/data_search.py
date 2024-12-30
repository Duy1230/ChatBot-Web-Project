from utils.data_process import convert_to_markdown, merge_documents, filter_indices_and_ranges


def extract_data_by_type(node, target_type, extracted_data=None):
    """
    Traverses a hierarchical JSON structure and extracts data of a specific type.

    Args:
        node: The current node being visited in the traversal.
        target_type: The type of data to extract (e.g., "Paragraph", "Header").
        extracted_data: A list to store the extracted data (optional, for recursion).

    Returns:
        A list of extracted data of the specified type.
    """
    if extracted_data is None:
        extracted_data = []

    if node["type"] == target_type:
        if target_type == "Figure":
            # Extract caption for figures
            extracted_data.append(node["caption"])
        else:
            extracted_data.append(node["text"])

    if "children" in node:
        for child in node["children"]:
            extract_data_by_type(child, target_type, extracted_data)

    return extracted_data


def tree_search(node, search_field, search_value,
                node_type=None, doc_name=None, extracted_data=None):
    """
    Traverses a hierarchical JSON structure and extracts data of a specific type.

    Args:
        node: The current node being visited in the traversal.
        target_type: The type of data to extract (e.g., "Paragraph", "Header").
        extracted_data: A list to store the extracted data (optional, for recursion).

    Returns:
        A list of extracted data of the specified type.
    """
    if extracted_data is None:
        extracted_data = []

    # Jump into the branch if document name is given
    if node["type"] == "Root" and doc_name != None:
        for children in node['children']:
            if children['text'] == doc_name:
                node = children

    if search_field in node:
        if node[search_field] == search_value:
            if not node_type:
                extracted_data.append(node)
            elif node_type == node['type']:
                extracted_data.append(node)

    if "children" in node:
        for child in node["children"]:
            tree_search(child, search_field, search_value,
                        node_type, doc_name, extracted_data)

    return extracted_data


def header_search(node, paragraph_index, doc_name=None, nearest_header=None, document=None):
    """
    Traverses a hierarchical JSON structure and extracts data of a specific type.

    Args:
        document_index: The index of the document
        nearest_header: Used to find nearest header to the index (optional, for recursion).
        document: The document (optional, for recursion).

    Returns:
        A list of extracted data of the specified type.
    """
    if nearest_header is None:
        nearest_header = float('inf')
    if document is None:
        document = []

    # Jump into the branch if document name is given
    if node["type"] == "Root":
        for children in node['children']:
            if children['text'] == doc_name:
                node = children

    if node["type"] == "Header" and node["begin"] <= paragraph_index:
        distance = abs(node["begin"] - paragraph_index)
        if distance < nearest_header:
            nearest_header = distance
            document = node

    if "children" in node:
        for child in node["children"]:
            document = header_search(
                child, paragraph_index, doc_name, nearest_header, document)

    return document


def find_unique_header(document_tree, paragraphs_id_list):
    header_indices = []
    paragraph_indices = []
    ranges = []
    documents = []
    headers = []
    for idx in paragraphs_id_list:
        doc_name, index = idx.split("_")
        header = header_search(document_tree, int(index), doc_name)
        header_indices.append(header['index'])
        paragraph_indices.append(int(index))
        ranges.append([header['begin'], header['end']])
        documents.append(doc_name)

    filter_header_indices = filter_indices_and_ranges(header_indices, ranges)

    header_lengths = []
    for header_index in filter_header_indices:
        doc_name = documents[header_indices.index(header_index)]
        paragraph_index = paragraph_indices[header_indices.index(header_index)]
        header = convert_to_markdown(
            header_search(document_tree, paragraph_index, doc_name)
        )
        headers.append(header)
        header_lengths.append(len(str(header)))

    merged_indices, merged_lengths, merged_documents = merge_documents(
        filter_header_indices, header_lengths, headers)
    return merged_indices, merged_documents, merged_lengths, filter_header_indices, header_lengths, ranges


def extract_headers_and_paragraphs_with_markdown(tree):
    """
    Extracts headers and paragraphs from a tree structure (representing a markdown file)
    and returns them as a dictionary. Headers are formatted with appropriate markdown 
    level indicators (#, ##, ###, etc.).

    Args:
        tree: A dictionary representing the tree structure.

    Returns:
        A dictionary where keys are header indices or paragraph IDs and values are 
        the corresponding header or paragraph text. Header values are prefixed with 
        markdown header level indicators.
    """

    result = {}

    def traverse(node, level=1):
        if node["type"] == "Header":
            header_prefix = "#" * level  # Create header prefix based on level
            result[str(node["index"])] = f"{header_prefix} {node['text']}"

            if "children" in node:
                for child in node["children"]:
                    traverse(child, level + 1)  # Increase level for children
        elif node["type"] == "Paragraph":
            result[node["id"]] = node["text"]
        elif "children" in node:
            for child in node["children"]:
                # Maintain level for non-header children
                traverse(child, level)

    traverse(tree)
    return result
