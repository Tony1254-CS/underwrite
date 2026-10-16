# Rules for coding agents
1. Before editing: read STATUS.md, then the plan.md section for your phase. Do not read all of plan.md unless needed.
2. Verify STATUS.md claims yourself: run the listed tests before building on them.
3. Never put private keys, seeds or API keys in code, logs, prompts, commits or the LLM context. Use .env (gitignored).
4. Money is bigint base units. Never number/float.
5. The LLM never chooses an address, token, calldata or limit. Do not add tools that allow it.
6. Never mark a payment executed without a success receipt AND a matching decoded PaymentExecuted event.
7. Never fabricate results, hashes, test outcomes or metrics. If you did not run it, write "not run".
8. Contract changes: add/adjust tests in the same commit; run `forge test` and `forge fmt`; note invariants touched in the commit body.
9. Small commits: `type(scope): summary` (feat, fix, test, docs, refactor, chore). One logical change per commit.
10. After finishing a task: update STATUS.md (handoff block), TESTING.md (command + observed output summary), CHANGELOG.md; record new decisions in DECISIONS.md.
11. If the spec is ambiguous, choose the safer behaviour, record it in DECISIONS.md as PROVISIONAL, and list it under "Outstanding decisions" in STATUS.md.
12. Label anything simulated, scripted, replayed or controlled, in code output and UI.

## Tracker rules
- `PHASES.md` is the progress source of truth.
- Start each session with `bash scripts/progress.sh`.
- Follow `PHASES.md` §A–§C.
- Test names carry `INV<n>_`.
