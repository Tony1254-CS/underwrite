#!/usr/bin/env sh
set -e

# Setup git hooks path
git config core.hooksPath .githooks
echo "Git hooks configured (core.hooksPath set to .githooks)"
