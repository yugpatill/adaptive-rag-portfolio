from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    ollama_base_url: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3.2", env="OLLAMA_MODEL")
    tavily_api_key: str = Field(default="", env="TAVILY_API_KEY")
    qdrant_url: str = Field(default="http://localhost:6333", env="QDRANT_URL")
    qdrant_collection: str = Field(default="documents", env="QDRANT_COLLECTION")
    mongodb_url: str = Field(default="mongodb://localhost:27017", env="MONGODB_URL")
    mongodb_db_name: str = Field(default="adaptive_rag", env="MONGODB_DB_NAME")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
