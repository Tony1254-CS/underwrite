#!/usr/bin/env bash
# UNDERWRITE — Base Sepolia Testnet Deployment Script (P6-T02)
# Deploys MockUSDC, BondPool, and UnderwriteVault to Base Sepolia (Chain ID: 84532).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env if present
if [ -f "$REPO_ROOT/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$REPO_ROOT/.env" | xargs -d '\n' 2>/dev/null || true)
fi

RPC_URL="${RPC_URL_BASE_SEPOLIA:-https://sepolia.base.org}"
CHAIN_ID=84532

echo "=== UNDERWRITE Base Sepolia Deployment ==="
echo "RPC URL: $RPC_URL"

# Verify Chain ID
REMOTE_CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL")
if [ "$REMOTE_CHAIN_ID" != "$CHAIN_ID" ]; then
  echo "ERROR: RPC Chain ID $REMOTE_CHAIN_ID does not match expected Base Sepolia $CHAIN_ID"
  exit 1
fi
echo "Verified Chain ID: $REMOTE_CHAIN_ID"

# Verify Deployer private key
if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "ERROR: DEPLOYER_PRIVATE_KEY is not set in environment or .env"
  exit 1
fi

DEPLOYER_ADDR=$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY")
BALANCE=$(cast balance "$DEPLOYER_ADDR" --rpc-url "$RPC_URL")
echo "Deployer Address: $DEPLOYER_ADDR"
echo "Deployer Balance: $BALANCE wei"

if [ "$BALANCE" = "0" ]; then
  echo "ERROR: Deployer balance is 0 wei. Faucet funding required on Base Sepolia before broadcasting."
  echo "Please request testnet ETH from a Base Sepolia faucet (e.g. https://www.alchemy.com/faucets/base-sepolia) to: $DEPLOYER_ADDR"
  exit 1
fi

cd "$REPO_ROOT/contracts"

echo "Broadcasting deployment transactions..."
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url "$RPC_URL" \
  --broadcast \
  -vvv

DEPLOY_FILE="$REPO_ROOT/contracts/deployments/84532.json"
if [ ! -f "$DEPLOY_FILE" ]; then
  echo "ERROR: Deployment file $DEPLOY_FILE was not generated"
  exit 1
fi

echo "Deployment complete! Verifying deployed contracts..."
VAULT_ADDR=$(node -pe "require('$DEPLOY_FILE').vault")
VERSION=$(cast call "$VAULT_ADDR" "VERSION()(string)" --rpc-url "$RPC_URL")

echo "Vault Address: $VAULT_ADDR"
echo "Vault VERSION: $VERSION"

if [ "$VERSION" != "\"1.0.0\"" ] && [ "$VERSION" != "1.0.0" ]; then
  echo "ERROR: Vault version check failed (got $VERSION)"
  exit 1
fi

echo "=== SUCCESS: UnderwriteVault v1.0.0 verified on Base Sepolia ==="
