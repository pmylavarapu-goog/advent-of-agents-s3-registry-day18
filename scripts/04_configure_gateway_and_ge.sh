#!/usr/bin/env bash
# ==============================================================================
# Advent of Agents S3 — Day 18: Agent Registry (Single Source of Truth)
# Beat 4: Business User & Security Admin Persona (Gemini Enterprise + Agent Gateway)
# ==============================================================================
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-praveenamylavarapu-july2022}"
REGION="${REGION:-us-central1}"
AGW_NAME="${AGW_NAME:-agw-day18}"
UAP_POLICY_NAME="${UAP_POLICY_NAME:-day18-analytics-uap-policy}"
GE_APP_ID="${GE_APP_ID:-advent-day18-ge}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${MAGENTA}${BOLD}  BEAT 4 — BUSINESS USER & SECURITY ADMIN (Gemini Enterprise + Agent Gateway)${RESET}"
echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${YELLOW}• Why This Surface:${RESET} Business users ask questions in Gemini Enterprise web chat,"
echo -e "  while Security Admins need zero-trust, tool-level guardrails without slowing teams down."
echo -e "${GREEN}• What Happens Automatically in Agent Registry:${RESET}"
echo -e "  1. Gemini Enterprise imports ${BOLD}customer-analytics-mcp${RESET} directly from Agent Registry"
echo -e "     (${BOLD}mcp_server_source: REGISTRY_MCP${RESET}) and routes egress through ${BOLD}${AGW_NAME}${RESET}."
echo -e "  2. On every tool call, Agent Gateway AUTOMATICALLY resolves ${BOLD}destination.is_registered${RESET}"
echo -e "     and ${BOLD}destination.agent_registry.mcp_server.tool.name${RESET} from Agent Registry for"
echo -e "     IAP v2 IAM Unified Access Policy (CEL) enforcement!"
echo -e "${CYAN}• Value Addition:${RESET} Read-only ${BOLD}query_kpi_summary${RESET} succeeds (${GREEN}200 ALLOWED${RESET}), while"
echo -e "  destructive ${BOLD}purge_customer_table${RESET} is blocked at the gateway edge (${YELLOW}403 DENIED${RESET})!"
echo ""

echo -e "${CYAN}${BOLD}[1/4] Agent Gateway (${AGW_NAME}) Bound to Agent Registry:${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud network-services agent-gateways describe "${AGW_NAME}" \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="yaml(name,protocols,registries,networkConfig)"

echo ""
echo -e "${CYAN}${BOLD}[2/4] IAM Unified Access Policy (${UAP_POLICY_NAME}) CEL Rules:${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud iam access-policies describe "${UAP_POLICY_NAME}" \
  --project="${PROJECT_ID}" \
  --location=global \
  --flatten="details.rules[]" \
  --format="table(details.rules.description:label=RULE_DESCRIPTION, details.rules.effect:label=EFFECT, details.rules.conditions.'iap.googleapis.com'.expression:label=CEL_EXPRESSION)"

echo ""
echo -e "${CYAN}${BOLD}[3/4] Gemini Enterprise App (${GE_APP_ID}) Egress Gateway & REGISTRY_MCP Connector:${RESET}"
TOKEN=$(CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud auth application-default print-access-token)
curl -s "https://global-discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/collections/default_collection/engines/${GE_APP_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Goog-User-Project: ${PROJECT_ID}" | python3 -c '
import json, sys
d = json.load(sys.stdin)
print(json.dumps({
  "engine": d.get("name"),
  "displayName": d.get("displayName"),
  "dataStoreIds": d.get("dataStoreIds", []),
  "agentGatewaySetting": d.get("agentGatewaySetting", {})
}, indent=2))
'

echo ""
echo -e "${CYAN}${BOLD}[4/4] Agent Gateway Audit Logs (MCP tool calls & lifecycle via ${AGW_NAME}):${RESET}"
CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud logging read 'resource.type="networkservices.googleapis.com/Gateway" AND jsonPayload.agentGatewayInfo.mcpInfo.method!=""' \
  --project="${PROJECT_ID}" \
  --limit=10 \
  --format="table(timestamp.date(tz=LOCAL):label=TIMESTAMP, httpRequest.status:label=STATUS, httpRequest.serverIp:label=PSC_ENDPOINT, jsonPayload.agentGatewayInfo.mcpInfo.method:label=MCP_METHOD, jsonPayload.agentGatewayInfo.mcpInfo.parameter:label=TOOL_NAME, jsonPayload.authzPolicyInfo.result:label=AUTHZ_DECISION, jsonPayload.agentGatewayInfo.agentRegistryResource.basename():label=REGISTRY_RESOURCE)"
