import { DayContent } from '../types';

export const day18: DayContent = {
  day: 18,
  title: "Agent Registry: How Do You Discover and Govern Every AI Agent and MCP Tool?",
  summary: "How do you discover and govern every AI agent and MCP tool across your organization without hardcoding URLs or slowing teams down? Use Agent Registry as your automatic single source of truth across BigQuery, GKE, Antigravity IDE, ADK on Cloud Run, and Gemini Enterprise.",
  tags: ["Agent Registry", "Governance", "MCP", "ADK", "Gemini Enterprise", "Agent Gateway"],
  icon: "🗂️",
  resourceLink: "https://docs.cloud.google.com/agent-registry/overview",
  codeSnippets: [
    {
      title: "1. Auto-Introspect a GKE MCP Server & Discover It in Antigravity IDE",
      filename: "customer_analytics_mcp.yaml",
      language: "yaml",
      code: `# Deploy a custom FastMCP server on GKE with Agent Registry discovery labels
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-analytics-mcp
  labels:
    # Instructs GKE's in-cluster controller to register the workload in Agent Registry
    registry.gke.io/functional-type: "MCP_SERVER"
  annotations:
    # Enables automatic introspection of the Streamable HTTP (/mcp) endpoint & tool schemas
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
# Connect Antigravity IDE / Gemini CLI (~/.gemini/config/mcp_config.json) to Agent Registry:
# {
#   "mcpServers": {
#     "agent-registry": {
#       "serverUrl": "https://agentregistry.googleapis.com/mcp",
#       "headers": { "X-Goog-User-Project": "YOUR_PROJECT_ID" }
#     }
#   }
# }`
    },
    {
      title: "2. Dynamically Bind Registered MCP Tools in ADK & Auto-Register on Cloud Run",
      filename: "agent.py",
      language: "python",
      code: `from google.adk.agents.llm_agent import LlmAgent
from google.adk.integrations.agent_registry import AgentRegistry

# Dynamically resolve customer-analytics-mcp from Agent Registry (zero hardcoded URLs!)
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

# Deploy to Cloud Run with automatic SPIFFE Agent Identity + Agent Registry cataloging:
# gcloud beta run deploy revenue-insights-agent \\
#   --source=./adk_agent \\
#   --region=us-central1 \\
#   --functional-type=agent \\
#   --identity-type=agent-identity`
    },
    {
      title: "3. Enforce Tool-Level Least Privilege at Agent Gateway with IAP v2 & Agent Registry",
      filename: "day18-analytics-uap-rules.json",
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
      label: "Codelab: Govern Gemini Enterprise MCP Tool Calls with Agent Gateway & Agent Registry",
      url: "https://codelabs.developers.google.com/agent-gateway-gemini-enterprise",
      description: "Hands-on codelab to deploy a custom MCP server, register it in Agent Registry, and enforce tool-level IAM policies with Agent Gateway."
    },
    {
      label: "Agent Registry Overview",
      url: "https://docs.cloud.google.com/agent-registry/overview",
      description: "Centralized catalog to store, discover, and govern agents, MCP servers, and tools."
    },
    {
      label: "Automatic Registration Quickstart (BigQuery, GKE, Cloud Run, Agent Runtime)",
      url: "https://docs.cloud.google.com/agent-registry/automatic-registration",
      description: "Configure zero-touch automatic registration across Google Cloud runtimes."
    },
    {
      label: "Connect ADK Agents to Registered Tools",
      url: "https://docs.cloud.google.com/agent-registry/connect-agents-tools",
      description: "Use google.adk.integrations.agent_registry.AgentRegistry to dynamically bind MCP toolsets."
    },
    {
      label: "Agent Registry Identifiers & Policy Attributes",
      url: "https://docs.cloud.google.com/agent-registry/identity-and-identifiers",
      description: "Reference for Agent and MCP Server URNs, principals, and Agent Gateway CEL attributes."
    }
  ],
  description: `
**How do you discover and govern every AI agent and MCP tool across your organization without hardcoding URLs or slowing teams down?**

In a real Google Cloud environment, different teams build and consume AI capabilities on different surfaces: data analysts enable managed APIs like BigQuery, data engineers deploy custom Model Context Protocol (MCP) servers on GKE, developers prototype in Antigravity IDE, application teams ship Agent Development Kit (ADK) services on Cloud Run, and business users query Gemini Enterprise. Without a unified control plane, teams rebuild duplicate tools, hardcode brittle service URLs into agent code, and leave security administrators blind to which tools an agent can invoke. **Agent Registry** in **Gemini Enterprise Agent Platform** solves this by acting as an automatic, centralized **Single Source of Truth** that indexes \`Agent\`, \`McpServer\`, \`Skill\`, and \`Endpoint\` resources with canonical URNs (\`urn:agent:...\`, \`urn:mcp:...\`) and tool safety annotations (\`readOnlyHint\`, \`destructiveHint\`).

Under the hood, Agent Registry combines zero-touch runtime ingestion with dynamic discovery and network-edge enforcement. Enabling Google Cloud APIs (\`bigquery.googleapis.com\`, \`dataplex.googleapis.com\`) automatically backfills managed remote MCP servers in \`global\`, while deploying a GKE workload with \`registry.gke.io/functional-type: "MCP_SERVER"\` or a Cloud Run service with \`--functional-type=agent --identity-type=agent-identity\` triggers automatic endpoint introspection and SPIFFE identity binding. Developers can then query \`https://agentregistry.googleapis.com/mcp\` directly from Antigravity IDE to discover existing tools, application teams can dynamically bind registered MCP servers at runtime using \`AgentRegistry.get_mcp_toolset()\` in ADK without hardcoding URLs, and security admins can attach **Agent Gateway** with **IAP v2 Unified Access Policies** (\`destination.is_registered\` and \`destination.agent_registry.mcp_server.tool.name\`) so Gemini Enterprise assistants can execute safe read-only tools (\`200 ALLOWED\`) while destructive tools (\`403 DENIED\`) are blocked at the network edge.
`,
  videoURL: "TODO"
};

export default day18;
