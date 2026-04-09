from pydantic import BaseModel, Field
from typing import Literal


class RouteIdentifier(BaseModel):
    route: Literal["index", "general", "search"] = Field(
        ..., description="Which pipeline to use: index, general, or search"
    )
