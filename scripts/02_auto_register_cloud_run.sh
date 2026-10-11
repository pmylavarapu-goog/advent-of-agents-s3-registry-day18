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

echo -e "${ORANGE}${BOLD}🎃 [Step 2/4] Automatic Registration for Cloud Run & GKE Agents${RESET}"
echo -e "${CYAN}Customer Question (Q3): \"How do we automatically register Cloud Run (and GKE) agents in Agent Registry?\"${RESET}\n"

echo -e "${BOLD}$ gcloud run deploy billing-triage-agent \\
    --source=./cloud_run_agent \\
    --region=${REGION} \\
    --functional-type=agent \\
    --identity-type=agent-identity \\
    --project=${PROJECT_ID}${RESET}"

if [[ "$DEMO_MODE" == "simulate" ]]; then
  sleep 1.0
  cat << EOF
Building using Dockerfile and deploying container to Cloud Run service [billing-triage-agent] in project [${PROJECT_ID}] region [${REGION}]
✓ Building and deploying... Done.
  ✓ Uploading sources...
  ✓ Building Container...
  ✓ Provisioning cryptographic SPIFFE Agent Identity (identity-type=agent-identity)...
  ✓ Registering workload (functional-type=agent) in Agent Registry...
  ✓ Routing traffic...
Done.
Service [billing-triage-agent] revision [billing-triage-agent-00001-x9k] has been deployed and is serving 100 percent of traffic.
Service URL: https://billing-triage-agent-74829104.${REGION}.run.app
Agent Identity Principal: principal://agents.global.org-918273645.system.id.goog/resources/cloudrun/projects/${PROJECT_ID}/regions/${REGION}/services/billing-triage-agent
EOF
else
  gcloud run deploy billing-triage-agent \
    --source=./cloud_run_agent \
    --region="${REGION}" \
    --functional-type=agent \
    --identity-type=agent-identity \
    --project="${PROJECT_ID}"
fi

echo -e "\n${GREEN}✅ Cloud Run agent deployed with SPIFFE identity and automatically registered in Agent Registry!${RESET}"
