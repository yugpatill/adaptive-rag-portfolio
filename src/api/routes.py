from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from fastapi.responses import JSONResponse
from src.models.query_request import QueryRequest
from src.memory.chat_history_mongo import save_message, get_history, clear_history
from src.rag.document_upload import process_and_upload
from src.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "csv", "txt"}


@router.post("/query")
async def query_rag(request: QueryRequest):
    from src.rag.graph_builder import rag_graph

    logger.info("Query received | session=%s | query=%s", request.session_id, request.query)

    history = await get_history(request.session_id)

    initial_state = {
        "query": request.query,
        "session_id": request.session_id,
        "messages": history,
        "documents": [],
        "route": "",
        "generation": "",
        "rewrite_count": 0,
    }

    try:
        final_state = await rag_graph.ainvoke(initial_state)
    except Exception as e:
        logger.error("Graph execution failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"RAG pipeline error: {str(e)}")

    generation = final_state.get("generation", "")
    if not generation:
        generation = "I was unable to generate a response. Please try again."

    route = final_state.get("route", "general")
    sources = [
        {
            "content": doc.page_content[:200],
            "source": doc.metadata.get("source", "unknown"),
            "title": doc.metadata.get("title", ""),
        }
        for doc in final_state.get("documents", [])
    ]

    await save_message(request.session_id, "user", request.query)
    await save_message(request.session_id, "assistant", generation)

    return {
        "answer": generation,
        "route": route,
        "sources": sources,
        "session_id": request.session_id,
    }


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    x_description: str = Header(default=""),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")

    try:
        result = await process_and_upload(file_bytes, file.filename, x_description)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Document upload failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    return result


@router.get("/history/{session_id}")
async def get_session_history(session_id: str):
    try:
        messages = await get_history(session_id)
    except Exception as e:
        logger.error("Failed to retrieve history: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve chat history.")
    return {"session_id": session_id, "messages": messages}


@router.delete("/history/{session_id}")
async def clear_session_history(session_id: str):
    try:
        await clear_history(session_id)
    except Exception as e:
        logger.error("Failed to clear history: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to clear chat history.")
    return {"session_id": session_id, "status": "cleared"}
