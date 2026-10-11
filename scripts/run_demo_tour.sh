#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE_FLAG="${1:---simulate}"

ORANGE='\033[38;5;208m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

clear || true
echo -e "${ORANGE}${BOLD}================================================================================${RESET}"
echo -e "${ORANGE}${BOLD}  🎃 ADVENT OF AGENTS • SEASON 3 • DAY 18 — LIVE KATA DEMO                      ${RESET}"
echo -e "${PURPLE}${BOLD}  Topic: Agent Registry — Single Source of Truth Across Runtimes & Clouds      ${RESET}"
echo -e "${ORANGE}${BOLD}================================================================================${RESET}\n"

bash "${SCRIPT_DIR}/01_setup_and_backfill.sh" "${MODE_FLAG}"
echo -e "\n--------------------------------------------------------------------------------\n"
bash "${SCRIPT_DIR}/02_auto_register_cloud_run.sh" "${MODE_FLAG}"
echo -e "\n--------------------------------------------------------------------------------\n"
bash "${SCRIPT_DIR}/03_register_multicloud_and_spoke.sh" "${MODE_FLAG}"
echo -e "\n--------------------------------------------------------------------------------\n"
bash "${SCRIPT_DIR}/04_discover_and_verify.sh" "${MODE_FLAG}"

echo -e "\n${ORANGE}${BOLD}🎃 End of Day 18 Kata! Next up on Day 19: Dynamic MCP Tool Governance!${RESET}"
