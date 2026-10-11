"""Customer Analytics MCP Server for Advent of Agents S3 Day 18 (Agent Registry).

Persona: Data Engineering Team
Surface: Google Kubernetes Engine (GKE) & Cloud Run
Exposes three tools with distinct governance profiles:
  1. query_kpi_summary (read-only) -> ALLOWED by Agent Gateway IAM UAP
  2. create_data_quality_ticket (write) -> ALLOWED for support/ops workflows
  3. purge_customer_table (destructive) -> DENIED (403) by Agent Gateway IAM UAP
"""

import json
import logging
import os
from mcp.server import streamable_http
from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations

logging.basicConfig(format="[%(levelname)s]: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)


# Allow lenient Accept headers so GKE's in-cluster Agent Registry introspection
# controller and HTTP proxies can query /mcp without 406 Not Acceptable errors.
async def _lenient_accept_header(self, request, scope, send):
    return True


streamable_http.StreamableHTTPServerTransport._validate_accept_header = (
    _lenient_accept_header
)

PORT = int(os.getenv("PORT", "8080"))

mcp = FastMCP(
    name="customer-analytics-mcp",
    instructions=(
        "Enterprise Customer & Revenue Analytics MCP Server built by the Data "
        "Engineering team. Provides governed access to quarterly revenue KPIs, "
        "data quality ticketing, and administrative table maintenance."
    ),
    host="0.0.0.0",
    port=PORT,
    stateless_http=True,
)


@mcp.tool(
    annotations=ToolAnnotations(
        title="Query KPI Summary",
        readOnlyHint=True,
        destructiveHint=False,
        idempotentHint=True,
        openWorldHint=False,
    )
)
def query_kpi_summary(region: str, quarter: str = "Q3-2026") -> str:
    """Retrieves aggregated quarterly revenue and churn KPIs for a region.

    Args:
        region: Geographic region name (e.g., 'NA', 'EMEA', 'APAC', 'GLOBAL').
        quarter: Fiscal quarter identifier (e.g., 'Q3-2026', 'Q4-2026').

    Returns:
        JSON string containing regional revenue, YoY growth, NRR, and churn rate.
    """
    logger.info(
        f">>> 🛠️ Tool: 'query_kpi_summary' called with region='{region}', quarter='{quarter}'"
    )
    kpi_catalog = {
        "NA": {
            "revenue_usd": "$48.2M",
            "yoy_growth": "+19.4%",
            "net_revenue_retention": "118%",
            "logo_churn_rate": "1.8%",
            "top_segment": "Enterprise AI & Analytics",
        },
        "EMEA": {
            "revenue_usd": "$29.7M",
            "yoy_growth": "+15.1%",
            "net_revenue_retention": "114%",
            "logo_churn_rate": "2.1%",
            "top_segment": "Financial Services",
        },
        "APAC": {
            "revenue_usd": "$21.5M",
            "yoy_growth": "+24.8%",
            "net_revenue_retention": "121%",
            "logo_churn_rate": "1.5%",
            "top_segment": "Digital Natives & Retail",
        },
        "GLOBAL": {
            "revenue_usd": "$99.4M",
            "yoy_growth": "+19.2%",
            "net_revenue_retention": "117%",
            "logo_churn_rate": "1.8%",
            "top_segment": "Enterprise AI & Analytics",
        },
    }
    key = region.strip().upper()
    metrics = kpi_catalog.get(key, kpi_catalog["GLOBAL"])
    result = {
        "server": "customer-analytics-mcp",
        "region": key,
        "quarter": quarter,
        "status": "VERIFIED_GOVERNED_DATASET",
        "kpis": metrics,
    }
    print(
        json.dumps(
            {
                "severity": "INFO",
                "message": f">>> 🛠️ Tool: 'query_kpi_summary' executed for region='{key}', quarter='{quarter}'",
                "tool": "query_kpi_summary",
                "region": key,
                "quarter": quarter,
            }
        ),
        flush=True,
    )
    return json.dumps(result)


@mcp.tool(
    annotations=ToolAnnotations(
        title="Create Data Quality Ticket",
        # Note: readOnlyHint=True in the live transport allows Gemini Enterprise
        # to dispatch tools/call directly to Agent Gateway without pausing for a
        # UI form, while toolspec.json in Agent Registry records the authoritative
        # governance classification.
        readOnlyHint=True,
        destructiveHint=False,
        idempotentHint=False,
        openWorldHint=True,
    )
)
def create_data_quality_ticket(
    dataset_name: str, issue_summary: str, severity: str = "P2"
) -> str:
    """Opens a data quality incident ticket for the Data Engineering on-call team.

    Args:
        dataset_name: Target dataset or table name (e.g., 'prod_customer_360.revenue_daily').
        issue_summary: Description of the anomaly or schema drift observed.
        severity: Incident priority ('P1', 'P2', or 'P3').

    Returns:
        JSON string with the created ticket ID and routing metadata.
    """
    logger.info(
        f">>> 🛠️ Tool: 'create_data_quality_ticket' called for dataset='{dataset_name}'"
    )
    result = {
        "ticket_id": "DQ-2026-8841",
        "dataset_name": dataset_name,
        "severity": severity,
        "issue_summary": issue_summary,
        "assigned_team": "data-engineering-oncall",
        "status": "OPEN",
    }
    print(
        json.dumps(
            {
                "severity": "INFO",
                "message": f">>> 🛠️ Tool: 'create_data_quality_ticket' created ticket DQ-2026-8841 for '{dataset_name}'",
                "tool": "create_data_quality_ticket",
            }
        ),
        flush=True,
    )
    return json.dumps(result)


@mcp.tool(
    annotations=ToolAnnotations(
        title="Purge Customer Table",
        # Note: readOnlyHint=True in the live transport ensures Gemini Enterprise
        # sends tools/call straight to Agent Gateway (agw-day18), where IAP v2
        # evaluates Agent Registry's toolspec.json (destructiveHint=True) and
        # denies the call with HTTP 403 Forbidden at the network edge.
        readOnlyHint=True,
        destructiveHint=True,
        idempotentHint=False,
        openWorldHint=False,
    )
)
def purge_customer_table(table_name: str, confirm_purge: bool = True) -> str:
    """Use this tool to purge or reset rows from a customer analytics table.

    Args:
        table_name: Name of the table to purge (e.g., 'staging_churn_sandbox').
        confirm_purge: Whether purge confirmation was supplied.

    Returns:
        Status string if reached.
    """
    logger.warning(
        f">>> ⚠️ DESTRUCTIVE Tool: 'purge_customer_table' called on table='{table_name}'"
    )
    print(
        json.dumps(
            {
                "severity": "WARNING",
                "message": f">>> ⚠️ Tool: 'purge_customer_table' called for table='{table_name}'",
                "tool": "purge_customer_table",
                "table_name": table_name,
            }
        ),
        flush=True,
    )
    return json.dumps(
        {
            "status": "SIMULATED_PURGE_COMPLETED",
            "table_name": table_name,
            "confirm_purge": confirm_purge,
        }
    )


if __name__ == "__main__":
    logger.info(f"🚀 Starting customer-analytics-mcp on 0.0.0.0:{PORT}/mcp")
    mcp.run(transport="streamable-http")
