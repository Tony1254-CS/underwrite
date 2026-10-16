#!/usr/bin/env bash
# UNDERWRITE progress + next-task finder.  READ-ONLY: it never edits any file.
# Run from the repo root:   bash scripts/progress.sh [PHASES.md]
# Optional filter for your READY list:   TRACK=A|B|C|X bash scripts/progress.sh
# Numbers come from the checkboxes in PHASES.md. Probes check that key files really exist,
# so a stale or missing checkbox is caught (always verify; never trust a checkbox alone).
set -u
F="${1:-PHASES.md}"
[ -f "$F" ] || { echo "ERROR: $F not found. Run from the repo root."; exit 2; }

RAW="$(awk -v want="${TRACK:-}" '
function trim(s) { gsub(/^[ \t]+|[ \t]+$/, "", s); return s }
/^## P[0-9]+ / { cur=$2; if (!(cur in seen)) { seen[cur]=1; ph[++np]=cur }; next }
/^- \[[ x~!-]\] / {
  st=substr($0,4,1)
  n=split(substr($0,7), f, "|")
  if (n != 4) { print "WARN malformed task line (need exactly 4 |-separated fields): " $0; next }
  id=trim(f[1]); tr=trim(f[2]); nd=trim(f[3]); sub(/^needs:[ \t]*/, "", nd); ti=trim(f[4])
  if (id in S) print "WARN duplicate task id: " id
  if (tr !~ /^[ABCXHI]$/) print "WARN " id ": track must be one of A B C X H I (got " tr ")"
  S[id]=st; TR[id]=tr; ND[id]=nd; TI[id]=ti; ord[++N]=id
  tot[cur]++
  if (st=="x") dn[cur]++; else if (st=="-") sk[cur]++; else if (st=="~") ip[cur]++; else if (st=="!") bl[cur]++
  next
}
END {
  printf "%-6s %5s %5s %5s %5s %5s   %s\n", "PHASE","DONE","SKIP","WIP","BLOCK","TOTAL","PROGRESS"
  for (i=1;i<=np;i++) {
    p=ph[i]; t=tot[p]+0; d=dn[p]+0; s=sk[p]+0
    pct = t ? int(100*(d+s)/t) : 0
    bar=""; for (k=0;k<pct/5;k++) bar=bar "#"
    printf "%-6s %5d %5d %5d %5d %5d   %3d%% %s\n", p, d, s, ip[p]+0, bl[p]+0, t, pct, bar
    TD+=d; TS+=s; TT+=t
    print "#S " p " " (d+s) " " t " " (ip[p]+0)
  }
  printf "%-6s %5d %5d %5s %5s %5d   %3d%%\n", "TOTAL", TD, TS, "", "", TT, (TT ? int(100*(TD+TS)/TT) : 0)

  for (i=1;i<=N;i++) {            # validate every needs: reference
    id=ord[i]; m=split(ND[id], need, /[ ,]+/)
    for (j=1;j<=m;j++) { x=need[j]; if (x==""||x=="none") continue
      if (!(x in S)) print "WARN " id " needs unknown id " x }
  }
  for (i=1;i<=N;i++) {
    id=ord[i]
    if (S[id]=="~") wip[++nw]=id
    if (S[id]=="!") blk[++nb]=id
    if (S[id]!=" ") continue
    ok=1; m=split(ND[id], need, /[ ,]+/)
    for (j=1;j<=m;j++) { x=need[j]; if (x==""||x=="none") continue
      if (!(x in S) || (S[x]!="x" && S[x]!="-")) ok=0 }
    if (!ok) continue
    ti=TI[id]
    if (ti ~ /^OPTIONAL/) opt[++no]=id
    else if (ti ~ /^CHECKPOINT/) chk[++nc]=id
    else if (TR[id]=="H" || TR[id]=="I") hum[++nh]=id
    else if (want=="" || TR[id]==want || TR[id]=="X") rdy[++nr]=id
  }
  print ""
  print "IN PROGRESS ([~]) - check the Claim line; claims older than 2h with no file changes are stale:"
  if (nw==0) print "  (none)"; for (i=1;i<=nw;i++) print "  " wip[i] " [" TR[wip[i]] "] " TI[wip[i]]
  print "BLOCKED ([!]) - read the Blocked line under the task:"
  if (nb==0) print "  (none)"; for (i=1;i<=nb;i++) print "  " blk[i] " [" TR[blk[i]] "] " TI[blk[i]]
  print "READY FOR AGENTS (needs satisfied, unclaimed" (want!="" ? ", track " want " or X" : "") ") - take the FIRST one:"
  if (nr==0) print "  (none)"; for (i=1;i<=nr;i++) print "  " rdy[i] " [" TR[rdy[i]] "] " TI[rdy[i]]
  print "READY BUT NEEDS A HUMAN / ISOLATED AUTHOR (do not do these yourself; remind the human):"
  if (nh==0) print "  (none)"; for (i=1;i<=nh;i++) print "  " hum[i] " [" TR[hum[i]] "] " TI[hum[i]]
  print "CHECKPOINTS (act only after the time in the title has passed):"
  if (nc==0) print "  (none)"; for (i=1;i<=nc;i++) print "  " chk[i] " " TI[chk[i]]
  print "OPTIONAL (only when no required task is READY):"
  if (nopt==0 && no==0) print "  (none)"; for (i=1;i<=no;i++) print "  " opt[i] " " TI[opt[i]]
  if (nr>0) print "\nNEXT: " rdy[1] " - " TI[rdy[1]]; else print "\nNEXT: nothing ready for agents - see PHASES.md section A6"
}' "$F")"

