import io
import uuid
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.models import PointStruct
from src.rag.retriever_setup import get_qdrant_client, get_embeddings, create_collection_if_not_exists
from src.config.settings import settings
from src.core.logger import get_logger

logger = get_logger(__name__)

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150


def _extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n\n".join(
            page.extract_text() or "" for page in reader.pages
        )

    if ext == "docx":
        import docx2txt
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        try:
            return docx2txt.process(tmp_path)
        finally:
            os.unlink(tmp_path)

    if ext == "csv":
        import pandas as pd
        df = pd.read_csv(io.BytesIO(file_bytes))
        return df.to_string(index=False)

    # Default: treat as plain text
    return file_bytes.decode("utf-8", errors="replace")


async def process_and_upload(
    file_bytes: bytes,
    filename: str,
    description: str = "",
) -> dict:
    logger.info("Processing file: %s (%d bytes)", filename, len(file_bytes))

    raw_text = _extract_text(file_bytes, filename)
    if not raw_text.strip():
        raise ValueError(f"No text could be extracted from {filename}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(raw_text)
    logger.info("Split into %d chunks", len(chunks))

    docs = [
        Document(
            page_content=chunk,
            metadata={
                "source": filename,
                "description": description,
                "chunk_index": i,
            },
        )
        for i, chunk in enumerate(chunks)
    ]

    embeddings_model = get_embeddings()
    texts = [doc.page_content for doc in docs]
    vectors = embeddings_model.embed_documents(texts)

    client = get_qdrant_client()
    create_collection_if_not_exists(client)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "page_content": doc.page_content,
                "metadata": doc.metadata,
            },
        )
        for doc, vector in zip(docs, vectors)
    ]

    client.upsert(collection_name=settings.qdrant_collection, points=points)
    logger.info("Uploaded %d vectors to Qdrant for file: %s", len(points), filename)

    return {
        "filename": filename,
        "chunks": len(chunks),
        "status": "success",
    }
