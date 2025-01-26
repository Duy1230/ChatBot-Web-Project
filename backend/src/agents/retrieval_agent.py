from src.agents.template_agent import *
import json
import os
from langchain.prompts import PromptTemplate
from src.utils import get_current_settings


load_dotenv()

settings = get_current_settings()
script_dir = os.path.dirname(os.path.abspath(__file__))
settings_path = os.path.join(script_dir, "..", "..", "settings.json")


class RetrievalAgent(TemplateAgent):
    def __init__(self, tools: list, agent_name: str, model_name=settings["MODEL_NAME"]):
        super().__init__(tools, agent_name, model_name)


retrieval_agent = RetrievalAgent([], "retrieval_agent")
