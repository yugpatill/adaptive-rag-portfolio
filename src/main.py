from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.db.mongo_client import connect_to_mongo, close_mongo_connection
from src.api.routes import router
from src.core.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Adaptive RAG API...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down Adaptive RAG API...")
    await close_mongo_connection()


app = FastAPI(
    title="Adaptive RAG API",
    description="Intelligent RAG chatbot that routes queries across vector search, web search, and general LLM knowledge.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Adaptive RAG API"}
