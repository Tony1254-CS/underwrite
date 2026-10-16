# UNDERWRITE — Test & Verification Log (`TESTING.md`)

## Environment (observed 2026-10-16)

```text
git: git version 2.54.0.windows.1
node: v22.19.0
pnpm: 12.8.1
forge: forge 1.8.5 (51a52c59cf 2026-10-05T17:01:32.131957300Z)
anvil: anvil 1.8.5 (51a52c59cf 2026-10-05T17:01:32.131957300Z)
cast: cast 1.8.5 (51a52c59cf 2026-10-05T17:01:32.131957300Z)
python: Python 3.13.7
OS: Windows 11 / PowerShell 5.1 / Git Bash
```

## Known-failing tests

None.

## Verification Log

- 2026-10-16 12:25 UTC | commit: a9f6329 | `git rev-parse --is-inside-work-tree; pnpm -v; forge --version; anvil --version; cast --version` -> true, 12.8.1, forge 1.8.5, anvil 1.8.5, cast 1.8.5. All required tools detected and verified.
- 2026-10-16 12:28 UTC | commit: 293cd04 | `grep -c '^## DEC-' DECISIONS.md; test -f STATUS.md && test -f DECISIONS.md && test -f TESTING.md && test -f CHANGELOG.md` -> 19, all four files exist.
- 2026-10-16 12:30 UTC | commit: d300685 | `sed -n '875,888p' plan.md | diff -u - <(head -n 13 AGENTS.md); test -f AGENTS.md && test -f CLAUDE.md && test -f GEMINI.md` -> 12 rules match line for line; all 3 files exist.
- 2026-10-16 12:31 UTC | commit: 0a782e3 | `git check-ignore -v .env .keys/x contracts/broadcast/x; git check-ignore .env.example evidence/onchain/x contracts/deployments/84532.json` -> all 3 ignored properly; tracked files print nothing.
- 2026-10-16 12:32 UTC | commit: 71ec0e8 | `git ls-files | grep -c gitkeep` -> 25 gitkeep files present; all 25 skeleton directories and README.md created.
- 2026-10-16 12:38 UTC | commit: 835f50b | `pnpm install && pnpm -r build && pnpm -r lint && pnpm -r typecheck && pnpm -r test` -> all 5 commands exit 0 across engine and web workspace packages; smoke test passed (1 test).
- 2026-10-16 12:47 UTC | commit: e0c43a5 | `cd contracts && forge build && forge test && forge fmt --check` -> compiled with solc 0.8.28; 1 test passed (test_smoke_arithmetic); formatting check clean.
- 2026-10-16 12:49 UTC | commit: pending | `.github/workflows/ci.yml created; verified all CI commands locally: forge fmt, build, test, and pnpm install --frozen-lockfile, lint, typecheck, test` -> all exit 0.
