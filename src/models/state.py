from typing import TypedDict, Annotated
from langchain_core.documents import Document
import operator


class GraphState(TypedDict):
    query: str
    session_id: str
    messages: list[dict]
    documents: Annotated[list[Document], operator.add]
    route: str
    generation: str
    rewrite_count: int
