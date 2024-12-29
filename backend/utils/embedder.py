from sentence_transformers import SentenceTransformer
import faiss
import numpy as np


class SentenceEmbedder:
    """
    A class to embed sentences using a SentenceTransformer model and store them in a FAISS index.
    This class avoids reloading the model every time you want to embed or search.
    """

    def __init__(self, model_name='multi-qa-mpnet-base-dot-v1'):
        """
        Initializes the SentenceEmbedder with a SentenceTransformer model.

        Args:
            model_name: The name of the SentenceTransformer model to use.
        """
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.faiss_index = faiss.IndexFlatL2(
            self.dimension)  # Initialize an empty index

    def embed_documents(self, documents):
        """
        Embeds a list of documents and adds them to the FAISS index.

        Args:
            documents: A list of strings (documents or sentences).
        """
        embeddings = self.model.encode(documents)
        self.faiss_index.add(np.array(embeddings).astype('float32'))

    def search(self, query_sentence, k=3):
        """
        Searches the FAISS index for the k nearest neighbors to a query sentence.

        Args:
            query_sentence: The sentence to search for.
            k: The number of nearest neighbors to retrieve.

        Returns:
            A tuple containing:
                - distances: A list of distances to the nearest neighbors.
                - indices: A list of indices of the nearest neighbors in the index.
        """
        query_embedding = self.model.encode([query_sentence])
        distances, indices = self.faiss_index.search(
            np.array(query_embedding).astype('float32'), k)
        return distances, indices

    def save(self, file_path):
        """
        Saves the FAISS index to a file.
        """
        faiss.write_index(self.faiss_index, file_path)

    def load(self, file_path):
        """
        Loads the FAISS index from a file.
        """
        self.faiss_index = faiss.read_index(file_path)


embedder = SentenceEmbedder()
