from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from src.config.settings import settings
from src.core.logger import get_logger

logger = get_logger(__name__)

_client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.mongodb_url)
    await _client.admin.command("ping")
    logger.info("Connected to MongoDB at %s", settings.mongodb_url)


async def close_mongo_connection() -> None:
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("MongoDB client is not initialized. Call connect_to_mongo() first.")
    return _client[settings.mongodb_db_name]
