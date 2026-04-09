from langgraph.graph import StateGraph, END
from src.models.state import GraphState
from src.rag.nodes import (
    query_analysis_node,
    retriever_node,
    grade_node,
    rewrite_node,
    generate_node,
    web_search_node,
    general_llm_node,
)
from src.tools.graph_tools import route_query, should_rewrite
from src.core.logger import get_logger

logger = get_logger(__name__)


def build_graph():
    graph = StateGraph(GraphState)

    # Register all nodes
    graph.add_node("query_analysis", query_analysis_node)
    graph.add_node("retriever", retriever_node)
    graph.add_node("grade", grade_node)
    graph.add_node("rewrite", rewrite_node)
    graph.add_node("generate", generate_node)
    graph.add_node("web_search", web_search_node)
    graph.add_node("general_llm", general_llm_node)

    # Entry point
    graph.set_entry_point("query_analysis")

    # After query_analysis: route to retriever, web_search, or general_llm
    graph.add_conditional_edges(
        "query_analysis",
        route_query,
        {
            "retriever": "retriever",
            "web_search": "web_search",
            "general_llm": "general_llm",
        },
    )

    # After retriever: grade the documents
    graph.add_edge("retriever", "grade")

    # After grade: either rewrite or generate
    graph.add_conditional_edges(
        "grade",
        should_rewrite,
        {
            "rewrite": "rewrite",
            "generate": "generate",
        },
    )

    # After rewrite: go back to retriever
    graph.add_edge("rewrite", "retriever")

    # After web_search: generate
    graph.add_edge("web_search", "generate")

    # After general_llm: skip generate (it sets generation itself)
    graph.add_edge("general_llm", END)

    # After generate: done
    graph.add_edge("generate", END)

    compiled = graph.compile()
    logger.info("LangGraph compiled successfully")
    return compiled


rag_graph = build_graph()
