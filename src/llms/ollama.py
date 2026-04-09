from langchain_ollama import ChatOllama
from src.config.settings import settings


def get_llm(temperature: float = 0.0) -> ChatOllama:
    return ChatOllama(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        temperature=temperature,
    )
