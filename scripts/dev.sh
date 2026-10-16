#!/usr/bin/env bash
set -euo pipefail

# scripts/dev.sh
# Starts Anvil (if not running), deploys MockUSDC + BondPool + UnderwriteVault,
# funds vault and bond pool, registers demo vendors, fast-forwards through cooldown,
# and activates a test qualification for local development.

PORT=8545
RPC_URL="http://127.0.0.1:${PORT}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Checking Anvil status on port ${PORT} ==="
if ! curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "${RPC_URL}" >/dev/null 2>&1; then
    echo "Starting local Anvil node on port ${PORT} in background..."
    anvil --port "${PORT}" --silent > /dev/null 2>&1 &
    ANVIL_PID=$!
    echo "Anvil started with PID: ${ANVIL_PID}"

    # Wait for Anvil to respond
    for i in {1..20}; do
        if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "${RPC_URL}" >/dev/null 2>&1; then
            echo "Anvil is ready."
            break
        fi
        sleep 0.5
    done
else
    echo "Anvil is already running on port ${PORT}."
fi

echo ""
echo "=== Deploying Underwrite Protocol to Anvil ==="
cd "${ROOT_DIR}/contracts"
forge script script/Deploy.s.sol:DeployScript --rpc-url "${RPC_URL}" --broadcast

echo ""
echo "=== Fast-forwarding time past recipient cooldown (300s) ==="
cast rpc evm_increaseTime 301 --rpc-url "${RPC_URL}" >/dev/null 2>&1 || true
cast rpc evm_mine --rpc-url "${RPC_URL}" >/dev/null 2>&1 || true

echo ""
echo "=== Activating test qualification ==="
cd "${ROOT_DIR}"
pnpm -C engine exec tsx ../scripts/qualify-dev.ts

echo ""
echo "=== Dev environment ready ==="
VAULT_ADDR="$(node -e "console.log(JSON.parse(fs.readFileSync('contracts/deployments/31337.json')).vault)")"
echo "Vault address: ${VAULT_ADDR}"
