#!/usr/bin/env bash
# ==============================================================================
# Advent of Agents S3 — Day 18: Agent Registry (Single Source of Truth)
# Beat 0: Data Analyst & Platform Admin Persona (BigQuery & Gemini Enterprise)
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
echo -e "${MAGENTA}${BOLD}  BEAT 0 — DATA ANALYST & PLATFORM ADMIN PERSONA (BigQuery & Gemini Enterprise)${RESET}"
echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${YELLOW}• Why This Surface:${RESET} Data Analysts & BI teams use BigQuery and Gemini Enterprise"
echo -e "  for conversational analytics and enterprise search without building custom servers."
echo -e "${GREEN}• What Happens Automatically in Agent Registry:${RESET}"
echo -e "  The moment APIs are enabled, Agent Registry AUTOMATICALLY backfills Google-managed"
echo -e "  remote MCP servers (including ${BOLD}bigquery.googleapis.com${RESET} and ${BOLD}agentregistry.googleapis.com${RESET})"
echo -e "  in ${BOLD}global${RESET}, plus existing Gemini Enterprise & Agent Runtime agents!"
echo -e "${CYAN}• Value Addition:${RESET} Instant Day-0 visibility into every managed Google Cloud tool and"
echo -e "  agent — answering Customer Q2 ('Does Agent Registry backfill existing resources?')."
echo ""

echo -e "${CYAN}${BOLD}[1/3] Auto-Backfilled Google Cloud Remote MCP Servers (location=global):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry mcp-servers list \
  --location=global \
  --project="${PROJECT_ID}" \
  --filter="displayName:(bigquery.googleapis.com OR agentregistry.googleapis.com OR dataplex.googleapis.com OR dataproc.googleapis.com OR container.googleapis.com OR run.googleapis.com OR discoveryengine.googleapis.com)" \
  --format="table(displayName:label=MCP_SERVER, mcpServerId:label=CANONICAL_URN, interfaces[0].url:label=ENDPOINT_URL, tools.len():label=TOOL_COUNT)"

echo ""
echo -e "${CYAN}${BOLD}[2/3] Auto-Backfilled Gemini Enterprise & Workspace Agents (location=global):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry agents list \
  --location=global \
  --project="${PROJECT_ID}" \
  --format="table(displayName:label=AGENT_NAME, agentId:label=AGENT_URN, version:label=VERSION)"

echo ""
echo -e "${CYAN}${BOLD}[3/3] Auto-Backfilled Agent Runtime & Regional Agents (location=${REGION}):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry agents list \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="table(displayName:label=AGENT_NAME, framework:label=FRAMEWORK, agentId:label=AGENT_URN)"
