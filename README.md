# 🎃 Advent of Agents — Season 3, Day 18: Agent Registry

**Single Source of Truth: How Agent Registry Automatically Connects Every Persona Across Google Cloud**

> *"How do we maintain a single source of truth of all active agents, MCP servers, and tools across our organization — while letting Data Analysts, Data Engineers, Developers, Application Teams, Business Users, and Security Admins work in the Google Cloud surfaces they already love?"*

This repository contains the live demo workloads, configurations, and step-by-step runnable scripts for **Day 18** of Google Cloud's **Advent of Agents (Season 3: Agent Governance & Security)** on **Gemini Enterprise Agent Platform**.

---

## 👥 The 5 Everyday Personas & What Happens *Automatically* in Agent Registry

Every beat of the demo follows a three-part story:
1. **Why This Persona Uses This Surface** for their everyday job
2. **What Happens AUTOMATICALLY in Agent Registry** behind the scenes (zero manual toil)
3. **The Value Addition** (answering our top customer questions **Q1, Q2, and Q3**)

| Beat | Persona & Surface | Why They Use This Surface | What Happens *Automatically* in Agent Registry | Script |
| :--- | :--- | :--- | :--- | :--- |
| **Beat 0** | **Data Analyst & Platform Admin**<br>*(BigQuery & Gemini Enterprise)* | Analysts query enterprise data in BigQuery and use Gemini Enterprise assistants out of the box. | Enabling APIs **automatically backfills** 25+ Google Cloud remote MCP servers (`bigquery.googleapis.com`, `agentregistry.googleapis.com`, `dataplex.googleapis.com`) in `global`, plus built-in Gemini Enterprise & Agent Runtime agents (**Q2**). | [`scripts/00_verify_backfill.sh`](./scripts/00_verify_backfill.sh) |
| **Beat 1** | **Data Engineering Team**<br>*(Google Kubernetes Engine)* | Data Engineers package governed analytics & data-quality tools as containerized `FastMCP` microservices (`customer-analytics-mcp`) on GKE. | Adding `registry.gke.io/functional-type: "MCP_SERVER"` and `modelcontextprotocol.info/urls` causes GKE's in-cluster controller to **automatically introspect `/mcp`** and register the server + its 3 tools (`query_kpi_summary`, `create_data_quality_ticket`, `purge_customer_table`) (**Q1**). | [`scripts/01_deploy_gke_mcp.sh`](./scripts/01_deploy_gke_mcp.sh) |
| **Beat 2** | **Developer**<br>*(Antigravity IDE / Gemini CLI)* | Developers prototype new agents inside Antigravity IDE and need to discover existing tools before writing duplicate code. | Enabling Agent Registry **automatically activates** the remote MCP server (`https://agentregistry.googleapis.com/mcp`), letting Antigravity search and inspect `customer-analytics-mcp` and its tool schemas in natural language (**Q1**). | [`scripts/02_antigravity_discover.sh`](./scripts/02_antigravity_discover.sh) |
| **Beat 3** | **Application Team**<br>*(ADK Python SDK + Cloud Run)* | App engineers build `revenue-insights-agent` in Python with ADK and deploy to serverless Cloud Run. | 1. `AgentRegistry.get_mcp_toolset(...)` **automatically resolves** the MCP endpoint at runtime (zero hardcoded URLs).<br>2. `--functional-type=agent --identity-type=agent-identity` **automatically provisions a SPIFFE identity** and registers the agent (**Q3**). | [`scripts/03_deploy_adk_cloud_run.sh`](./scripts/03_deploy_adk_cloud_run.sh) |
| **Beat 4** | **Business User & Security Admin**<br>*(Gemini Enterprise + Agent Gateway)* | Business users ask KPI questions in Gemini Enterprise web chat; Security Admins enforce least-privilege tool governance. | Gemini Enterprise imports `customer-analytics-mcp` (`REGISTRY_MCP`). Agent Gateway **automatically resolves** `destination.is_registered` and `destination.agent_registry.mcp_server.tool.name` from Agent Registry for IAP v2 CEL evaluation: `query_kpi_summary` succeeds (`200 ALLOWED`), while `purge_customer_table` is blocked (`403 DENIED`) (**Q1**). | [`scripts/04_configure_gateway_and_ge.sh`](./scripts/04_configure_gateway_and_ge.sh) |
| **Beat 5** | **All Personas**<br>*(Unified Single Source of Truth)* | Every team works independently in their native Google Cloud runtime. | Agent Registry provides a **single unified inventory** of all Agents, MCP Servers, Tools, and Identities across `global` and `us-central1` (**Q1–Q3**). | [`scripts/05_full_inventory.sh`](./scripts/05_full_inventory.sh) |

