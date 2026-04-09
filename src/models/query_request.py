from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="The user's question")
    session_id: str = Field(..., min_length=1, description="Unique session identifier")
