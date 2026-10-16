#!/usr/bin/env bash
set -euo pipefail

# scripts/demo-local.sh
# Complete local offline demo runner for UNDERWRITE per plan §10 and PHASES.md P8-T10.
# Starts local Anvil, deploys contracts, seeds initial state past cooldowns,
# activates qualifications, and serves the local Web UI offline (0 external assets).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PORT=8545
RPC_URL="http://127.0.0.1:${PORT}"
WEB_PORT=3000

echo "================================================================="
echo "       UNDERWRITE — Local Demo Runner (Fully Offline)           "
echo "================================================================="

# 1. Start local Anvil node if not already running
echo ""
echo "--> [1/4] Checking local Anvil Ethereum node on port ${PORT}..."
if ! curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "${RPC_URL}" >/dev/null 2>&1; then
    echo "Starting background Anvil node..."
    anvil --port "${PORT}" --silent > /dev/null 2>&1 &
    ANVIL_PID=$!
    echo "Anvil running with PID: ${ANVIL_PID}"

    # Wait for node readiness
    for i in {1..20}; do
        if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "${RPC_URL}" >/dev/null 2>&1; then
            echo "Anvil is operational."
            break
        fi
        sleep 0.5
    done
else
    echo "Anvil is already operational on port ${PORT}."
fi

# 2. Deploy contracts and fast-forward past cooldown
echo ""
echo "--> [2/4] Deploying UnderwriteVault, BondPool & MockUSDC on Anvil..."
cd "${ROOT_DIR}/contracts"
forge script script/Deploy.s.sol:DeployScript --rpc-url "${RPC_URL}" --broadcast > /dev/null 2>&1

echo "Fast-forwarding block timestamp past 300s recipient cooldown..."
cast rpc evm_increaseTime 301 --rpc-url "${RPC_URL}" >/dev/null 2>&1 || true
cast rpc evm_mine --rpc-url "${RPC_URL}" >/dev/null 2>&1 || true

# 3. Seed demo qualification
echo ""
echo "--> [3/4] Generating and activating qualification on-chain..."
cd "${ROOT_DIR}"
pnpm -C engine exec tsx ../scripts/qualify-dev.ts > /dev/null 2>&1

VAULT_ADDR="$(node -e "console.log(JSON.parse(fs.readFileSync('contracts/deployments/31337.json')).vault)")"
BOND_ADDR="$(node -e "console.log(JSON.parse(fs.readFileSync('contracts/deployments/31337.json')).bondPool)")"

echo "UnderwriteVault deployed at: ${VAULT_ADDR}"
echo "BondPool deployed at:        ${BOND_ADDR}"

# 4. Launch web application
echo ""
echo "--> [4/4] Starting Next.js Web UI on http://localhost:${WEB_PORT}..."
echo ""
echo "================================================================="
echo "             DEMO READY — ALL ENCLAVES ACTIVE                    "
echo "================================================================="
echo "  Dashboard & Authority Meter: http://localhost:${WEB_PORT}/"
echo "  Exam & Policy Cards:         http://localhost:${WEB_PORT}/exam"
echo "  Run Traces (4-State Flow):   http://localhost:${WEB_PORT}/traces"
echo "  Attack Lab (Red Team):       http://localhost:${WEB_PORT}/attack-lab"
echo "  Claims & Atomic Settlement:  http://localhost:${WEB_PORT}/claims"
echo "  Evidence & Live Verifier:    http://localhost:${WEB_PORT}/evidence"
echo "  Calibration Experiment:      http://localhost:${WEB_PORT}/experiment"
echo "================================================================="
echo "Zero CDN dependencies. Zero telemetry. Mainland China reachable."
echo "Press Ctrl+C to stop the demo server."
echo ""

pnpm --filter web start -p ${WEB_PORT} || pnpm --filter web dev -p ${WEB_PORT}
