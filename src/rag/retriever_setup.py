from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_qdrant import QdrantVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.vectorstores import VectorStoreRetriever
from src.config.settings import settings
from src.core.logger import get_logger

logger = get_logger(__name__)

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
VECTOR_SIZE = 384


def get_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def get_qdrant_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url)


def create_collection_if_not_exists(client: QdrantClient) -> None:
    existing = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        logger.info("Created Qdrant collection: %s", settings.qdrant_collection)
    else:
        logger.info("Qdrant collection already exists: %s", settings.qdrant_collection)


def get_retriever(k: int = 4) -> VectorStoreRetriever:
    client = get_qdrant_client()
    create_collection_if_not_exists(client)
    embeddings = get_embeddings()
    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=settings.qdrant_collection,
        embedding=embeddings,
    )
    return vectorstore.as_retriever(search_kwargs={"k": k})