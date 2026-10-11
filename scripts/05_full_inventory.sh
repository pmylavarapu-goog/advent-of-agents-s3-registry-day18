#!/usr/bin/env bash
# ==============================================================================
# Advent of Agents S3 — Day 18: Agent Registry (Single Source of Truth)
# Beat 5: All Personas — Unified Single Source of Truth Inventory
# ==============================================================================
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-praveenamylavarapu-july2022}"
REGION="${REGION:-us-central1}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${MAGENTA}${BOLD}  BEAT 5 — UNIFIED SINGLE SOURCE OF TRUTH ACROSS ALL PERSONAS (${PROJECT_ID})${RESET}"
echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${GREEN}Every persona worked in their preferred Google Cloud surface — and Agent Registry${RESET}"
echo -e "${GREEN}automatically unified their Agents, MCP Servers, Tools, and Identities:${RESET}"
echo ""

echo -e "${CYAN}${BOLD}[1/3] Regional Agents (${REGION} — Cloud Run ADK + Agent Runtime + Workspace):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry agents list \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="table(displayName:label=AGENT_NAME, framework:label=FRAMEWORK, agentId:label=CANONICAL_URN, attributes.'agentregistry.googleapis.com/system/RuntimeIdentity'.principal:label=AGENT_IDENTITY)"

echo ""
echo -e "${CYAN}${BOLD}[2/3] Regional Custom MCP Servers (${REGION} — Data Engineering Analytics MCP):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry mcp-servers list \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="table(displayName:label=MCP_SERVER, mcpServerId:label=CANONICAL_URN, interfaces[0].url:label=ENDPOINT_URL, tools[].name.list():label=GOVERNED_TOOLS)"

echo ""
echo -e "${CYAN}${BOLD}[3/3] Global Auto-Backfilled Google Cloud Agents & Remote MCP Servers (global):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry agents list \
  --location=global \
  --project="${PROJECT_ID}" \
  --format="table(displayName:label=GLOBAL_AGENT_NAME, agentId:label=CANONICAL_URN, version:label=VERSION)"
echo ""
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry mcp-servers list \
  --location=global \
  --project="${PROJECT_ID}" \
  --filter="displayName:(bigquery.googleapis.com OR agentregistry.googleapis.com OR dataplex.googleapis.com OR dataproc.googleapis.com OR container.googleapis.com OR run.googleapis.com OR discoveryengine.googleapis.com)" \
  --format="table(displayName:label=GLOBAL_GOOGLE_MCP_SERVER, interfaces[0].url:label=ENDPOINT_URL, tools.len():label=TOOL_COUNT)"