---

## 🏗️ Repository Structure

```text
advent-of-agents-s3-registry-day18/
├── README.md                                        # Persona-driven architecture & quickstart guide
├── env.sh.example                                   # Project, region, and resource environment variables
├── gke/
│   └── customer_analytics_mcp/                      # Beat 1: Data Engineering FastMCP server on GKE & Cloud Run
│       ├── mcp_server.py                            # Exposes query_kpi_summary, create_data_quality_ticket, purge_customer_table
│       ├── Dockerfile                               # Container image definition
│       ├── toolspec.json                            # MCP tool schema & safety annotations (readOnlyHint, destructiveHint)
│       └── customer_analytics_mcp.yaml              # GKE Deployment + Service with registry.gke.io/functional-type: "MCP_SERVER"
├── antigravity/
│   └── mcp_config.snippet.json                      # Beat 2: Antigravity IDE connection to https://agentregistry.googleapis.com/mcp
├── adk_agent/                                       # Beat 3: Application Team ADK Agent on Cloud Run
│   ├── agent.py                                     # Uses google.adk.integrations.agent_registry.AgentRegistry
│   ├── main.py                                      # FastAPI + A2A Agent Card (/.well-known/agent.json, /discover, /query)
│   ├── requirements.txt                             # google-adk[a2a,agent-identity]>=1.29.0
│   └── Dockerfile
├── gateway/                                         # Beat 4: Agent Gateway + IAP v2 + IAM Unified Access Policy
│   ├── agw-day18-networkConfig.yaml                 # Agent Gateway bound to Agent Registry + PSC egress
│   ├── agw-day18-svc-ext-authz-iap.yaml             # IAP v2 Authorization Extension
│   ├── agw-day18-authz-policy-iap.yaml              # Network Security Authz Policy targeting agw-day18
│   └── day18-analytics-uap-rules.json               # CEL rules: allow query_kpi_summary, deny purge_customer_table
└── scripts/
    ├── 00_verify_backfill.sh                        # Beat 0: BigQuery MCP & Gemini Enterprise auto-backfill
    ├── 01_deploy_gke_mcp.sh                         # Beat 1: GKE MCP server deployment & introspection
    ├── 02_antigravity_discover.sh                   # Beat 2: Antigravity IDE discovery via Agent Registry MCP server
    ├── 03_deploy_adk_cloud_run.sh                   # Beat 3: ADK dynamic tool resolution & Cloud Run auto-registration
    ├── 04_configure_gateway_and_ge.sh               # Beat 4: Gemini Enterprise + Agent Gateway CEL tool governance
    └── 05_full_inventory.sh                         # Beat 5: Unified Single Source of Truth inventory
```

---

## 🚀 Running the Live Demo Walkthrough

```bash
cp env.sh.example env.sh
source env.sh

# Beat 0: Data Analyst & Platform Admin — Auto-Backfilled BigQuery MCP & GE Agents
./scripts/00_verify_backfill.sh

# Beat 1: Data Engineering Team — GKE Custom MCP Server Auto-Registration
./scripts/01_deploy_gke_mcp.sh

# Beat 2: Developer — Antigravity IDE Natural-Language Discovery via Agent Registry MCP
./scripts/02_antigravity_discover.sh

# Beat 3: Application Team — ADK Dynamic Tool Resolution & Cloud Run Auto-Registration
./scripts/03_deploy_adk_cloud_run.sh

# Beat 4: Business User & Security Admin — Gemini Enterprise + Agent Gateway CEL Governance
./scripts/04_configure_gateway_and_ge.sh

# Beat 5: Unified Single Source of Truth Across All Personas
./scripts/05_full_inventory.sh
```
