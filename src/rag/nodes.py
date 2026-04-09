import yaml
from pathlib import Path
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.documents import Document
from src.models.state import GraphState
from src.models.grade import GradeDocument
from src.models.route_identifier import RouteIdentifier
from src.llms.ollama import get_llm
from src.rag.retriever_setup import get_retriever
from src.config.settings import settings
from src.core.logger import get_logger
import os

logger = get_logger(__name__)

_PROMPTS_PATH = Path(__file__).parent.parent / "config" / "prompts.yaml"
with open(_PROMPTS_PATH) as f:
    _PROMPTS = yaml.safe_load(f)


def _build_chat_history(messages: list[dict]) -> list:
    history = []
    for msg in messages[-6:]:  # Last 3 exchanges
        if msg["role"] == "user":
            history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            history.append(AIMessage(content=msg["content"]))
    return history


def query_analysis_node(state: GraphState) -> dict:
    logger.info("==> query_analysis_node | query: %s", state["query"])
    llm = get_llm(temperature=0.0)
    structured_llm = llm.with_structured_output(RouteIdentifier)
    prompt = _PROMPTS["classify_prompt"].format(query=state["query"])
    result: RouteIdentifier = structured_llm.invoke([HumanMessage(content=prompt)])
    logger.info("Route decided: %s", result.route)
    return {"route": result.route, "rewrite_count": 0, "documents": []}


def retriever_node(state: GraphState) -> dict:
    logger.info("==> retriever_node | query: %s", state["query"])
    retriever = get_retriever(k=4)
    docs = retriever.invoke(state["query"])
    logger.info("Retrieved %d documents", len(docs))
    return {"documents": docs}


def grade_node(state: GraphState) -> dict:
    logger.info("==> grade_node | grading %d documents", len(state["documents"]))
    llm = get_llm(temperature=0.0)
    structured_llm = llm.with_structured_output(GradeDocument)
    relevant_docs = []

    for doc in state["documents"]:
        prompt = _PROMPTS["grading_prompt"].format(
            document=doc.page_content,
            query=state["query"],
        )
        result: GradeDocument = structured_llm.invoke([HumanMessage(content=prompt)])
        if result.binary_score == "yes":
            relevant_docs.append(doc)
            logger.info("Document RELEVANT: %s...", doc.page_content[:60])
        else:
            logger.info("Document IRRELEVANT: %s...", doc.page_content[:60])

    logger.info("%d / %d documents are relevant", len(relevant_docs), len(state["documents"]))
    return {"documents": relevant_docs}


def rewrite_node(state: GraphState) -> dict:
    logger.info("==> rewrite_node | rewrite_count=%d", state.get("rewrite_count", 0))
    llm = get_llm(temperature=0.3)
    prompt = _PROMPTS["rewrite_prompt"].format(query=state["query"])
    result = llm.invoke([HumanMessage(content=prompt)])
    new_query = result.content.strip()
    logger.info("Rewritten query: %s", new_query)
    return {
        "query": new_query,
        "rewrite_count": state.get("rewrite_count", 0) + 1,
        "documents": [],
    }


def generate_node(state: GraphState) -> dict:
    logger.info("==> generate_node | docs=%d", len(state.get("documents", [])))
    llm = get_llm(temperature=0.4)

    context = "\n\n---\n\n".join(
        doc.page_content for doc in state.get("documents", [])
    ) or "No specific documents retrieved."

    history = _build_chat_history(state.get("messages", []))
    chat_history_str = "\n".join(
        f"{'User' if isinstance(m, HumanMessage) else 'Assistant'}: {m.content}"
        for m in history
    )

    system = SystemMessage(content=_PROMPTS["system_prompt"])
    prompt_text = _PROMPTS["generate_prompt"].format(
        context=context,
        chat_history=chat_history_str or "No prior conversation.",
        query=state["query"],
    )

    messages = [system] + history + [HumanMessage(content=prompt_text)]
    result = llm.invoke(messages)
    generation = result.content.strip()
    logger.info("Generated answer (%d chars)", len(generation))
    return {"generation": generation}


def web_search_node(state: GraphState) -> dict:
    logger.info("==> web_search_node | query: %s", state["query"])
    os.environ["TAVILY_API_KEY"] = settings.tavily_api_key
    tool = TavilySearchResults(max_results=4, tavily_api_key=settings.tavily_api_key)
    results = tool.invoke(state["query"])

    docs = [
        Document(
            page_content=r.get("content", ""),
            metadata={"source": r.get("url", "web"), "title": r.get("title", "")},
        )
        for r in results
        if r.get("content")
    ]
    logger.info("Web search returned %d results", len(docs))
    return {"documents": docs}


def general_llm_node(state: GraphState) -> dict:
    logger.info("==> general_llm_node | query: %s", state["query"])
    llm = get_llm(temperature=0.5)
    history = _build_chat_history(state.get("messages", []))
    system = SystemMessage(content=_PROMPTS["system_prompt"])
    messages = [system] + history + [HumanMessage(content=state["query"])]
    result = llm.invoke(messages)
    generation = result.content.strip()
    logger.info("General LLM answer (%d chars)", len(generation))
    return {"generation": generation, "documents": []}
