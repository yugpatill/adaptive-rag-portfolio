from datetime import datetime, timezone
from src.db.mongo_client import get_database
from src.core.logger import get_logger

logger = get_logger(__name__)

COLLECTION = "chat_history"


async def save_message(session_id: str, role: str, content: str) -> None:
    db = get_database()
    collection = db[COLLECTION]
    await collection.insert_one(
        {
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc),
        }
    )
    logger.info("Saved %s message for session %s", role, session_id)


async def get_history(session_id: str) -> list[dict]:
    db = get_database()
    collection = db[COLLECTION]
    cursor = collection.find(
        {"session_id": session_id},
        {"_id": 0, "role": 1, "content": 1, "timestamp": 1},
    ).sort("timestamp", 1)
    messages = await cursor.to_list(length=50)
    return messages


async def clear_history(session_id: str) -> None:
    db = get_database()
    collection = db[COLLECTION]
    result = await collection.delete_many({"session_id": session_id})
    logger.info("Cleared %d messages for session %s", result.deleted_count, session_id)
