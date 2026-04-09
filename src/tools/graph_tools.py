from src.models.state import GraphState
from src.core.logger import get_logger

logger = get_logger(__name__)

MAX_REWRITES = 2


def route_query(state: GraphState) -> str:
    route = state.get("route", "general")
    logger.info("Routing query to: %s", route)
    if route == "index":
        return "retriever"
    if route == "search":
        return "web_search"
    return "general_llm"


def should_rewrite(state: GraphState) -> str:
    docs = state.get("documents", [])
    rewrite_count = state.get("rewrite_count", 0)

    if docs:
        logger.info("Relevant docs found — proceeding to generate")
        return "generate"

    if rewrite_count >= MAX_REWRITES:
        logger.info("Max rewrites reached (%d) — proceeding to generate anyway", rewrite_count)
        return "generate"

    logger.info("No relevant docs, rewrite_count=%d — rewriting query", rewrite_count)
    return "rewrite"
