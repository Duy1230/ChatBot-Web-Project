import json
from utils.data_process import markdown_to_hierarchical_json


class DocumentTree:

    def __init__(self, file_path=None):
        if file_path is not None:
            self.tree = self.load_tree(file_path)
        else:
            self.tree = {"type": "Root", "num_doc": 0,
                         "num_header": 0, "num_paragraph": 0, "children": []}

    def load_tree(self, file_path):
        """
        Loads a tree from a Json file then convert it to a dictionary
        """
        with open(file_path, "r", encoding="utf-8") as f:
            tree = json.load(f)
        self.tree = tree
        return tree

    def save_tree(self, file_path):
        """
        Saves the tree to a Json file
        """
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(self.tree, f)

    def get_tree(self):
        """
        Returns the tree
        """
        return self.tree

    def reset_tree(self):
        """
        Resets the tree
        """
        self.tree = {"type": "Root", "num_doc": 0,
                     "num_header": 0, "num_paragraph": 0, "children": []}

    def add_to_tree(self, doc_name, doc_markdown):
        output_json, paragraph_counts, header_counts = markdown_to_hierarchical_json(
            doc_markdown,
            markdown_name=doc_name,
            paragraph_start_index=self.tree['num_paragraph'],
            header_start_index=self.tree['num_header'])
        self.tree['children'].append(output_json)
        self.tree['num_doc'] += 1
        self.tree['num_paragraph'] += paragraph_counts
        self.tree['num_header'] += header_counts
        return self.tree


document_tree = DocumentTree()
