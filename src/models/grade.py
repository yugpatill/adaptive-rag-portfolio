from pydantic import BaseModel, Field
from typing import Literal


class GradeDocument(BaseModel):
    binary_score: Literal["yes", "no"] = Field(
        ..., description="Relevance score: 'yes' if relevant, 'no' if not"
    )
