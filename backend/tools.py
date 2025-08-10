import uuid
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Base classes for tools ---
class CanvasObject(BaseModel):
    """The most basic object on the canvas."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tool: str

class VisualTool(CanvasObject):
    """Base class for informational tools that have a defined bounding box and a label."""
    x: int
    y: int
    width: int
    height: int
    label: Optional[str] = None

class DrawingPrimitive(CanvasObject):
    """Base class for simple geometric shapes used for drawing."""
    color: str = "#4dc3ff" # Default to futuristic blue

# --- Informational Tools ---
class InfoBox(VisualTool):
    """Use for displaying key-value pairs or simple text statements."""
    tool: str = "InfoBox"
    data: Dict[str, Any]

class LineGraph(VisualTool):
    """Use to display time-series data or show the relationship between two variables."""
    tool: str = "LineGraph"
    series_data: List[float]

# --- Drawing Primitive Tools ---
class DrawRectangle(DrawingPrimitive):
    """Draws a rectangle."""
    tool: str = "DrawRectangle"
    x: int
    y: int
    width: int
    height: int

class DrawCircle(DrawingPrimitive):
    """Draws a circle."""
    tool: str = "DrawCircle"
    center_x: int
    center_y: int
    radius: int

class DrawLine(DrawingPrimitive):
    """Draws a straight line."""
    tool: str = "DrawLine"
    start_x: int
    start_y: int
    end_x: int
    end_y: int

# --- ASCII Art Tool ---
class DrawAscii(CanvasObject):
    """Draws multi-line ASCII art or text directly onto the canvas using a monospace font."""
    tool: str = "DrawAscii"
    x: int
    y: int
    text_content: str
    font_size: int = 16
    color: str = "#4dc3ff" # Add color field to DrawAscii

# --- The Tool Registry ---
# The backend uses this to understand all available tools.
TOOL_REGISTRY = {
    "InfoBox": {
        "class": InfoBox,
        "description": "Use for displaying key-value pairs or simple text statements."
    },
    "LineGraph": {
        "class": LineGraph,
        "description": "Use to display time-series data or show the relationship between two variables."
    },
    "DrawRectangle": {
        "class": DrawRectangle,
        "description": "Draws a rectangle. Use as a fundamental building block for complex drawings."
    },
    "DrawCircle": {
        "class": DrawCircle,
        "description": "Draws a circle. Use as a fundamental building block for complex drawings."
    },
    "DrawLine": {
        "class": DrawLine,
        "description": "Draws a straight line. Use as a fundamental building block for complex drawings."
    },
    "DrawAscii": {
        "class": DrawAscii,
        "description": "Draws multi-line ASCII art or text directly onto the canvas using a monospace font. Useful for terminal-like displays or simple text art."
    }
}
