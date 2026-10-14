import { DayContent } from '../types';

export const day18: DayContent = {
  day: 18,
  title: "Agent Registry: Single Source of Truth for Agents & Tools",
  summary: "Discover, connect, and govern every AI agent, MCP server, and tool across your organization from a single automatic catalog in Gemini Enterprise Agent Platform.",
  tags: ["Agent Registry", "Governance", "MCP", "ADK"],
  icon: "🗂️",
  resourceLink: "https://docs.cloud.google.com/agent-registry/overview",
  codeSnippets: [
    {
      title: "1. Label GKE MCP Server & Discover Tools via Antigravity CLI",
      filename: "customer_analytics_mcp.yaml",
      language: "yaml",
      code: `# Quickstart — Clone the Day 18 Code Kata repository:
#   git clone https://github.com/pmylavarapu-goog/advent-of-agents-s3-registry-day18.git
#   cd advent-of-agents-s3-registry-day18
#
# Step 2: Deploy a custom FastMCP server on GKE with the MCP_SERVER discovery label
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
        image: us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mcp/customer-analytics-mcp:1.0.0
        ports:
        - containerPort: 8080
---
# Step 3: Connect Antigravity CLI (~/.gemini/config/mcp_config.json) to Agent Registry MCP:
# {
#   "mcpServers": {
#     "agent-registry": {
#       "serverUrl": "https://agentregistry.googleapis.com/mcp",
#       "headers": { "X-Goog-User-Project": "YOUR_PROJECT_ID" }
#     }
#   }
# }
# Publish spoke-project or multi-cloud (AWS, Azure, on-prem) endpoints into the Central Hub:
# gcloud beta agent-registry services create customer-analytics-mcp \\
#   --location=us-central1 --mcp-server-spec-file=mcp_server_spec.json`
    },
    {
      title: "2. Dynamically Bind MCP Tools in ADK & Auto-Register on Cloud Run",
      filename: "agent.py",
      language: "python",
      code: `import os
from google.adk.agents.llm_agent import LlmAgent
from google.adk.integrations.agent_registry import AgentRegistry

GCP_PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "YOUR_PROJECT_ID")
GCP_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

# Step 4: Dynamically resolve customer-analytics-mcp by name (zero hardcoded URLs!)
registry = AgentRegistry(
    project_id=GCP_PROJECT_ID,
    location=GCP_LOCATION,
)
mcp_toolset = registry.get_mcp_toolset(
    mcp_server_name="customer-analytics-mcp"
)

root_agent = LlmAgent(
    name="revenue_insights_agent",
    model="gemini-3.1-flash-preview",
    description="Enterprise Revenue Insights Agent built with ADK and Agent Registry.",
    instruction="Use tools from customer-analytics-mcp to answer regional revenue KPI queries.",
    tools=[mcp_toolset],
)

# Deploy to Cloud Run with automatic SPIFFE Agent Identity + Agent Registry cataloging:
# gcloud beta run deploy revenue-insights-agent \\
#   --source=./adk_agent \\
#   --region=us-central1 \\
#   --functional-type=agent \\
#   --identity-type=agent-identity`
    },
    {
      title: "3. Enforce Tool-Level Least Privilege at Agent Gateway",
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
    "description": "Rule 2: Allow query_kpi_summary and create_data_quality_ticket; implicitly DENY (403) destructive purge_customer_table",
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
      label: "Day 18 Code Kata Repository",
      url: "https://github.com/pmylavarapu-goog/advent-of-agents-s3-registry-day18",
      description: "End-to-end Agent Registry demo across GKE, Antigravity CLI, ADK on Cloud Run, and Agent Gateway."
    },
    {
      label: "Agent Registry Overview",
      url: "https://docs.cloud.google.com/agent-registry/overview",
      description: "Centralized catalog to store, discover, and govern agents, MCP servers, and tools."
    },
    {
      label: "Automatic Registration Quickstart",
      url: "https://docs.cloud.google.com/agent-registry/automatic-registration",
      description: "Configure zero-touch automatic registration across BigQuery, GKE, Cloud Run, and Agent Runtime."
    },
    {
      label: "Connect ADK Agents to Registered Tools",
      url: "https://docs.cloud.google.com/agent-registry/connect-agents-tools",
      description: "Dynamically resolve and bind registered MCP toolsets in Python with zero hardcoded URLs."
    }
  ],
  description: `
**Day 18 of Google's Advent of Agents — Season 3**

Building and deploying your first production agent is straightforward when a single team owns the stack. Six months later, when dozens of Data Engineering, Application, and Line-of-Business teams are shipping hundreds of agents and Model Context Protocol (MCP) servers across isolated Google Cloud projects and external clouds, ungoverned sprawl takes over. Developers waste weeks rebuilding MCP servers that already exist and hardcoding brittle endpoint URLs into application code, while platform admins and security leaders have no central inventory to audit permissions or block destructive tools.

**How It Works**

As Pillar One of Govern on **Gemini Enterprise Agent Platform**, **Agent Registry** shifts discovery and governance out of developer code and into the platform as your organization's **Single Source of Truth**. Every registered agent, MCP server, and tool receives an immutable canonical handle linked to its cryptographic SPIFFE **Agent Identity** from Day 5. Platform admins govern the full cross-project catalog using a hub-and-spoke model, while each team's application only discovers and binds the curated tools authorized for its boundary.

![Agent Registry Architecture Across 5 Personas](/s03/s3-day18-agent-registry.png)

- **Zero-Touch Backfill and Hub-and-Spoke Onboarding**: Enabling the Agent Registry API automatically backfills Google-managed MCP servers like BigQuery and Knowledge Catalog alongside native **Gemini Enterprise** and **Agent Runtime** agents, while GKE workload labels, Cloud Run deploy flags, and spoke-project service registrations catalog custom and multi-cloud workloads into a central governance hub.
- **Dynamic Discovery and Perimeter Governance**: Developers connect **Antigravity CLI** directly to the Agent Registry MCP server to discover existing tool schemas before writing duplicate code, application teams dynamically resolve MCP toolsets by logical name in **ADK** with zero hardcoded URLs, and business users import governed MCP tools into **Gemini Enterprise** in one click while **Agent Gateway** blocks destructive operations at the perimeter.

**Try the End-to-End Demo**: Clone the [Day 18 Code Kata Repository](https://github.com/pmylavarapu-goog/advent-of-agents-s3-registry-day18) in Cloud Shell to run the 5-persona walkthrough across BigQuery, GKE, Antigravity CLI, ADK on Cloud Run, and Gemini Enterprise!

**Resources:**

- [Day 18 Code Kata Repository](https://github.com/pmylavarapu-goog/advent-of-agents-s3-registry-day18)
- [Agent Registry Overview](https://docs.cloud.google.com/agent-registry/overview)
- [Automatic Registration Quickstart](https://docs.cloud.google.com/agent-registry/automatic-registration)
- [Connect ADK Agents to Registered Tools](https://docs.cloud.google.com/agent-registry/connect-agents-tools)
`,
  videoURL: "TODO"
};
