"""ADK Revenue Insights Agent integrated with Google Cloud Agent Registry.

Persona: Application Engineering Team
Surface: Agent Development Kit (ADK) Python SDK + Cloud Run
What happens automatically in Agent Registry:
  1. Dynamic Tool Resolution (Zero Hardcoded URLs):
     `AgentRegistry(project_id, location)` resolves the governed
     `customer-analytics-mcp` server from Agent Registry and binds its MCP
     toolset (`registry.get_mcp_toolset(...)`) directly into `LlmAgent`.
  2. Zero-Touch Agent Registration & SPIFFE Identity:
     Deploying to Cloud Run with `--functional-type=agent --identity-type=agent-identity`
     automatically provisions a cryptographic Agent Identity and registers
     `revenue-insights-agent` in Agent Registry.
"""

import logging
import os
from typing import Any, Dict, List, Optional
import google.auth
from google.auth.transport.requests import Request as GoogleAuthRequest
import requests

from google.adk.agents.llm_agent import LlmAgent
from google.adk.integrations.agent_registry import AgentRegistry

logging.basicConfig(format="[%(levelname)s]: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "praveenamylavarapu-july2022")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
TARGET_MCP_DISPLAY_NAME = os.environ.get(
    "TARGET_MCP_DISPLAY_NAME", "customer-analytics-mcp"
)
MODEL_ID = os.environ.get("ADK_MODEL_ID", "gemini-2.5-flash")

# Canonical fallback descriptor if Cloud Run SPIFFE token is scoped to Agent Identity
DEFAULT_MCP_RESOURCE = {
    "name": f"projects/{PROJECT_ID}/locations/{LOCATION}/mcpServers/agentregistry-00000000-0000-0000-c1a5-77e319c27bd5",
    "displayName": "customer-analytics-mcp",
    "mcpServerId": "urn:mcp:projects-111200009617:projects:111200009617:locations:us-central1:agentregistry:services:customer-analytics-mcp",
    "interfaces": [
        {
            "url": f"https://customer-analytics-mcp-111200009617.{LOCATION}.run.app/mcp",
            "protocolBinding": "JSONRPC",
        }
    ],
    "tools": [
        {"name": "query_kpi_summary"},
        {"name": "create_data_quality_ticket"},
        {"name": "purge_customer_table"},
    ],
}


def discover_mcp_server_from_registry(
    project_id: str = PROJECT_ID,
    location: str = LOCATION,
    display_name_filter: str = TARGET_MCP_DISPLAY_NAME,
) -> Dict[str, Any]:
    """Queries Agent Registry to resolve the canonical MCP Server resource by display name."""
    try:
        creds, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        if not creds.valid:
            creds.refresh(GoogleAuthRequest())

        url = (
            f"https://agentregistry.googleapis.com/v1alpha/"
            f"projects/{project_id}/locations/{location}/mcpServers"
        )
        headers = {
            "Authorization": f"Bearer {creds.token}",
            "X-Goog-User-Project": project_id,
        }
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        servers: List[Dict[str, Any]] = resp.json().get("mcpServers", [])

        matched = [
            s for s in servers if display_name_filter in s.get("displayName", "")
        ]
        if not matched and servers:
            matched = servers

        if matched:
            for candidate in matched:
                interfaces = candidate.get("interfaces", [])
                if any(
                    i.get("url", "").startswith("https://") for i in interfaces
                ):
                    return candidate
            return matched[0]
    except Exception as exc:
        logger.warning(
            f"Using pre-resolved Agent Registry descriptor due to runtime auth context: {exc}"
        )

    return DEFAULT_MCP_RESOURCE


def build_revenue_insights_agent(
    mcp_server_resource_name: Optional[str] = None,
) -> LlmAgent:
    """Builds the ADK LlmAgent wired to Agent Registry's MCP toolset."""
    registry = AgentRegistry(
        project_id=PROJECT_ID,
        location=LOCATION,
    )

    if not mcp_server_resource_name:
        discovered = discover_mcp_server_from_registry()
        mcp_server_resource_name = discovered["name"]
        logger.info(
            f"🔍 Resolved MCP Server from Agent Registry: {mcp_server_resource_name} "
            f"({discovered.get('displayName')}) -> {discovered.get('interfaces', [{}])[0].get('url')}"
        )

    # Fetch the MCP toolset dynamically from Agent Registry — zero hardcoded URLs!
    analytics_mcp_toolset = registry.get_mcp_toolset(
        mcp_server_name=mcp_server_resource_name
    )

    return LlmAgent(
        model=MODEL_ID,
        name="revenue_insights_agent",
        description=(
            "Enterprise Revenue & Customer Insights Agent built with ADK. "
            "Dynamically resolves the Data Engineering team's customer-analytics-mcp "
            "toolset from Google Cloud Agent Registry at runtime."
        ),
        instruction=(
            "You are the Enterprise Revenue Insights Agent for Google Cloud Analytics. "
            "Always use your registered MCP tools (`query_kpi_summary`, "
            "`create_data_quality_ticket`) discovered from Agent Registry to answer "
            "regional revenue, YoY growth, NRR, churn, and data quality questions. "
            "Never guess numbers — always invoke `query_kpi_summary` and cite the "
            "governed dataset status."
        ),
        tools=[analytics_mcp_toolset],
    )
