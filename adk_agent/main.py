"""FastAPI / A2A entrypoint for `revenue-insights-agent` on Cloud Run."""

import logging
import os
from fastapi import FastAPI
from pydantic import BaseModel

from agent import (
    LOCATION,
    MODEL_ID,
    PROJECT_ID,
    TARGET_MCP_DISPLAY_NAME,
    build_revenue_insights_agent,
    discover_mcp_server_from_registry,
)
from google.adk.runners import InMemoryRunner
from google.genai import types as genai_types

logging.basicConfig(format="[%(levelname)s]: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Revenue Insights Agent (ADK + Agent Registry)",
    version="1.0.0",
)


class QueryRequest(BaseModel):
    prompt: str = "What is the Q3-2026 revenue and YoY growth for NA and APAC?"


@app.get("/")
def health():
    return {
        "agent": "revenue-insights-agent",
        "framework": "google-adk",
        "project": PROJECT_ID,
        "location": LOCATION,
        "status": "healthy",
    }


@app.get("/.well-known/agent.json")
@app.get("/.well-known/agent-card.json")
def agent_card():
    """Exposes the A2A Agent Card for Agent Registry & peer agent introspection."""
    service_url = os.environ.get(
        "SERVICE_URL",
        f"https://revenue-insights-agent-111200009617.{LOCATION}.run.app",
    )
    return {
        "name": "revenue-insights-agent",
        "description": (
            "Enterprise Revenue & Customer Insights Agent built by the Application Team "
            "using ADK. Dynamically resolves MCP tools from Google Cloud Agent Registry."
        ),
        "url": service_url,
        "version": "1.0.0",
        "protocolVersion": "0.2.1",
        "capabilities": {
            "streaming": False,
            "pushNotifications": False,
        },
        "defaultInputModes": ["text/plain"],
        "defaultOutputModes": ["application/json", "text/plain"],
        "skills": [
            {
                "id": "regional-revenue-kpi-analysis",
                "name": "Regional Revenue & Churn KPI Analysis",
                "description": (
                    "Synthesizes quarterly regional revenue, YoY growth, NRR, and churn "
                    "metrics by dynamically resolving customer-analytics-mcp from Agent Registry."
                ),
                "tags": ["revenue", "kpi", "analytics", "agent-registry", "adk"],
            }
        ],
    }


@app.get("/discover")
def discover_from_registry():
    """Demonstrates live runtime resolution of customer-analytics-mcp from Agent Registry."""
    mcp_server = discover_mcp_server_from_registry()
    return {
        "agent": "revenue-insights-agent",
        "registry_location": f"projects/{PROJECT_ID}/locations/{LOCATION}",
        "target_mcp_display_name": TARGET_MCP_DISPLAY_NAME,
        "resolved_mcp_server": {
            "name": mcp_server.get("name"),
            "displayName": mcp_server.get("displayName"),
            "mcpServerId": mcp_server.get("mcpServerId"),
            "endpoint_url": mcp_server.get("interfaces", [{}])[0].get("url"),
            "tools": [t.get("name") for t in mcp_server.get("tools", [])],
        },
    }


@app.post("/query")
async def run_query(req: QueryRequest):
    """Runs the ADK LlmAgent using the MCP toolset dynamically fetched from Agent Registry."""
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "TRUE")
    discovered = discover_mcp_server_from_registry()
    adk_agent = build_revenue_insights_agent(
        mcp_server_resource_name=discovered["name"]
    )
    runner = InMemoryRunner(agent=adk_agent, app_name="revenue_insights_app")
    session = await runner.session_service.create_session(
        app_name="revenue_insights_app", user_id="demo_user"
    )
    content = genai_types.Content(
        role="user", parts=[genai_types.Part.from_text(text=req.prompt)]
    )
    final_text = ""
    tool_calls = []
    async for event in runner.run_async(
        user_id="demo_user", session_id=session.id, new_message=content
    ):
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.function_call:
                    tool_calls.append(
                        {
                            "tool": part.function_call.name,
                            "args": dict(part.function_call.args or {}),
                        }
                    )
                if part.text:
                    final_text += part.text

    return {
        "agent": "revenue-insights-agent",
        "model": MODEL_ID,
        "resolved_from_agent_registry": {
            "mcp_server_resource": discovered.get("name"),
            "endpoint_url": discovered.get("interfaces", [{}])[0].get("url"),
        },
        "tool_calls_executed": tool_calls,
        "response": final_text.strip(),
    }
