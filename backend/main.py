import os
import sys
import json
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
from dotenv import load_dotenv

# --- Environment and API Key Validation ---
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("ERROR: GEMINI_API_KEY not found in .env file.")
    sys.exit(1)
genai.configure(api_key=API_KEY)

# --- App Initialization ---
app = FastAPI()

# --- Middleware (kept for the actual POST request) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# --- Manual OPTIONS handler for CORS preflight ---
@app.options("/prompt")
async def prompt_options():
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "http://localhost:8080",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

# --- Pydantic Models for API validation ---
class PromptRequest(BaseModel):
    prompt: str
    current_objects: List[Dict[str, Any]]

# Import our tool definitions
from tools import TOOL_REGISTRY

# --- Helper to build the system prompt ---
def get_system_prompt():
    tool_definitions = ""
    for name, info in TOOL_REGISTRY.items():
        tool_definitions += f"- {name}: {info['description']}\n"

    return f"""You are an expert UI/UX designer and system architect. 
Your goal is to create a dynamic, non-linear visual display on a canvas.

**PRIMARY DIRECTIVE:** Provide a clear textual answer to the user's request, typically within an `InfoBox`. Additionally, generate visual representations or drawings only when they meaningfully complement the textual answer or are explicitly requested by the user. Strive for clarity and relevance in all visual output.

**CRITICAL RULES:**
1.  The canvas background is black. All elements MUST be high-contrast. All text MUST be futuristic blue (#4dc3ff).
2.  You MUST use the exact field names defined in the tools.
3.  Do NOT invent new fields. Stick to the defined tool schema.
4.  **ASCII Art Specific**: When generating `DrawAscii` content, ensure all backslash characters (`\") are escaped as double backslashes (`\\`) within the `text_content` field. For example, a single backslash in ASCII art should become `\\` in the JSON.

**Workflow:**
1.  **Analyze the Request**: Understand what the user wants to see.
2.  **Choose the Right Tools**: From the list of available tools, select the best ones to represent the information.
3.  **Visual Representation**: For general drawing requests (e.g., 'draw a cat', 'show me a house', 'display a welcome message'), **prioritize using the `DrawAscii` tool**. You can compose complex visuals from characters. Only use `DrawRectangle`, `DrawCircle`, or `DrawLine` if explicitly asked for a geometric shape or if it's part of a graph.
4.  **Graph Data**: When generating a `LineGraph`, ensure the `data` field is a list of `[x, y]` pairs (e.g., `"data": [[1, 10], [2, 15]]`) and include a `label` (e.g., `"label": "Sales Trend"`).
5.  **Manage the Canvas**: You can add, remove, or modify objects from the `current_objects` list.
6.  **Optimize Layout**: Arrange all components (new and existing) on the canvas. Your goal is to maximize whitespace and create a clean, balanced, and aesthetically pleasing composition. Do NOT simply stack new elements vertically. Re-evaluate the entire layout and relocate existing objects if it improves the overall design. Use the entire canvas space (1920x1080) effectively.

**Available Tools:**
{tool_definitions}

Respond ONLY with a valid JSON object in the format: `{{"canvas_objects": [...]}}`.
"""


# --- API Endpoint ---
@app.post("/prompt")
async def handle_prompt(request: PromptRequest):
    print(f"\n--- New Request: {request.prompt} ---")
    model = genai.GenerativeModel('gemini-1.5-pro-latest') # Ensure using Pro model

    system_prompt = get_system_prompt()
    user_prompt = f"""User Prompt: \"{request.prompt}\"\n\nCurrent Canvas Objects: {request.current_objects}\n"""

    try:
        response = model.generate_content(
            [system_prompt, user_prompt],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text
        print(f"AI Raw Response: {response_text}")
        
        if response_text.strip().startswith('```json'):
            response_text = response_text.strip()[7:-3].strip()

        parsed_json = json.loads(response_text)
        print("Final Output Sent to Frontend.")
        return parsed_json

    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        print(f"Original non-JSON response: {locals().get('response_text', 'N/A')}")
        raise HTTPException(status_code=500, detail="AI returned invalid JSON.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

# --- Server Startup ---
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
