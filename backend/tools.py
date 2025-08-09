
import uuid
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class VisualTool(BaseModel):
    """Base class for all visual tools."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tool: str
    x: int
    y: int
    width: int
    height: int
    label: str

class InfoBox(VisualTool):
    """Use for displaying key-value pairs or simple text statements."""
    tool: str = "InfoBox"
    data: Dict[str, Any]

class LineGraph(VisualTool):
    """Use to display time-series data or show the relationship between two variables."""
    tool: str = "LineGraph"
    series_data: List[float]

# The registry of all available tools.
# The backend will use this to show the LLM what tools are available.
TOOL_REGISTRY = {
    "InfoBox": {
        "class": InfoBox,
        "description": "Use for displaying key-value pairs or simple text statements."
    },
    "LineGraph": {
        "class": LineGraph,
        "description": "Use to display time-series data or show the relationship between two variables."
    }
}
