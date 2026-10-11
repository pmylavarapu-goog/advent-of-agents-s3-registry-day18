import { DayContent } from '../types';

export const day18: DayContent = {
  day: 18,
  title: "Agent Registry: Single Source of Truth",
  summary: "Centralize discovery and zero-trust governance of AI agents, MCP servers, and tools across BigQuery, GKE, Antigravity IDE, ADK + Cloud Run, and Gemini Enterprise using Agent Registry.",
  tags: ["Agent Registry", "Governance", "MCP", "ADK", "Gemini Enterprise", "Agent Gateway"],
  icon: "🗂️",
  resourceLink: "https://docs.cloud.google.com/agent-registry/overview",
  codeSnippets: [
    {
      title: "Data Engineering & Developer Personas: GKE MCP Auto-Discovery & Antigravity IDE",
      filename: "01_gke_and_antigravity_mcp.yaml",
      language: "yaml",
      code: `# 1. Data Engineering Persona (GKE): Deploy customer-analytics-mcp with Agent Registry labels
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-analytics-mcp
  labels:
    # Instructs GKE's in-cluster controller to register the workload in Agent Registry
    registry.gke.io/functional-type: "MCP_SERVER"
  annotations:
    # Enables in-cluster introspection of the Streamable HTTP (/mcp) endpoint & tool schemas
    modelcontextprotocol.info/urls: |
      urls:
      - endpoint: /mcp
        protocol: HTTP
        port: 8080
    modelcontextprotocol.info/capabilities: "true"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: customer-analytics-mcp
  template:
    metadata:
      labels:
        app: customer-analytics-mcp
    spec:
      containers:
      - name: mcp-server
        image: gcr.io/YOUR_PROJECT_ID/customer-analytics-mcp:1.0.0
        ports:
        - containerPort: 8080
---
# 2. Developer Persona (Antigravity IDE / Gemini CLI): ~/.gemini/config/mcp_config.json
# {
#   "mcpServers": {
#     "agent-registry": {
#       "serverUrl": "https://agentregistry.googleapis.com/mcp",
#       "headers": {
#         "X-Goog-User-Project": "YOUR_PROJECT_ID"
#       }
#     }
#   }
# }`
    },
    {
      title: "Application Team Persona: ADK Dynamic Tool Discovery & Cloud Run Auto-Registration",
      filename: "03_adk_agent_and_cloud_run.py",
      language: "python",
      code: `from google.adk.agents.llm_agent import LlmAgent
from google.adk.integrations.agent_registry import AgentRegistry

# 1. Dynamically resolve customer-analytics-mcp from Agent Registry (zero hardcoded URLs!)
registry_client = AgentRegistry(
    project_id="YOUR_PROJECT_ID",
    location="us-central1",
)
mcp_server_resource = (
    "projects/YOUR_PROJECT_ID/locations/us-central1/"
    "mcpServers/agentregistry-00000000-0000-0000-c1a5-77e319c27bd5"
)
analytics_toolset = registry_client.get_mcp_toolset(mcp_server_resource)

root_agent = LlmAgent(
    name="revenue_insights_agent",
    model="gemini-2.5-flash",
    description="Enterprise Revenue Insights Agent built with ADK and Agent Registry.",
    instruction="Use tools from customer-analytics-mcp to answer regional revenue KPI queries.",
    tools=[analytics_toolset],
)

# 2. Deploy to Cloud Run with automatic Agent Identity + Agent Registry cataloging:
# gcloud beta run deploy revenue-insights-agent \\
#   --source=./adk_agent \\
#   --region=us-central1 \\
#   --functional-type=agent \\
#   --identity-type=agent-identity`
    },
    {
      title: "Business User & Security Admin: Agent Gateway + IAP v2 Tool-Level Governance",
      filename: "04_gateway_uap_rules.json",
      language: "json",
      code: `[
  {
    "description": "Rule 1: Allow Gemini Enterprise assistant to perform MCP discovery on registered endpoints",
    "effect": "ALLOW",
    "principals": [
      "principal://agents.global.org-YOUR_ORG_ID.system.id.goog/resources/discoveryengine/projects/YOUR_PROJECT_NUMBER/locations/global/engines/advent-day18-ge/assistants/default_assistant/agents/default/core_assistant"
    ],
    "operation": {
      "permissions": ["iap.googleapis.com/resources.egressViaIAP"]
    },
    "conditions": {
      "iap.googleapis.com": {
        "expression": "destination.is_registered == true && destination.agent_registry.mcp_server.method != 'tools/call'"
      }
    }
  },
  {
    "description": "Rule 2: Allow read-only query_kpi_summary; implicitly DENY (403) destructive purge_customer_table",
    "effect": "ALLOW",
    "principals": [
      "principal://agents.global.org-YOUR_ORG_ID.system.id.goog/resources/discoveryengine/projects/YOUR_PROJECT_NUMBER/locations/global/engines/advent-day18-ge/assistants/default_assistant/agents/default/core_assistant"
    ],
    "operation": {
      "permissions": ["iap.googleapis.com/resources.egressViaIAP"]
    },
    "conditions": {
      "iap.googleapis.com": {
        "expression": "destination.is_registered == true && destination.agent_registry.mcp_server.method == 'tools/call' && (destination.agent_registry.mcp_server.tool.name == 'query_kpi_summary' || destination.agent_registry.mcp_server.tool.name == 'create_data_quality_ticket')"
      }
    }
  }
]`
    }
  ],
  links: [
    {
      label: "Agent Registry Overview",
      url: "https://docs.cloud.google.com/agent-registry/overview",
      description: "Centralized catalog to store, discover, and govern agents, MCP servers, and tools."
    },
    {
      label: "Automatic Registration Guide",
      url: "https://docs.cloud.google.com/agent-registry/automatic-registration",
      description: "Configure automatic registration across BigQuery, Gemini Enterprise, Agent Runtime, Cloud Run, and GKE."
    },
    {
      label: "Connect Agents to Registered Tools (ADK)",
      url: "https://docs.cloud.google.com/agent-registry/connect-agents-tools",
      description: "Use google.adk.integrations.agent_registry.AgentRegistry to dynamically bind MCP toolsets."
    },
    {
      label: "Agent Registry Data Model & Identifiers",
      url: "https://docs.cloud.google.com/agent-registry/identity-and-identifiers",
      description: "Understand Agent and MCP Server URNs, principals, and Agent Gateway CEL attributes."
    }
  ],
  description: `
**Day 18 of Google's Advent of Agents — Season 3**

In every Google Cloud organization, different personas choose different surfaces for their everyday jobs: **Data Analysts** enable managed Google Cloud APIs like BigQuery, **Data Engineers** deploy custom MCP servers on **GKE**, **Developers** prototype in **Antigravity IDE**, **Application Teams** ship **ADK** agents on **Cloud Run**, and **Business Users** chat in **Gemini Enterprise**. Without a unified catalog, this creates a visibility gap of duplicate tools and ungoverned access. **Agent Registry** in **Gemini Enterprise Agent Platform** solves this by acting as the automatic **Single Source of Truth** across all four quadrants of the agent ecosystem:

1. **Managed Google Cloud MCP Servers & Agents (Data Analyst & Platform Admin)**: Enabling APIs like \`bigquery.googleapis.com\` or \`dataplex.googleapis.com\` automatically backfills Google-managed remote MCP servers (\`urn:mcp:googleapis.com:*\`) and built-in Gemini Enterprise & Agent Runtime agents into Agent Registry with zero configuration.
2. **Custom MCP Servers on GKE & Developer IDE Discovery (Data Engineering & Developer)**: Labeling a GKE Deployment with \`registry.gke.io/functional-type: "MCP_SERVER"\` and \`modelcontextprotocol.info/capabilities: "true"\` triggers in-cluster introspection of its \`/mcp\` endpoint and tool safety annotations (\`readOnlyHint\`, \`destructiveHint\`). Developers connecting **Antigravity IDE** to \`https://agentregistry.googleapis.com/mcp\` immediately discover those governed tools in natural language.
3. **Custom Agents with ADK & Cloud Run (Application Team)**: Application engineers use \`google.adk.integrations.agent_registry.AgentRegistry\` (\`get_mcp_toolset\`) to dynamically bind registered MCP servers without hardcoding URLs, and deploy to **Cloud Run** with \`--functional-type=agent --identity-type=agent-identity\` for automatic registration and cryptographic **Agent Identity**.
4. **Zero-Trust Tool Governance in Gemini Enterprise (Business User & Security Admin)**: Importing a registered MCP server (\`REGISTRY_MCP\`) into **Gemini Enterprise** and routing egress through **Agent Gateway** lets **IAP v2 Unified Access Policies** evaluate \`destination.is_registered\` and \`destination.agent_registry.mcp_server.tool.name\` on every call — permitting safe read-only tools (\`200 ALLOWED\`) while blocking destructive tools (\`403 DENIED\`) at the network edge.

**Resources:**
- [Agent Registry Overview](https://docs.cloud.google.com/agent-registry/overview)
- [Use Automatic Registration (BigQuery, GKE, Cloud Run, Agent Runtime)](https://docs.cloud.google.com/agent-registry/automatic-registration)
- [Connect ADK Agents to Registered Tools](https://docs.cloud.google.com/agent-registry/connect-agents-tools)
- [Identity and Identifiers in Agent Registry](https://docs.cloud.google.com/agent-registry/identity-and-identifiers)
`,
  videoURL: "TODO"
};

export default day18;
