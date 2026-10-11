#!/usr/bin/env bash
# ==============================================================================
# Advent of Agents S3 — Day 18: Agent Registry (Single Source of Truth)
# Beat 2: Developer Persona (Antigravity IDE / Gemini CLI)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ID="${PROJECT_ID:-praveenamylavarapu-july2022}"
REGION="${REGION:-us-central1}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${MAGENTA}${BOLD}  BEAT 2 — DEVELOPER PERSONA (Antigravity IDE / Gemini CLI)${RESET}"
echo -e "${MAGENTA}${BOLD}================================================================================${RESET}"
echo -e "${YELLOW}• Why This Surface:${RESET} Developers live inside Antigravity IDE and Gemini CLI while"
echo -e "  prototyping new agents and want to know what enterprise tools already exist."
echo -e "${GREEN}• What Happens Automatically in Agent Registry:${RESET}"
echo -e "  Enabling Agent Registry AUTOMATICALLY turns on Google's managed remote MCP server"
echo -e "  at ${BOLD}https://agentregistry.googleapis.com/mcp${RESET}, indexing every agent and MCP"
echo -e "  server across the project for natural-language discovery (search_mcp_servers, search_agents)."
echo -e "${CYAN}• Value Addition:${RESET} Developers discover Data Engineering's ${BOLD}customer-analytics-mcp${RESET}"
echo -e "  and its exact tool schemas right inside their IDE — instead of rebuilding duplicate tools!"
echo ""

echo -e "${CYAN}${BOLD}[1/2] Antigravity IDE MCP Config (antigravity/mcp_config.snippet.json):${RESET}"
cat "${REPO_ROOT}/antigravity/mcp_config.snippet.json"

echo ""
echo -e "${CYAN}${BOLD}[2/2] Live Query to https://agentregistry.googleapis.com/mcp (list_mcp_servers):${RESET}"
TOKEN=$(CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski" \
  gcloud auth application-default print-access-token)

curl -s -X POST "https://agentregistry.googleapis.com/mcp" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Goog-User-Project: ${PROJECT_ID}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"list_mcp_servers\",
      \"arguments\": {
        \"parent\": \"projects/${PROJECT_ID}/locations/${REGION}\"
      }
    }
  }" | python3 -c '
import json, sys
data = json.load(sys.stdin)
servers = data.get("result", {}).get("structuredContent", {}).get("mcpServers", [])
for s in servers:
    print("  ✔ Discovered MCP Server:", s.get("displayName"))
    print("    • Resource Name :", s.get("name"))
    print("    • Canonical URN :", s.get("mcpServerId"))
    print("    • Endpoint URL  :", s.get("interfaces", [{}])[0].get("url"))
    print("    • Tools         :")
    for t in s.get("tools", []):
        ann = t.get("annotations", {})
        mode = "READ-ONLY" if ann.get("readOnlyHint") else ("DESTRUCTIVE" if ann.get("destructiveHint") else "WRITE")
        t_name = t.get("name", "")
        t_desc = t.get("description", "")
        print(f"        - {t_name} [{mode}]: {t_desc}")
'
