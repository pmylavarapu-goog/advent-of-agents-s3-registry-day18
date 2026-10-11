terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0.0"
    }
  }
}

variable "project_id" {
  description = "Google Cloud project ID hosting Agent Registry"
  type        = string
  default     = "praveenamylavarapu-july2022"
}

variable "project_number" {
  description = "Google Cloud project number"
  type        = string
  default     = "111200009617"
}

variable "region" {
  description = "Agent Registry and Agent Gateway region"
  type        = string
  default     = "us-central1"
}

# 1. Register Data Engineering's Customer Analytics MCP Server & Tool Specification
resource "google_agent_registry_service" "customer_analytics_mcp" {
  project      = var.project_id
  location     = var.region
  service_id   = "customer-analytics-mcp"
  display_name = "customer-analytics-mcp"
  description  = "Enterprise Customer & Revenue Analytics MCP Server (Data Engineering Team)."

  mcp_server_spec {
    type    = "TOOL_SPEC"
    content = file("${path.module}/../gke/customer_analytics_mcp/toolspec.json")
  }

  interfaces {
    url              = "https://customer-analytics-mcp-${var.project_number}.${var.region}.run.app/mcp"
    protocol_binding = "JSONRPC"
  }
}

# 2. Query the Application Team's Auto-Registered Cloud Run Agent URN
data "google_agent_registry_agent" "revenue_insights_agent" {
  location = var.region
  filter   = "displayName=\"revenue-insights-agent\""
}

output "customer_analytics_mcp_registry_resource" {
  description = "Generated Agent Registry MCP Server resource name."
  value       = google_agent_registry_service.customer_analytics_mcp.registry_resource
}

output "revenue_insights_agent_urn" {
  description = "Globally unique URN (urn:agent:...) of the Cloud Run ADK agent."
  value       = data.google_agent_registry_agent.revenue_insights_agent.urn
}
