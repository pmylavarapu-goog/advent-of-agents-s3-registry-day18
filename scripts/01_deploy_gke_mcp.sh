#!/usr/bin/env bash
# ==============================================================================
# Advent of Agents S3 — Day 18: Agent Registry (Single Source of Truth)
# Beat 1: Data Engineering Team Persona (Google Kubernetes Engine)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ID="${PROJECT_ID:-praveenamylavarapu-july2022}"
REGION="${REGION:-us-central1}"
GKE_CLUSTER="${GKE_CLUSTER_NAME:-day18-mcp-cluster}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${MAGENTA}${BOLD}  BEAT 1 — DATA ENGINEERING TEAM PERSONA (Google Kubernetes Engine)${RESET}"
echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${YELLOW}• Why This Surface:${RESET} Data Engineers package governed analytics & data-quality tools"
echo -e "  as containerized FastMCP microservices running on GKE alongside their pipelines."
echo -e "${GREEN}• What Happens Automatically in Agent Registry:${RESET}"
echo -e "  By adding ${BOLD}registry.gke.io/functional-type: \"MCP_SERVER\"${RESET} and"
echo -e "  ${BOLD}modelcontextprotocol.info/urls${RESET} to the Kubernetes Deployment, GKE's in-cluster"
echo -e "  controller AUTOMATICALLY introspects the pod's /mcp endpoint and registers"
echo -e "  ${BOLD}customer-analytics-mcp${RESET} and all 3 tools into Agent Registry!"
echo -e "${CYAN}• Value Addition:${RESET} Zero manual YAML/JSON uploads in the console every time a"
echo -e "  Data Engineer ships a new MCP tool to Kubernetes."
echo ""

echo -e "${CYAN}${BOLD}[1/3] Inspecting GKE Deployment Labels & Annotations (gke/customer_analytics_mcp/customer_analytics_mcp.yaml):${RESET}"
sed -n '9,28p' "${REPO_ROOT}/gke/customer_analytics_mcp/customer_analytics_mcp.yaml"

echo ""
echo -e "${CYAN}${BOLD}[2/3] Applying Manifest to GKE Cluster (${GKE_CLUSTER} in ${REGION}) if RUNNING:${RESET}"
CLUSTER_STATUS=$(CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud container clusters describe "${GKE_CLUSTER}" --region="${REGION}" --project="${PROJECT_ID}" --format="value(status)" 2>/dev/null || echo "NOT_READY")
if [[ "${CLUSTER_STATUS}" == "RUNNING" ]]; then
  CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
    gcloud container clusters get-credentials "${GKE_CLUSTER}" --region="${REGION}" --project="${PROJECT_ID}" --quiet
  kubectl apply -f "${REPO_ROOT}/gke/customer_analytics_mcp/customer_analytics_mcp.yaml"
  kubectl get deployment,service customer-analytics-mcp
else
  echo "  (GKE cluster ${GKE_CLUSTER} status: ${CLUSTER_STATUS})"
fi

echo ""
echo -e "${CYAN}${BOLD}[3/3] Verifying Registered MCP Server & Introspected Tools in Agent Registry (${REGION}):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry mcp-servers list \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="table(displayName:label=DISPLAY_NAME, mcpServerId:label=MCP_URN, interfaces[0].url:label=ENDPOINT_URL, tools[].name.list():label=DISCOVERED_TOOLS)"
