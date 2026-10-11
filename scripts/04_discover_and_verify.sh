#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-enterprise-agent-gov-hub}"
REGION="${REGION:-us-central1}"
DEMO_MODE="${DEMO_MODE:-live}"
if [[ "${1:-}" == "--simulate" ]]; then DEMO_MODE="simulate"; fi

ORANGE='\033[38;5;208m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${ORANGE}${BOLD}🎃 [Step 4/4] Unified Discovery & Inventory Verification Across Runtimes & Clouds${RESET}"
echo -e "${CYAN}Customer Question (Q1): \"How do we maintain an inventory of all active agents, MCP servers, and tools across the company?\"${RESET}\n"

echo -e "${BOLD}$ gcloud agent-registry agents list --project=${PROJECT_ID} --location=${REGION}${RESET}"
if [[ "$DEMO_MODE" == "simulate" ]]; then
  sleep 0.8
  cat << EOF
AGENT_ID                                                             DISPLAY_NAME                RUNTIME              SKILLS / PROTOCOL          LOCATION
urn:agent:cloudrun:${PROJECT_ID}:${REGION}:billing-triage-agent      Billing Triage Agent        CLOUD_RUN (Auto)     A2A (2 skills indexed)     ${REGION}
urn:agent:agentruntime:${PROJECT_ID}:${REGION}:support-agent         support-agent               AGENT_RUNTIME (Auto) ADK / A2A (1 skill)        ${REGION}
urn:agent:gke:${PROJECT_ID}:${REGION}:default:inventory-a2a-agent    inventory-a2a-agent         GKE (Auto)           A2A (/.well-known/card)    ${REGION}
urn:agent:custom:${PROJECT_ID}:${REGION}:aws-fraud-agent             AWS Fraud Detection Agent   EXTERNAL (Manual)    A2A (2 skills indexed)     ${REGION}
urn:agent:custom:${PROJECT_ID}:${REGION}:spoke-support-agent         Spoke Support REST Agent    CROSS_PROJECT (Man)  HTTP_JSON (NO_SPEC)        ${REGION}
EOF
else
  gcloud agent-registry agents list \
    --project="${PROJECT_ID}" \
    --location="${REGION}"
fi

echo ""
echo -e "${BOLD}# Filter specifically for our Cloud Run agent by displayName:${RESET}"
echo -e "${BOLD}$ gcloud agent-registry agents list --project=${PROJECT_ID} --location=${REGION} --filter=\"displayName='Billing Triage Agent'\"${RESET}"
if [[ "$DEMO_MODE" == "simulate" ]]; then
  sleep 0.6
  cat << EOF
AGENT_ID                                                             DISPLAY_NAME          RUNTIME           LOCATION
urn:agent:cloudrun:${PROJECT_ID}:${REGION}:billing-triage-agent      Billing Triage Agent  CLOUD_RUN (Auto)  ${REGION}
EOF
else
  gcloud agent-registry agents list \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --filter="displayName='Billing Triage Agent'"
fi

echo -e "\n${GREEN}✅ All agents — Agent Runtime, Cloud Run, GKE, Spoke GCP Projects, and AWS — are indexed in one Single Source of Truth!${RESET}"