echo "=== PHASES.md progress ($(date -u '+%Y-%m-%d %H:%M') UTC) ==="
printf '%s\n' "$RAW" | grep -v '^#S '

# ---- reality probes: do the key files of each phase actually exist? ----
has() { compgen -G "$1" >/dev/null 2>&1; }
probe() { # phase file...
  local p="$1"; shift; local have=0 tot=0 f
  for f in "$@"; do tot=$((tot+1)); has "$f" && have=$((have+1)); done
  local r=PARTIAL; [ "$have" -eq "$tot" ] && r=PRESENT; [ "$have" -eq 0 ] && r=ABSENT
  local line; line="$(printf '%s\n' "$RAW" | grep "^#S $p " || true)"
  local d=0 t=0 w=0; [ -n "$line" ] && read -r _ _ d t w <<<"$line"
  local note=""
  if [ "$t" -gt 0 ] && [ "$d" -eq "$t" ] && [ "$r" != PRESENT ]; then note="  <-- CHECK: all tasks marked done but files missing (ok only if a cut-line skipped them)"; fi
  if [ "$d" -eq 0 ] && [ "$w" -eq 0 ] && [ "$r" != ABSENT ]; then note="  <-- CHECK: files exist but no task is marked - untracked work, verify then update checkboxes"; fi
  printf '  %-4s %-8s (%d/%d key files)%s\n' "$p" "$r" "$have" "$tot" "$note"
}
echo
echo "=== Reality probes (existence only; passing probes do NOT prove the phase works - run its gate) ==="
probe P0 .git AGENTS.md STATUS.md DECISIONS.md TESTING.md .env.example .gitignore pnpm-workspace.yaml contracts/foundry.toml engine/package.json
probe P1 contracts/src/UnderwriteVault.sol contracts/src/MockUSDC.sol contracts/src/interfaces/IBondPool.sol engine/src/chain/abi/UnderwriteVault.json
probe P2 contracts/src/BondPool.sol engine/src/chain/abi/BondPool.json
probe P3 'engine/src/policy/*.ts' 'engine/src/signer/*.ts' 'engine/src/executor/*.ts' 'engine/src/manifest/*.ts' engine/src/cli.ts engine/fixtures/basic
probe P4 engine/src/agent/tools.ts engine/src/agent/scripted.ts engine/src/agent/llm.ts engine/src/agent/replay.ts
probe P5 engine/src/exam/generator.ts engine/src/exam/harness.ts engine/src/exam/scorer.ts engine/src/exam/report.ts 'engine/src/compiler/*.ts' 'scenarios/dev/*'
probe P6 contracts/script/Deploy.s.sol contracts/deployments/84532.json engine/src/evidence/onchainEvidence.ts evidence/onchain/EXECUTION_EVIDENCE.md
probe P7 docs/EXPERIMENT.md 'engine/src/experiment/*.ts' experiments/main.json
probe P8 web/package.json scripts/demo-local.sh
probe P9 docs/TECHNICAL.md docs/SECURITY_SELF_ASSESSMENT.md docs/DEMO_SCRIPT.md docs/competition/OFFICIAL_RULES.md

# ---- deadlines (GNU date needed; silently skipped elsewhere) ----
echo
echo "=== Time to deadlines (Bangladesh = UTC+6, Beijing = UTC+8) ==="
NOW="$(date -u +%s 2>/dev/null || echo 0)"
dl() { # iso label
  local t; t="$(date -u -d "$1" +%s 2>/dev/null)" || return 0
  local s=$((t-NOW)); local sign=""; [ "$s" -lt 0 ] && { sign="PASSED "; s=$((-s)); }
  printf '  %-34s %s  (%s%dh %02dm)\n' "$2" "$1" "$sign" $((s/3600)) $(((s%3600)/60))
}
dl 2026-10-18T12:00:00Z "Cut-line: BondPool (Sun 18:00 BD)"
dl 2026-10-19T06:00:00Z "Cut-line: reduced experiment (Mon 12:00 BD)"
dl 2026-10-20T06:00:00Z "Code freeze (Tue 12:00 BD)"
dl 2026-10-20T10:00:00Z "Demo video done (Tue 16:00 BD)"
dl 2026-10-20T12:00:00Z "Submit by (Tue 18:00 BD)"
dl 2026-10-20T15:59:00Z "HARD DEADLINE (Tue 23:59 Beijing)"
