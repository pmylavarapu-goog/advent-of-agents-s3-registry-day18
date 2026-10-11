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

echo -e "${ORANGE}${BOLD}🎃 [Step 3/4] Scaling Registry Across Spoke Projects & Multi-Cloud (AWS/Azure/On-Prem)${RESET}"
echo -e "${CYAN}Customer Question (Q4): \"Can I register and discover agents running across spoke projects or outside Google Cloud (AWS, Azure, on-prem)?\"${RESET}\n"

echo -e "${BOLD}# 1. Register an external AWS Agent2Agent (A2A) workload with its Agent Card JSON:${RESET}"
echo -e "${BOLD}$ gcloud agent-registry services create aws-fraud-agent \\
    --project=${PROJECT_ID} \\
    --location=${REGION} \\
    --display-name=\"AWS Fraud Detection Agent\" \\
    --agent-spec-type=a2a-agent-card \\
    --agent-spec-content=@specs/aws_fraud_agent_card.json${RESET}"

if [[ "$DEMO_MODE" == "simulate" ]]; then
  sleep 0.8
  cat << EOF
Create request issued for: [aws-fraud-agent]
Waiting for operation [projects/${PROJECT_ID}/locations/${REGION}/operations/op-a2a-98123] to complete...done.
Created service [aws-fraud-agent].
Indexed A2A Agent Card (schemaVersion: v1) with 2 skills: [score_transaction, quarantine_merchant_account].
Generated Agent resource: projects/${PROJECT_ID}/locations/${REGION}/agents/aws-fraud-agent
EOF
else
  gcloud agent-registry services create aws-fraud-agent \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --display-name="AWS Fraud Detection Agent" \
    --agent-spec-type=a2a-agent-card \
    --agent-spec-content=@specs/aws_fraud_agent_card.json
fi

echo ""
echo -e "${BOLD}# 2. Register a spoke-project standard REST agent for central Agent Egress Gateway governance:${RESET}"
echo -e "${BOLD}$ gcloud agent-registry services create spoke-support-agent \\
    --project=${PROJECT_ID} \\
    --location=${REGION} \\
    --display-name=\"Spoke Support REST Agent\" \\
    --agent-spec-type=no-spec \\
    --interfaces=url=https://support-agent-xyz.${REGION}.run.app,protocolBinding=http-json${RESET}"

if [[ "$DEMO_MODE" == "simulate" ]]; then
  sleep 0.8
  cat << EOF
Create request issued for: [spoke-support-agent]
Waiting for operation [projects/${PROJECT_ID}/locations/${REGION}/operations/op-rest-44109] to complete...done.
Created service [spoke-support-agent].
Generated Agent resource: projects/${PROJECT_ID}/locations/${REGION}/agents/spoke-support-agent
EOF
else
  gcloud agent-registry services create spoke-support-agent \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --display-name="Spoke Support REST Agent" \
    --agent-spec-type=no-spec \
    --interfaces="url=https://support-agent-xyz.${REGION}.run.app,protocolBinding=http-json"
fi

echo -e "\n${GREEN}✅ External AWS A2A agent and spoke-project REST agent registered into the central governance catalog!${RESET}"
