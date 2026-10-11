#!/usr/bin/env bash
# ==============================================================================
# Advent of Agents S3 — Day 18: Agent Registry (Single Source of Truth)
# Beat 3: Application Team Persona (ADK Python SDK + Cloud Run)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ID="${PROJECT_ID:-praveenamylavarapu-july2022}"
REGION="${REGION:-us-central1}"
AGENT_NAME="${ADK_AGENT_NAME:-revenue-insights-agent}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${MAGENTA}${BOLD}  BEAT 3 — APPLICATION TEAM PERSONA (ADK Python SDK + Cloud Run)${RESET}"
echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${YELLOW}• Why This Surface:${RESET} Application engineers build multi-step Python agents with ADK"
echo -e "  and deploy them to serverless Cloud Run."
echo -e "${GREEN}• What Happens Automatically in Agent Registry:${RESET}"
echo -e "  1. ${BOLD}Dynamic Tool Resolution:${RESET} ${BOLD}AgentRegistry(project_id, location).get_mcp_toolset(...)${RESET}"
echo -e "     resolves ${BOLD}customer-analytics-mcp${RESET} at runtime — zero hardcoded URLs!"
echo -e "  2. ${BOLD}Zero-Touch Agent Registration & Identity:${RESET} Deploying to Cloud Run with"
echo -e "     ${BOLD}--functional-type=agent --identity-type=agent-identity${RESET} AUTOMATICALLY provisions"
echo -e "     a SPIFFE identity (${BOLD}principal://...${RESET}) and registers ${BOLD}${AGENT_NAME}${RESET} in Agent Registry!"
echo -e "${CYAN}• Value Addition:${RESET} Answers Customer Q3 ('How do I auto-register Cloud Run agents?')"
echo -e "  while eliminating brittle hardcoded service URLs across application code."
echo ""

echo -e "${CYAN}${BOLD}[1/3] Inspecting ADK AgentRegistry Code (adk_agent/agent.py):${RESET}"
sed -n '75,112p' "${REPO_ROOT}/adk_agent/agent.py"

echo ""
echo -e "${CYAN}${BOLD}[2/3] Verifying ${AGENT_NAME} Auto-Registration & Identity in Agent Registry (${REGION}):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud agent-registry agents list \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --filter="displayName:${AGENT_NAME}" \
  --format="yaml(name,displayName,agentId,attributes)"

echo ""
echo -e "${CYAN}${BOLD}[3/3] Calling Live Cloud Run Agent (/discover & /.well-known/agent.json):${RESET}"
AGENT_URL=$(CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud run services describe "${AGENT_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --format="value(status.url)")
echo -e "  • Live Cloud Run URL: ${BOLD}${AGENT_URL}${RESET}"
curl -s "${AGENT_URL}/discover" | python3 -m json.tool
