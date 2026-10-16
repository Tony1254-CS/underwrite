#!/usr/bin/env bash
set -euo pipefail

# scripts/claim-demo.sh
# Spawns an ephemeral anvil node, executes ClaimDemo.s.sol with --broadcast,
# prints the three outcomes and transaction hashes, then shuts down anvil.

PORT=8545
RPC_URL="http://127.0.0.1:${PORT}"
ANVIL_LOG="$(mktemp -t anvil-log.XXXXXX)"

echo "=== Starting fresh local Anvil node on port ${PORT} ==="
anvil --port "${PORT}" --silent > "${ANVIL_LOG}" 2>&1 &
ANVIL_PID=$!

cleanup() {
    echo "=== Shutting down Anvil node (PID: ${ANVIL_PID}) ==="
    kill "${ANVIL_PID}" 2>/dev/null || true
    rm -f "${ANVIL_LOG}"
}
trap cleanup EXIT

# Wait up to 10 seconds for Anvil to respond
echo "Waiting for Anvil RPC to become responsive..."
for i in {1..20}; do
    if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "${RPC_URL}" >/dev/null 2>&1; then
        echo "Anvil is ready."
        break
    fi
    sleep 0.5
done

echo ""
echo "=== Running ClaimDemo script with --broadcast on Anvil ==="
cd contracts
forge script script/ClaimDemo.s.sol:ClaimDemoScript --rpc-url "${RPC_URL}" --broadcast -vv

echo ""
echo "=== ClaimDemo script executed successfully ==="
