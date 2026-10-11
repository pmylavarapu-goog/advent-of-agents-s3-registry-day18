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

echo -e "${ORANGE}${BOLD}🎃 [Step 1/4] Enabling Agent Registry & Inspecting Auto-Backfilled Agents${RESET}"
echo -e "${CYAN}Customer Question (Q2): \"How do I know what agents already exist across my org? Does Agent Registry backfill agents?\"${RESET}\n"

echo -e "${BOLD}$ gcloud services enable agentregistry.googleapis.com --project=${PROJECT_ID}${RESET}"
if [[ "$DEMO_MODE" == "simulate" ]]; then
  sleep 0.6
  echo "Operation \"operations/acat.p2-849201-a91b-4c22\" finished successfully."
else
  gcloud services enable agentregistry.googleapis.com --project="${PROJECT_ID}"
fi

echo ""
echo -e "${BOLD}$ gcloud agent-registry agents list --project=${PROJECT_ID} --location=global --filter=\"agentId:'urn:agent:googleapis.com:*'\"${RESET}"
if [[ "$DEMO_MODE" == "simulate" ]]; then
  sleep 0.8
  cat << 'EOF'
AGENT_ID                                                DISPLAY_NAME                        RUNTIME              LOCATION
urn:agent:googleapis.com:workspace:drive-researcher     Google Workspace Drive Researcher   GOOGLE_MANAGED       global
urn:agent:googleapis.com:workspace:gmail-triage         Google Workspace Gmail Triage       GOOGLE_MANAGED       global
urn:agent:googleapis.com:gemini-enterprise:code-assist  Gemini Enterprise Code Assist       GOOGLE_MANAGED       global
EOF
else
  gcloud agent-registry agents list \
    --project="${PROJECT_ID}" \
    --location="global" \
    --filter="agentId:'urn:agent:googleapis.com:*'"
fi

echo -e "\n${GREEN}✅ Built-in Google Workspace & Gemini Enterprise agents are automatically backfilled with zero configuration!${RESET}"
