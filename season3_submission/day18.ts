import { DayContent } from '../types';

export const day18: DayContent = {
  day: 18,
  title: "Agent Registry: Single Source of Truth Across Runtimes & Clouds",
  summary: "Centralize discovery and governance of AI agents, MCP servers, and tools across Gemini Enterprise Agent Platform (Agent Runtime), Cloud Run, GKE, spoke projects, and multi-cloud environments using Agent Registry.",
  tags: ["Agent Registry", "Governance", "Cloud Run", "Multi-Cloud"],
  icon: "🗂️",
  resourceLink: "https://docs.cloud.google.com/agent-registry/overview",
  codeSnippets: [
    {
      title: "Automatic Registration on Cloud Run & Agent Runtime",
      filename: "auto_register_agents.sh",
      language: "bash",
      code: `export CLOUDSDK_METRICS_ENVIRONMENT="advent-of-agents-s3-day18"

# 1. Enable the Agent Registry API
gcloud services enable agentregistry.googleapis.com \\
  --project=YOUR_PROJECT_ID

# 2. Automatically register a Cloud Run agent during deployment
# Requires both --functional-type=agent and --identity-type=agent-identity
gcloud run deploy billing-triage-agent \\
  --image="us-central1-docker.pkg.dev/YOUR_PROJECT_ID/agents/billing-agent:latest" \\
  --region="us-central1" \\
  --functional-type=agent \\
  --identity-type=agent-identity \\
  --project=YOUR_PROJECT_ID

# 3. Verify automatic registration (including built-in Google agents)
gcloud agent-registry agents list \\
  --project=YOUR_PROJECT_ID \\
  --location="us-central1" \\
  --filter="displayName='billing-triage-agent'"

# List built-in Google Workspace & Gemini Enterprise agents backfilled automatically
gcloud agent-registry agents list \\
  --project=YOUR_PROJECT_ID \\
  --location="global" \\
  --filter="agentId:'urn:agent:googleapis.com:*'"`
    },
    {
      title: "Automatic GKE Introspection & A2A Skill Indexing",
      filename: "gke_agent_deployment.yaml",
      language: "yaml",
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-a2a-agent
  labels:
    # Instructs the GKE runtime controller to register the workload in Agent Registry
    registry.gke.io/functional-type: "AGENT"
  annotations:
    # Enables in-cluster introspection of the A2A Agent Card and skills
    a2a-protocol.org/agent-card: |
      card:
        endpoint: /.well-known/agent-card.json
        protocol: HTTP
        port: 8080
spec:
  selector:
    matchLabels:
      app: inventory-a2a-agent
  template:
    metadata:
      labels:
        app: inventory-a2a-agent
    spec:
      containers:
      - name: server
        image: us-central1-docker.pkg.dev/YOUR_PROJECT_ID/agents/inventory-agent:1.0.0
        ports:
        - containerPort: 8080`
    },
    {
      title: "Cross-Project & Multi-Cloud Registration via gcloud and Terraform",
      filename: "register_external_and_spoke_agents.sh",
      language: "bash",
      code: `export CLOUDSDK_METRICS_ENVIRONMENT="advent-of-agents-s3-day18"

# 1. Register an A2A-compliant agent from a spoke GCP project or AWS/Azure
# Indexes the Agent Card and A2A skills into the central governance project
cat > agent-card.json <<EOF
{
  "schemaVersion": "v1",
  "displayName": "AWS Fraud Detection Agent",
  "description": "Cross-cloud A2A agent evaluating real-time payment risk.",
  "skills": [
    {
      "name": "score_transaction",
      "description": "Evaluates transaction payload for fraud anomalies."
    }
  ]
}
EOF

gcloud agent-registry services create aws-fraud-agent \\
  --project=CENTRAL_GOVERNANCE_PROJECT_ID \\
  --location="us-central1" \\
  --display-name="AWS Fraud Detection Agent" \\
  --agent-spec-type=a2a-agent-card \\
  --agent-spec-content=@agent-card.json

# 2. Register a non-A2A REST agent from a spoke project for central Egress Gateway governance
gcloud agent-registry services create spoke-support-agent \\
  --project=CENTRAL_GOVERNANCE_PROJECT_ID \\
  --location="us-central1" \\
  --display-name="Spoke Support REST Agent" \\
  --agent-spec-type=no-spec \\
  --interfaces=url=https://support-agent-xyz.us-central1.run.app,protocolBinding=http-json`
    }
  ],
  links: [
    {
      label: "Agent Registry Overview",
      url: "https://docs.cloud.google.com/agent-registry/overview",
      description: "Centralized catalog to store, discover, and govern agents, MCP servers, and skills."
    },
    {
      label: "Automatic Registration Guide",
      url: "https://docs.cloud.google.com/agent-registry/automatic-registration",
      description: "Configure automatic registration for Agent Runtime, Cloud Run, and GKE."
    },
    {
      label: "Manual & Cross-Project Registration",
      url: "https://docs.cloud.google.com/agent-registry/manual-registration",
      description: "Register cross-project, on-premises, and multi-cloud agents via CLI or Terraform."
    },
    {
      label: "Agent Registry Data Model & Identifiers",
      url: "https://docs.cloud.google.com/agent-registry/identity-and-identifiers",
      description: "Understand Agent URNs, principals, and resource collections for policy binding."
    }
  ],
  description: `
**Day 18 of Google's Advent of Agents — Season 3**

As engineering teams deploy autonomous agents and MCP servers across Agent Runtime, Cloud Run, GKE, and external clouds, security teams quickly lose visibility into what is running and what tools those workloads can call. **Agent Registry** in **Gemini Enterprise Agent Platform** provides a centralized catalog that indexes \`Agent\`, \`McpServer\`, \`Skill\`, and \`Endpoint\` resources into a single source of truth for discovery and **Agent Gateway** policy enforcement.

**How It Works**

Agent Registry combines zero-touch runtime ingestion within a Google Cloud project with declarative registration for cross-project and multi-cloud topologies:

1. **Built-In & Managed Runtime Auto-Registration**: Built-in Google Workspace and Gemini Enterprise agents (\`urn:agent:googleapis.com:*\`) are backfilled automatically. Custom agents deployed to **Agent Runtime** (\`agent_engines.create\`) register and sync lifecycle changes automatically with zero extra flags.
2. **Opt-In Cloud Run & GKE Introspection**: Deploying a container to **Cloud Run** with \`--functional-type=agent\` and \`--identity-type=agent-identity\` mints a cryptographic identity and registers the workload automatically. On **GKE**, adding the \`registry.gke.io/functional-type: "AGENT"\` label and \`a2a-protocol.org/agent-card\` annotation instructs the in-cluster controller to query \`/.well-known/agent-card.json\` and index the agent's Agent2Agent (A2A) skills.
3. **Cross-Project & Multi-Cloud Cataloging**: Because automatic discovery is scoped to a single project, enterprise hub-and-spoke architectures use \`gcloud agent-registry services create\` or the \`google_agent_registry_service\` Terraform resource to register agents from spoke GCP projects, AWS, Azure, or on-premises environments into a central governance project.
4. **Unified Discovery & Gateway Enforcement**: Orchestrators and administrators query registered capabilities by display name, A2A skill, or URN (\`gcloud agent-registry agents list\`), while **Agent Gateway** resolves these registry identifiers at runtime to enforce IAM and egress policies.

**Resources:**
- [Agent Registry Overview](https://docs.cloud.google.com/agent-registry/overview)
- [Use Automatic Registration (Agent Runtime, Cloud Run, GKE)](https://docs.cloud.google.com/agent-registry/automatic-registration)
- [Use Manual & Cross-Project Registration](https://docs.cloud.google.com/agent-registry/manual-registration)
- [Identity and Identifiers in Agent Registry](https://docs.cloud.google.com/agent-registry/identity-and-identifiers)
`,
  videoURL: "TODO"
};

export default day18;
