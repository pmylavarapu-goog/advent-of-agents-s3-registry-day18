terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0.0"
    }
  }
}

variable "central_project_id" {
  description = "Central governance Google Cloud project ID hosting Agent Registry"
  type        = string
}

variable "spoke_project_id" {
  description = "Spoke Google Cloud project ID where remote workloads run"
  type        = string
  default     = "spoke-payments-prod"
}

variable "region" {
  description = "Agent Registry region (must match central Egress Gateway region)"
  type        = string
  default     = "us-central1"
}

# 1. Register an External / Multi-Cloud A2A Agent (e.g., running on AWS or Azure)
# Indexes the Agent Card and A2A skills for unified discovery
resource "google_agent_registry_service" "aws_fraud_a2a_agent" {
  project      = var.central_project_id
  location     = var.region
  service_id   = "aws-fraud-agent"
  display_name = "AWS Fraud Detection Agent"

  agent_spec {
    type = "A2A_AGENT_CARD"
    content = jsonencode({
      schemaVersion = "v1"
      displayName   = "AWS Fraud Detection Agent"
      description   = "Cross-cloud A2A agent running on AWS EKS that evaluates real-time payment risk."
      skills = [
        {
          name        = "score_transaction"
          description = "Evaluates a payment transaction payload for fraud anomalies."
        }
      ]
    })
  }
}

# 2. Register a Spoke-Project Standard REST Agent into the Central Governance Hub
# Allows a central Agent Egress Gateway (AGENT_TO_ANYWHERE) to govern cross-project traffic
resource "google_agent_registry_service" "spoke_rest_agent" {
  project      = var.central_project_id
  location     = var.region
  service_id   = "spoke-support-agent"
  display_name = "Spoke Support REST Agent"
  description  = "Remote REST agent registered from project ${var.spoke_project_id}."

  agent_spec {
    type = "NO_SPEC"
  }

  interfaces {
    url              = "https://support-agent-xyz.${var.region}.run.app"
    protocol_binding = "HTTP_JSON"
  }
}

# 3. Query a Registered Agent's Globally Unique URN via Terraform Data Source
data "google_agent_registry_agent" "billing_agent" {
  location = var.region
  filter   = "displayName=\"Billing Triage Agent\""
}

output "aws_agent_registry_resource" {
  description = "Generated read-only Agent resource name for the AWS A2A agent."
  value       = google_agent_registry_service.aws_fraud_a2a_agent.registry_resource
}

output "spoke_agent_registry_resource" {
  description = "Generated read-only Agent resource name for the spoke REST agent."
  value       = google_agent_registry_service.spoke_rest_agent.registry_resource
}

output "billing_agent_urn" {
  description = "Globally unique URN (urn:agent:...) used for IAM and Agent Gateway policies."
  value       = data.google_agent_registry_agent.billing_agent.urn
}
