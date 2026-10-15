import { DayContent } from '../types';

export const day18: DayContent = {
  day: 18,
  title: "Agent Registry: Single Source of Truth for Agents & Tools",
  summary: "Discover, connect, and govern every AI agent, MCP server, Skills and Endpoints across your organization.",
  tags: ["Phase 4: Agent Registry", "Governance", "MCP", "ADK"],
  icon: "🗂️",
  resourceLink: "https://g.dev/cloud/adventofagents-season3-agent-registry",
  codeSnippets: [
    {
      title: "1. Start Here: Run the End-to-End Demo (quickstart.sh)",
      filename: "quickstart.sh",
      language: "bash",
      code: `# START HERE: Run these commands in Cloud Shell or your terminal to deploy and register
# the custom GKE MCP server, discover tools via Antigravity CLI, deploy the ADK agent on
# Cloud Run, and attach the Agent Gateway policy.
# Snippets 2, 3, and 4 are for reference only; the repository cloned below already contains them.

# 1. Clone the Day 18 Code Kata repository and configure your project variables:
git clone https://github.com/pmylavarapu-goog/advent-of-agents-s3-registry-day18.git
cd advent-of-agents-s3-registry-day18
cp env.sh.example env.sh   # Edit env.sh to set PROJECT_ID, PROJECT_NUMBER, and ORG_ID
source env.sh

# 2. Deploy the custom FastMCP server on GKE (auto-registers via the MCP_SERVER label)
#    and publish its endpoint specification in Agent Registry:
./scripts/01_deploy_gke_mcp.sh
./scripts/02_register_hub_spoke_mcp.sh

# 3. Connect Antigravity / Gemini CLI to the Agent Registry MCP server to discover existing tools:
mkdir -p ~/.gemini/config
envsubst < antigravity/mcp_config.json > ~/.gemini/config/mcp_config.json
gemini -p "Use the agent-registry MCP server to list all registered MCP servers and tools."

# 4. Deploy the ADK agent to Cloud Run (dynamically binds customer-analytics-mcp by name
#    and auto-registers the agent with a cryptographic SPIFFE identity):
./scripts/03_deploy_adk_cloud_run.sh

# 5. Attach the tool-level IAM Access Policy at Agent Gateway:
./scripts/04_attach_gateway_policy.sh`
    },
    {
      title: "2. Reference: GKE MCP Server Label (gke/customer_analytics_mcp/deployment.yaml)",
      filename: "gke/customer_analytics_mcp/deployment.yaml",
      language: "yaml",
      code: `# REFERENCE ONLY: Excerpt of gke/customer_analytics_mcp/deployment.yaml from the demo repo.
# You do not need to copy it manually; ./scripts/01_deploy_gke_mcp.sh in Snippet 1 applies it for you.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-analytics-mcp
  labels:
    # Instructs GKE's in-cluster controller to automatically register the workload in Agent Registry
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
        - containerPort: 8080`
    },
    {
      title: "3. Reference: Dynamic MCP Toolset Binding in ADK (adk_agent/agent.py)",
      filename: "adk_agent/agent.py",
      language: "python",
      code: `# REFERENCE ONLY: Excerpt of adk_agent/agent.py from the demo repo.
# You do not need to copy it manually; ./scripts/03_deploy_adk_cloud_run.sh in Snippet 1 deploys it for you.
import os
from google.adk.agents.llm_agent import LlmAgent
from google.adk.integrations.agent_registry import AgentRegistry

GCP_PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "YOUR_PROJECT_ID")
GCP_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

# Dynamically resolve customer-analytics-mcp by name from Agent Registry (zero hardcoded URLs!)
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
)`
    },
    {
      title: "4. Reference: Tool-Level Least Privilege Policy (gateway/day18-analytics-uap-rules.json)",
      filename: "gateway/day18-analytics-uap-rules.json",
      language: "json",
      code: `[
  {
    "description": "REFERENCE ONLY (gateway/day18-analytics-uap-rules.json in repo, applied by 04_attach_gateway_policy.sh) — Rule 1: Allow MCP discovery on registered endpoints",
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
      url: "https://g.dev/cloud/adventofagents-season3-day18-demo",
      description: "End-to-end Agent Registry demo across GKE, Antigravity CLI, ADK on Cloud Run, and Agent Gateway."
    },
    {
      label: "Agent Registry Overview",
      url: "https://g.dev/cloud/adventofagents-season3-agent-registry",
      description: "Centralized catalog to store, discover, and govern agents, MCP servers, and tools."
    },
    {
      label: "Automatic Registration Quickstart",
      url: "https://g.dev/cloud/adventofagents-season3-docs-agent-registry-automatic-registration",
      description: "Configure zero-touch automatic registration across BigQuery, GKE, Cloud Run, and Agent Runtime."
    },
    {
      label: "Connect ADK Agents to Registered Tools",
      url: "https://g.dev/cloud/adventofagents-season3-docs-agent-registry-authenticate-toolsets",
      description: "Dynamically resolve and bind registered MCP toolsets in Python with zero hardcoded URLs."
    }
  ],
  description: `
**Day 18 of Google's Advent of Agents — Season 3**

Building and deploying your first production agent is straightforward when a single team owns the stack. Six months later, when dozens of Data Engineering, Application, and Line-of-Business teams are shipping hundreds of agents and Model Context Protocol (MCP) servers across isolated Google Cloud projects and external clouds, ungoverned sprawl takes over.

Developers waste weeks rebuilding MCP servers that already exist and hardcoding brittle endpoint URLs into application code, while platform admins and security leaders have no central inventory to audit permissions or block destructive tools.

**How It Works**

**Google Cloud Agent Registry** is a centralized catalog in **Gemini Enterprise Agent Platform** for storing, discovering, and governing every AI agent, MCP server, skill, and endpoint across your organization. Instead of maintaining manual spreadsheets or hardcoding fragile URLs in application code, platform teams curate a single governed catalog while application teams dynamically discover and bind only the tools authorized for their boundary.

![Agent Registry: Register, Discover & Govern](/s03/s3-day18-agent-registry.png)

- **1. Register Assets Automatically or by Spec**: Automatically register agents and MCP servers from **Agent Runtime**, **Gemini Enterprise**, **Cloud Run** (\`--functional-type=agent\`), **GKE** (\`MCP_SERVER\` label), and enabled Google-managed MCP servers like BigQuery, or register custom endpoints and skills via \`gcloud beta agent-registry\`.
- **2. Discover Tools in Antigravity CLI**: Connect **Antigravity CLI** to the Agent Registry MCP server (\`agentregistry.googleapis.com/mcp\`) to search registered agents, MCP servers, and tool schemas before writing duplicate code.
- **3. Connect Dynamically in ADK & Govern at the Gateway**: Resolve MCP toolsets by logical name in **ADK** using \`AgentRegistry.get_mcp_toolset()\` with zero hardcoded URLs, while **Agent Gateway** enforces tool-level allowlists linked to each agent's cryptographic SPIFFE **Agent Identity** from Day 5.

**Try the End-to-End Demo**: Clone the [Day 18 Code Kata Repository](https://g.dev/cloud/adventofagents-season3-day18-demo) in Cloud Shell to run the walkthrough across BigQuery, GKE, Antigravity CLI, ADK on Cloud Run, and Gemini Enterprise!

**Resources:**

- [Day 18 Code Kata Repository](https://g.dev/cloud/adventofagents-season3-day18-demo)
- [Agent Registry Overview](https://g.dev/cloud/adventofagents-season3-agent-registry)
- [Automatic Registration Quickstart](https://g.dev/cloud/adventofagents-season3-docs-agent-registry-automatic-registration)
- [Connect ADK Agents to Registered Tools](https://g.dev/cloud/adventofagents-season3-docs-agent-registry-authenticate-toolsets)
`,
  videoURL: "TODO"
};
