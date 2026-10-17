# UNDERWRITE — UI/UX Redesign Plan (`ui-redesign.md`)

**Revision 2 (2026-10-17), landing page only:** the "Public Record" art direction in §5 to §8.1 is RETIRED for the landing page. Built and tested, it read like a scientific journal (1,708 words, paper colours, evidence tables) and the owner rejected it. The landing page was redesigned from scratch as an interactive desk ("Your AI clerk starts at $0", ink, white and highlighter-lime, about 240 words); see DEC-032. Everything else in this plan (the audit in §4, the integrity contract in §12, the feature matrix in §13, the accessibility criteria in §11) still stands, but the visual direction for the workspace pages is open again and needs the owner's approval before any work starts.

**Status:** Proposal only. Nothing in this document has been implemented. No source file was changed while preparing it.
**Prepared:** 17 Oct 2026 (Saturday), for the FinTechathon 2026 Topic F build.
**Scope:** The Next.js web app in `web/`: its public homepage, every route, and every component. Contracts, engine and CLI are out of scope, except where the UI must stop misrepresenting what they do.
**Readers:** The UNDERWRITE team, and any coding agent that later implements the plan. Agents should read §0, §5, §6 and the phase in §14 they are working on.

Legend used throughout:
- **[RESEARCH]** means the finding comes from an external source listed in §16.
- **[CODE]** means it was observed in this repository, with a `file:line` reference.
- **[MEASURED]** means it was computed or run during this analysis. The method is stated next to it.
- **[DECISION]** is a proposed binding choice. It becomes binding only after approval and a `DECISIONS.md` entry.
- **[HYPOTHESIS]** is a design bet to validate with users.

---

## Contents

0. [One-page summary](#0-one-page-summary)
1. [Project analysis](#1-project-analysis)
2. [Target users and use cases](#2-target-users-and-use-cases)
3. [Research findings](#3-research-findings)
4. [Current UI/UX audit](#4-current-uiux-audit)
5. [Design direction: "Public Record"](#5-design-direction-public-record)
6. [Visual system](#6-visual-system)
7. [Information architecture and navigation](#7-information-architecture-and-navigation)
8. [Page-by-page redesign](#8-page-by-page-redesign)
9. [Interaction and animation strategy](#9-interaction-and-animation-strategy)
10. [Light and dark theme specification](#10-light-and-dark-theme-specification)
11. [Accessibility and responsiveness acceptance criteria](#11-accessibility-and-responsiveness-acceptance-criteria)
12. [Content and data-integrity contract](#12-content-and-data-integrity-contract)
13. [Feature preservation matrix](#13-feature-preservation-matrix)
14. [Phased implementation plan](#14-phased-implementation-plan)
15. [Risks and decisions needed from you](#15-risks-and-decisions-needed-from-you)
16. [Sources](#16-sources)

---

## 0. One-page summary

**What UNDERWRITE is.** UNDERWRITE is an accounts-payable agent wallet for a small business that pays registered suppliers in USDC. The agent's autonomous spending limit is not typed in by a person. It is computed from an adversarial exam, enforced by a smart contract, and backed by a bond posted by the examiner. It is revoked in the same transaction that repays a proven loss. *Two keys to grant, any one to take away.* (`README.md` §1, `plan.md` §0)

**Why the current UI fails.** It has three root problems. Styling is the smallest of them.

1. **It claims more than the evidence supports.** The homepage says "The World's First Insured AI Payment Authority", "Zero Rogue Spending Risk" and "Theft Loss Default 0.00%" (`web/src/app/page.tsx:20,26,79`). The plan lists production insurance and claims that any agent is "safe" as non-goals (`plan.md` §0). Several pages show hardcoded or randomly generated numbers and hashes as if they were real. Section 4.3-A has the full list. In a product whose entire value is *verifiable evidence*, this is the most serious UX defect.
2. **It styles everything as urgent, so nothing is.** The UI uses glass panels, aurora glows, gradient text, 21 pulsing indicators, colored rim lighting on every card, and 61 emoji. With every surface fighting for attention, a judge cannot see where the money moved. These are also the patterns design commentators now associate with AI-generated sites [RESEARCH §3.6].
3. **It is organized around the builder's artifacts, not the users' jobs.** There are 17 routes and three overlapping invoice-submission screens. The Policy Card, Claims and Verify pages are not in any navigation. The sidebar only reveals its labels on mouse hover. On a phone the sidebar covers the content.

**Proposed direction: "Public Record."** The new identity borrows from financial documents (statements, policy schedules, specimen banknotes, notarial seals) and from measuring instruments. The tagline for the system is *Receipts, not claims.*
- **Every figure shows where it came from.** Shape-coded provenance stamps mark each value: Live chain, Recorded, Replay, Scripted, Controlled, Simulated.
- **Color is reserved for meaning.** Hue encodes outcomes: money moved, waiting, blocked, observe-only. The brand itself is ink on paper.
- **The type is chosen for this job.** An editorial serif with optical sizes (Newsreader) carries the voice. Hashes, addresses and amounts use a typeface designed to tell look-alike characters apart (Atkinson Hyperlegible Next and Mono). All fonts are self-hosted, so the site works from mainland China.
- **Motion is used only where it explains cause and effect.** Examples are authority collapsing on revocation, a payment moving through four layers, and a challenge window counting down.

**Key decisions at a glance**

| # | Decision | Main reason |
|---|---|---|
| D1 | Bind every displayed number to its real source, stamp its provenance, and show "Not recorded" or "Not run" instead of invented fallbacks | `AGENTS.md` rules 6, 7 and 12; the judging rubric weights security and audit trail at 30% |
| D2 | Replace glass and neon with a paper-and-ink system in light and dark themes | Removes the AI-generated tells; restores visual hierarchy; Linear's 2026 refresh principle that orientation should recede |
| D3 | Newsreader (display), Atkinson Hyperlegible Next (UI) and Atkinson Hyperlegible Mono (data), self-hosted via `next/font/local` | Glyph disambiguation for hashes and addresses; open licenses; no Google CDN dependency |
| D4 | Restructure navigation by job (Operate · Qualify · Prove · Lab) with a click-toggled rail, keeping every existing URL working | Findability; WCAG 2.2; links in README and DEMO_SCRIPT stay valid |
| D5 | Motion via CSS plus Motion (`motion/react`, LazyMotion) in the app; GSAP ScrollTrigger only on the homepage story, lazy-loaded | Smallest runtime cost that still covers each need; GSAP plugins are now free; View Transitions are still experimental in Next.js |
| D6 | Accessible primitives from Radix, vendored through the shadcn/ui CLI and fully restyled; no default shadcn look | Fixes focus traps, Escape handling and keyboard menus without inheriting a recognizable template |

**Timing recommendation [DECISION needed, see §15].** The submission deadline is 20 Oct 2026, 21:59 Bangladesh time, and the plan's code-freeze checkpoint is after 06:00Z that day. Do only Phase 0, the honesty and data-binding pass (about one working day), before the freeze and before recording the demo video. Run the full visual redesign (Phases 1–4) between submission and the Grand Final (20–23 Nov, Shenzhen). Section 14 explains why.

---

## 1. Project analysis

### 1.1 Purpose and mechanism

UNDERWRITE answers one question for a business owner: *how much money may this AI agent move on its own, and what happens when it is wrong?* It does so with four independent layers (`README.md` §3):

| Layer | What it does | What the user must be able to see |
|---|---|---|
| 1. Agent (α, β, γ configurations) | Reads invoices and proposes payments using a vendor ID, never an address | What it proposed and why |
| 2. Deterministic policy firewall | Checks the registry, cooldowns, duplicates and PO match; assigns tier T0–T3 | The tier and the reason codes |
| 3. `UnderwriteVault.sol` | Enforces caps, the allowlist, invoice uniqueness and the two-key activation on-chain | The contract result: an executed event, or a typed revert |
| 4. `BondPool.sol` | Backs unreviewed autonomous exposure. Approving a claim pays out and revokes in one transaction | Exposure against free bond; the claim consequence |

**Tiers** (`plan.md` §5.3):

| Tier | Meaning |
|---|---|
| T0 | Observe only |
| T1 | Pays automatically within the bonded envelope |
| T2 | Delayed; waits through a challenge window that the owner can veto |
| T3 | Owner only |

**Errors:**
- **Class I:** out-of-bounds attempts that contracts must stop.
- **Class II:** wrong-but-permitted payments that only the exam can measure and only the bond can repay.

### 1.2 Architecture as the UI sees it

Next.js 15 App Router, React 19, Tailwind 3.4, viem. No component library. The only icon dependency, `lucide-react`, is installed but unused; the UI uses inline SVG and emoji instead.

| Data source | Where | Reality today [CODE] |
|---|---|---|
| Chain reads (viem) | `lib/chain.ts` → `/api/state`, `/api/verify` | Real reads with a fallback. `/api/state` then **overwrites** balances, exposure and bond with in-memory simulator values (`api/state/route.ts:19-28`), stored as floats |
| Evidence files | `lib/evidence.ts` → `/api/exams`, `/api/traces`, `/api/verify`, `/api/runs` | Real committed artifacts. `/api/exams` also returns a hardcoded `defaultReports` block (`api/exams/route.ts:18`) |
| Demo runtime | `lib/runtimeState.ts` → `/api/invoices/*`, `/api/vendors`, `/api/claims` | An in-memory simulator. It sends **no** transactions: there are no `writeContract` or `sendTransaction` calls anywhere in `web/src` [MEASURED by grep]. Transaction hashes come from `Math.random()` (`runtimeState.ts:851,935,1027`) |
| Hardcoded constants in pages | `/experiment`, `/verify`, `/evidence`, `/exam`, `/portals/examiner`, `/dashboard` | See §4.3-A |

### 1.3 Feature inventory (what must survive)

There are 17 page routes, 10 API routes, 5 shared components and 1 auth context. Section 13 maps every feature to its new home. Summary:
- **Public:** homepage, login, register.
- **Role portals:** Owner, Vendor, Examiner, Underwriter, Adjudicator.
- **Operational:** `/dashboard` (meter), `/submit` (invoice studio), `/claims`.
- **Proof:** `/exam` (Policy Card), `/traces`, `/evidence`, `/verify`, `/experiment`.
- **Red team:** `/attack-lab`.
- **Global:** role switching with password, EIP-1193 wallet connect, sandbox reset, chain indicator, 2.5–3 s live polling.

### 1.4 Hard constraints the redesign must respect

| Constraint | Source |
|---|---|
| No external CDNs; self-host fonts. Judges may be in mainland China | `plan.md` §1.3 #9, §9.1 (UI row), P8 requirements |
| Label anything simulated, scripted, replayed or controlled, in the UI | `AGENTS.md` rule 12 |
| Never show a payment as executed without a success receipt and a matching decoded `PaymentExecuted` event | `AGENTS.md` rule 6; `plan.md` §5.4 |
| Never fabricate results or hashes; write "not run" | `AGENTS.md` rule 7 |
| Money is bigint base units, never floats | `AGENTS.md` rule 4 |
| Three Policy Card notes must appear **verbatim** | `plan.md` §7 |
| Show counts and rates together | `plan.md` §8.4 |
| Keep README and DEMO_SCRIPT URLs working (`/exam`, `/traces`, `/attack-lab`, `/claims`, `/evidence`, `/experiment`) | `README.md` §2, `docs/DEMO_SCRIPT.md` |
| Must work with `CHAIN=anvil`, offline, with no API keys | `README.md` §2, `plan.md` P8 |
| Timeline: submission 20 Oct, 21:59 BD; finalists 31 Oct; Grand Final 20–23 Nov | `docs/competition/OFFICIAL_RULES.md` §1 |

---

## 2. Target users and use cases

### 2.1 Who reads this UI, in priority order

The UI has two audiences with different time horizons. The redesign serves both without confusing them.

**A. Competition judges (now to 23 Nov): the deciding audience.** The rubric (`docs/competition/OFFICIAL_RULES.md` §3):
- Task completion: 40%
- Security and compliance: 30%
- Innovation and interaction: 30%, which explicitly includes "responsive Web UI, transparent Authority Meter, and accessible local demonstration"

The plan lists what judges will look for: missing permission tiers, prompt injection, hallucinated recipients, frontend-only checks, no audit trail, and **overclaiming ("safe", "insured")** (`plan.md` §1.3 #5). Judges are time-poor experts. They need the mechanism in about 60 seconds and proof within 5 minutes. They will notice an inconsistent number.

**B. Product personas (the real-world use the demo stands for).** These come from `plan.md` §2.3 and §5.1 and the existing demo accounts in `AuthContext.tsx`.

| Persona | Job to be done | Their questions | How often | What scares them |
|---|---|---|---|---|
| **Owner / finance lead** (Sarah Chen, Acme Corp; an SME with 5–30 recurring suppliers) | "Process the AP inbox: pay what is due, flag what is not." | What needs my decision today? How much can the agent spend without me, and is that backed? What did it pay since my last review? | Daily | A wrong payment they never saw; a supplier bank-detail change (BEC); being slower than the manual process |
| **Supplier / vendor** (CloudCorp) | Get paid on time | Did my invoice arrive? Will it pay automatically or wait? Am I registered and past the cooldown? When will I be paid? | Per invoice | Silent rejection; not knowing why |
| **Examiner / underwriter** (the plan merges them; the UI splits them into two desks) | Qualify an agent configuration and stand behind it with capital | What did the exam measure? What envelope does the compiler give? How much of my bond is locked? | Per qualification | Signing an envelope the evidence does not support; exam-shopping accusations |
| **Adjudicator** (designated key, labeled CONTROLLED) | Decide loss claims | Is the claimed payment a covered T1 payment? Is the evidence consistent? What exactly happens if I approve? | Per claim | An irreversible payout and revocation made on thin evidence |
| **Independent verifier** (judge, auditor, skeptic) | Check that what is on-chain matches the published evidence | Does `uw verify` pass? Where is each hash from? Can I re-derive the experiment? | Once, deeply | Being shown a convincing screen that is not backed by data |

### 2.2 The core workflows the UI must make obvious

These come from the six demo scenes (`plan.md` §10; `docs/DEMO_SCRIPT.md`):

| Scene | What happens |
|---|---|
| 1. Earn | An examiner signs the attestation and the owner activates it. The meter appears, sized by evidence |
| 2. Work | An invoice is proposed, the policy decides, the contract executes, money moves. A T2 payment waits through its challenge window |
| 3. Attack | An injected invoice, a bank-detail change, and a compromised key all fail, each at the layer that stops it |
| 4. Residual | A wrong-but-permitted overbilling payment goes through. This is the honest limit of contracts |
| 5. Consequence | A claim is filed and approved. The bond repays and the qualification is revoked in one transaction. The meter drops to zero and the next payment reverts |
| 6. Learn | The incident becomes a scenario, the agent is re-examined, and new authority is granted |

### 2.3 Domain-specific usability challenges

1. **Trust calibration, not trust maximization.** Users should trust the agent exactly as far as the evidence goes. This is the product's thesis and the main finding of current AI-UX writing [RESEARCH §3.3]. The UI must show limits and evidence, not confidence theater.
2. **Time-based states.** Supplier cooldown (300 s), the T2 challenge window, the window reset and qualification expiry are all deadlines. Today they appear as static text ("300s Challenge Window").
3. **Byte-level verification.** Users compare hashes and addresses character by character. Truncation, glyph confusion (0/O, 1/l/I) and copy errors are real risks.
4. **Irreversible actions.** Approving a claim pays out and revokes authority. Deactivating a vendor blocks payments. These need consequence-explicit confirmation.
5. **Statistics for non-statisticians.** Clopper–Pearson bounds, Bonferroni correction and the owner's assumption *a* must be readable by a CFO. That calls for layered explanation: plain sentence first, formula on demand.
6. **Mixed provenance on one screen.** A single dashboard shows chain reads, simulator output and recorded evidence. Without stamps the user cannot tell them apart.

---

## 3. Research findings

Every recommendation in §5–§10 traces back to a finding here or to a project constraint in §1.4. Source quality varies: vendor blogs and secondary write-ups are marked as such, and nothing below is presented as stronger than its source.

### 3.1 Accounts-payable teams

- **Full automation is rare.** In a February 2026 vendor-sponsored survey, only 4% of organizations had fully automated AP from invoice to payment. Half processed 5,000 or more invoices a month, and 38% needed five or more days per invoice [RESEARCH: Ottimate]. *Implication:* the realistic product is partial automation with exceptions routed to people. The inbox ("what needs me") must be the owner's home screen, not a dashboard of totals.
- **Business payment fraud is concentrated in redirected supplier payments.** The plan's own evidence (`plan.md` §2.1 E5, FBI IC3 business email compromise figures) says so, and the plan itself flags that figure for verification before use. *Implication:* the vendor registry, cooldowns and "bank-detail change" states deserve first-class visual treatment.

### 3.2 Agentic payments: controls and trust

- **Ramp (April 2026)** distinguishes *human in the loop* (approve each step) from *human on the loop* (set policy, intervene on exceptions). It lists:
  - transaction caps, frequency limits and cumulative thresholds;
  - escalation when a payment exceeds an amount or involves an unverified vendor;
  - reviewers who "see what the agent detected, which policies it applied, and why it flagged the transaction";
  - audit logs with the policy version in force, ideally hashed or append-only;
  - "shadow mode" before granting autonomy.

  [RESEARCH: Ramp, agentic payments] *Implication:* the T2 review card must show detected facts, the applied rule and the reason. The audit trail is a product surface, not a debug page. UNDERWRITE's T0 tier is essentially shadow mode and should be presented that way.
- **Ramp Bill Pay** approvals enforce separation of duties (a bill's creator cannot approve it) and expose the full approval history [RESEARCH: Ramp help center]. *Implication:* show who held which key for every grant, veto and claim.
- **Coinbase Agentic Wallets** (launched February 2026, per secondary coverage) enforce session caps and per-transaction limits in the signing layer [RESEARCH: PaymentsJournal]. **Google's AP2** uses signed "intent" and "cart" mandates for human-present and human-not-present flows [RESEARCH: ap2-protocol.org]. *Implication:* "limits enforced outside the model" is now an industry expectation. UNDERWRITE's difference is *how the limit is sized and backed*, and the UI must make that difference visible.
- A Cloud Security Alliance 2026 survey, cited second-hand by Payabli, reports that nearly two in three organizations had an AI-agent incident in the past year, 35% with financial loss [RESEARCH: Payabli, secondary]. Treat this as directional only.

### 3.3 Trust calibration in AI interfaces

- The design goal is **calibrated** trust: trust the system when it is right, doubt it when it might be wrong. Sources and plain-language uncertainty beat fake precision such as "92% confident" [RESEARCH: p0stman, secondary; UXmatters 2025].
- **Graduated autonomy:** users promote a system to more autonomy after watching it perform; autonomy cannot be forced [RESEARCH: ParallelHQ, 2026]. This is UNDERWRITE's T0 → T1 progression, made literal.
- **Fluent explanations can increase over-reliance** (2026 ACM work cited second-hand by p0stman). *Implication:* do not dress the agent's rationale in authoritative prose. Present it as *the agent's claim*, visually subordinate to what the policy and contract did.

### 3.4 Reference products (validated for relevance, not copied)

| Product | What is worth learning | How it applies here |
|---|---|---|
| **Linear**, design refresh (12 Mar 2026) | "Don't compete for attention you haven't earned"; "Structure should be felt, not seen"; navigation dimmed; fewer, smaller icons; softer, fewer separators; warmer, less saturated grays [RESEARCH: Linear]. An earlier 2024 redesign reduced 98 theme variables to three inputs: base, accent and contrast | Navigation recedes; the inbox and meter lead. Warm neutrals. A small token set |
| **Ramp** Bill Pay | Approval chains, separation of duties, full history per approval | T2 review card and the claim case file |
| **Mercury** | A restrained dark canvas, proprietary type and an unusual weight scale give an identity competitors cannot copy (third-party write-ups; details conflict between sources) [RESEARCH: Mercury guides, secondary] | Typography should carry the identity, not effects |
| **Awwwards** typography honors (2025–26) | Type-led art direction is consistently what gets recognized [RESEARCH: Awwwards typography listing]. Counter-example: *Messenger* by abeto (Site of the Day, Nov 2025) scored 9.00 on animation but 7.46 on usability, its lowest category [RESEARCH: Awwwards] | Borrow the craft (type-led layouts, choreographed transitions). Avoid the spectacle (WebGL worlds); finance tools are judged on usability. The official 2025 Site of the Year list could not be retrieved, so no claims are made about it |

### 3.5 Recognized "AI-generated" design patterns

Several 2026 commentaries [RESEARCH: 925studios; noqta; superdesign; secondary, opinion-based] converge on the same tells:
- default Inter typography;
- purple-to-blue gradients with no meaning;
- every section in a rounded card;
- a thick colored border on one side of a card ("the single most recognizable signature");
- pulsing "live" or "new" badges on things that are neither;
- centered hero plus one CTA plus three icon cards;
- glassmorphism;
- emoji used as icons;
- generic copy ("Empower your business…").

Section 4.3-C maps each tell to where it occurs in this codebase.

### 3.6 Animation tooling

- **GSAP:** Since Webflow's acquisition, the full toolkit, including the formerly paid plugins (SplitText, MorphSVG) and ScrollTrigger, is free for commercial use and installs from public npm [RESEARCH: GSAP npm listing; Webflow's announcement itself was not retrieved]. Best for timeline choreography and scroll-scrubbed storytelling.
- **Motion (formerly Framer Motion):** The full `motion` component cannot tree-shake below about 34 KB. `m` with `LazyMotion` starts at about 4.6 KB, plus about 15 KB for `domAnimation` (presence, variants, gestures) or about 25 KB for `domMax` (adds layout and drag) [RESEARCH: motion.dev]. Best for React state-driven UI transitions such as queue items leaving and results revealing.
- **View Transitions:** Next.js 16.2 docs still mark `experimental.viewTransition` as "not recommended for production" [RESEARCH: nextjs.org]. Not used in this plan.

### 3.7 Components and the shadcn/ui MCP server

- **shadcn/ui** copies component source into the repository, built on Radix primitives. Nothing is fetched at runtime, which suits the China-reachability constraint. New projects default to Tailwind v4 and React 19; existing Tailwind v3 apps keep working and have v3 docs [RESEARCH: ui.shadcn.com; v3.shadcn.com].
- The **shadcn MCP server** lets an AI assistant browse, search and install registry items (`pnpm dlx shadcn@latest mcp init --client claude`) [RESEARCH: ui.shadcn.com/docs/mcp]. *Validation:* it is useful **at implementation time** for an agent to pull primitives. It adds nothing at runtime and does not replace design decisions.
- *Caution:* the unmodified "shadcn look" (neutral cards, Geist or Inter, default radii) is itself becoming a template signature. Use the **behavior** (focus management, keyboard support, ARIA), not the **appearance**.

### 3.8 Accessibility standards

- **WCAG 2.2 AA** adds Target Size (Minimum) 2.5.8 (24×24 CSS px), Focus Not Obscured (Minimum) 2.4.11, Dragging Movements 2.5.7 (single-pointer alternative) and Accessible Authentication (Minimum) 3.3.8 [RESEARCH: TetraLogical; Deque; check the W3C text for exact wording]. Each is relevant here:
  - 2.4.11: sticky headers can hide focused items.
  - 2.5.7: the compiler sliders need a non-drag alternative.
  - 3.3.8: the password gates must allow paste and autofill.
- **Motion sensitivity:** a US national survey found vestibular dysfunction in 35.4% of adults aged 40 and over. That measures balance dysfunction, not diagnosed disorders, and should not be generalized [RESEARCH: PubMed 19468085; web.dev]. web.dev advises honoring `prefers-reduced-motion`. A11y Project suggests shortening durations instead of deleting all feedback.

### 3.9 Dark theme practice

- Material Design recommends dark grey surfaces (#121212) over pure black, so shadows and depth stay visible, and lighter surfaces to show elevation [RESEARCH: Material Design 2]. Desaturating accents to avoid halation is community advice, not Material policy; we adopt it as a judgment call.

### 3.10 Fonts and China reachability

- `fonts.googleapis.com` and `fonts.gstatic.com` are widely reported as unreliable in mainland China. Self-hosting subset `.woff2` files is the standard fix [RESEARCH: Chinafy; AppInChina; community sources].
- **Build-time note:** `next/font/google` downloads font files when the app is built, so the build machine needs to reach Google. `next/font/local` with committed `.woff2` files removes that dependency entirely. This matters if the demo is rebuilt on-site in Shenzhen.
- **Licenses verified:**
  - **Newsreader:** OFL-1.1; variable `wght` 200–800 and `opsz` 6–72; designed by Production Type for on-screen reading [RESEARCH: Fontsource; Production Type].
  - **Atkinson Hyperlegible Next:** OFL-1.1; released 10 Feb 2025 by the Braille Institute; variable `wght` 200–800; supports `tnum` tabular figures [RESEARCH: Fontsource].
  - **Atkinson Hyperlegible Mono:** OFL-1.1 [RESEARCH: Fontsource].

---

## 4. Current UI/UX audit

### 4.1 Method

- Read every page (17), every component (5), the auth context and the API routes in `web/src`.
- Captured headless Chrome screenshots of `/`, `/dashboard`, `/portals/owner`, `/portals/vendor`, `/exam`, `/traces` and `/experiment` at 1440 px, and `/` at 390 px, against the running app on `localhost:3000`.
- Computed WCAG contrast ratios with the relative-luminance formula for representative color pairs [MEASURED].
- Grepped for accessibility attributes, focus styles, motion, emoji and text sizes [MEASURED].
- Compared every displayed number with the committed evidence in `evidence/`.
- Queried the public Base Sepolia RPC for two transaction hashes listed in the evidence folder [MEASURED, §4.3-A9].

**Severity scale:**

| Level | Meaning |
|---|---|
| S0 | Misrepresents facts, or violates `AGENTS.md`. Fix before any visual work |
| S1 | Blocks a task or excludes users |
| S2 | Degrades comprehension or trust |
| S3 | Polish |

### 4.2 What works and must be kept

- **The Four Facts model** (Proposed → Decided → Contract result → Funds moved) on `/traces`, `/attack-lab` and `/submit`. It is the clearest idea in the product and maps exactly to `plan.md` §5.2 US-6.
- **Provenance badges** as a concept (`components/Badges.tsx`). They are the seed of the new stamp system.
- **The Authority Meter** concept, the centerpiece of `plan.md` §10.
- **The T2 review queue** with trigger reasons, and the owner's per-invoice audit checklist.
- **Cross-desk synchronization:** a vendor submission appears in the owner's inbox within seconds.
- **`formatUSDC`** uses bigint math (`lib/format.ts`); `num-tabular` is used for figures.
- **The verbatim disclosures** are present on `/exam`, though rendered incorrectly (see A6).
- **`/api/verify`** performs a real recomputation against evidence and chain. `/evidence` uses it; `/verify` does not.

### 4.3 Findings

#### A. Integrity: what the screen says versus what is true (all S0)

| # | Finding | Evidence |
|---|---|---|
| A1 | **Overclaims that contradict the plan's non-goals:** "The World's First Insured AI Payment Authority"; "Zero Rogue Spending Risk"; "backed 100%"; "Theft Loss Default 0.00% / 100% atomic recovery"; "The agent literally cannot exceed…"; pricing tiers ("$4,990/mo + 0.15%", "Popular", "$50,000 Underwriting Bond Pool allocation", "24/7 designated legal adjudicator SLA") | `app/page.tsx:20,26,31,79-81,323`. Contradicts `plan.md` §0 non-goals ("production insurance… claims that any agent is 'safe'") and §4.F ("do not imply we sell insurance"; "who pays: future, not claimed as validated"). The experiment itself records a **$170** leak and a **$5** net loss for γ under R2 (`evidence/experiments/main-run/protocol-summary.json`), so "0.00%" is false |
| A2 | **Experiment page numbers do not match the committed evidence** | Page: N=300; α R1 loss $14,200; γ R2 automation 97.5% (`app/experiment/page.tsx:35,119` and the constant block). Evidence: N=330; α R0 net loss $38,700; α R1 $170; γ R2 automation 15.83% (38/240), bond payout $165, net $5 [MEASURED from `protocol-summary.json`] |
| A3 | **Policy Card shows agent envelopes the evidence does not contain** | Page: γ "T1 ($180.00 USDC)", β "T1 ($40.00 USDC)" (`app/exam/page.tsx:199`). Evidence: every committed report compiles to **T0, `UTILITY_GATE`** (40 benign scenarios; gate G2 needs 100) [MEASURED from all six `evidence/exams/*/report.json`]. `docs/DEMO_SCRIPT.md` gives a third set (β $143.60, γ $500). Three sources, three answers |
| A4 | **Compiler simulator uses a different formula from the spec** | Page: `R / (a · p_gamma)` with a fixed p = 0.053116 (`app/exam/page.tsx:27-28,274`). Spec: `p = p_b + a · Σ w_f · p_f`, with one-sided 95% joint bounds (`plan.md` §7). The page also labels the bound "Clopper-Pearson 99% Exact" (`app/exam/page.tsx:42`) |
| A5 | **Hardcoded or invented values shown as live** | Dashboard: bond "$2,000.00" and reserve "$500.00" are literals (`app/dashboard/page.tsx:151,165`); exposure falls back to 42.50 (`:36`). Owner vault falls back to "5,000.00" (`portals/owner/page.tsx:219`). Traces: missing vendor becomes "Acme Logistics Corp", missing amount becomes 480 USDC, missing tier becomes "T1", missing status becomes "EXECUTED", and every step shows receipt `0x3d41f5a9e2bc8401…` (`app/traces/page.tsx:235-250,384`). `/verify` shows hashes such as `0x140a7b8e9f0123456789abcdef…` (`app/verify/page.tsx:44`). `/evidence` lists five artifacts with patterned hashes, all marked "VERIFIED" (`app/evidence/page.tsx:41`) |
| A6 | **Verbatim disclosures render with literal markdown** | `*a*` and `` `t1MaxPerWindow` `` appear with asterisks and backticks on screen (`app/exam/page.tsx:83`; screenshot) |
| A7 | **Actions report success without doing anything** | Underwriter deposit and withdraw only set a message (`portals/underwriter/page.tsx:47,58`). The owner deposit handler does the same (`portals/owner/page.tsx:135`; not rendered). Examiner "Run exam" waits 1.2 s and returns constants (`portals/examiner/page.tsx:30`). "Sign attestation" returns a random 130-hex-character string as an EIP-712 signature (`:78`) |
| A8 | **Simulator output presented as on-chain** | Random hashes from `runtimeState.ts:851` appear under "Paid On-Chain" (`portals/owner/page.tsx:556`) and "Settlement TxHash" in the vendor ledger. `/api/state` replaces chain reads with simulator floats (`api/state/route.ts:19`). None of it carries a SIMULATED label, contrary to `AGENTS.md` rule 12 |
| A9 | **On-chain evidence links point to transactions that do not exist** (outside UI scope, but the UI surfaces it) | `evidence/onchain/receipts/*.json` and `EXECUTION_EVIDENCE.md` list Base Sepolia (chain 84532) hashes with `status: SUCCESS`. A direct `eth_getTransactionReceipt` against `https://sepolia.base.org` returned `null` for `0x12a9c402…3b91` (Scene 2 pay) and `0x938472a1…04b2` (Scene 5 approveClaim) [MEASURED]. `PHASES.md` lists P6-T02 (testnet deploy) as not done, with the deployer at 0 wei. The plan's pre-submission checklist requires "every hash resolves" (`plan.md` §14). **Needs a human decision before submission; see §15** |
| A10 | **Security theater in authentication** | Every portal gate shows the password in plain text next to the field ("⚡ Quick Fill: VendorPassword2026!", `components/PortalGuard.tsx:106`). The header shows "Sarah · OWNER" and a "Sign In →" button at the same time (`components/Header.tsx:224`; screenshot). DEC-028 calls this "startup-grade production security", but it is client-side `localStorage`. Overclaiming security is exactly what the plan says judges look for |
| A11 | **Fake progress** | The vendor "5-stage pipeline" advances on `setTimeout` (450/550/450/400 ms) before and after a single API call (`portals/vendor/page.tsx:200` and following). The stages imply measured steps that are not measured |

#### B. Information architecture and navigation

| # | Sev. | Finding |
|---|---|---|
| B1 | S1 | **Key pages are unreachable from navigation:** `/exam` (the Policy Card, demo Scene 1), `/claims` (Scene 5) and `/verify` appear in neither the sidebar nor the header [MEASURED: nav hrefs]. |
| B2 | S2 | **Overlapping surfaces:** three invoice-submission screens (`/submit`, `/portals/vendor`, `/attack-lab`), three claim surfaces (`/claims`, `/portals/adjudicator`, the owner's claim form), two verify screens (`/evidence`, `/verify`), two "home" dashboards (`/`, `/dashboard`). Each implements the Four Facts slightly differently. |
| B3 | S2 | **Two navigations with different names for the same place:** header "Inbound AP" versus sidebar "Submit Invoice"; "Audit Trail" versus "Evidence"; "Protocol HUD". The sidebar adds a third vocabulary (badges "S6", "LP", "SLASH", "ORACLE", "9-CELL", "STARTUP"). |
| B4 | S1 | **Hover-only navigation:** labels appear only on `onMouseEnter` (`components/Sidebar.tsx:172`), so keyboard and touch users see an unlabeled icon column. The pin control uses 📌/📍 emoji. |
| B5 | S2 | **The vendor portal mixes the supplier's real job with red-team tooling:** "Prompt Attack", "Custom / Unregistered Supplier (Test INV-1 Rejection)" and "Duplicate Replay" presets sit inside the supplier's workspace. A real supplier never does this. It blurs who the screen is for. |
| B6 | S2 | **Role switching is scattered** across the header dropdown, sidebar dock, portal guards and per-portal "Switch to … Key ⚡" buttons. |

#### C. Visual design and AI-generated tells

| Tell [RESEARCH §3.5] | Where it occurs [CODE / MEASURED] |
|---|---|
| Glassmorphism everywhere | 124 `glass-*` or `backdrop-blur` usages; `.glass-panel` uses `blur(32px) saturate(200%)` (`globals.css`) |
| Ambient gradient blobs | Four fixed 600–800 px blurred "aurora" layers, two animated indefinitely (`layout.tsx`) |
| Gradient text on headlines | `text-gradient-cyan/emerald/amber/rose` on almost every H1 |
| Pulsing "live" indicators on non-live things | 18 `animate-pulse`, 1 `animate-ping`, 2 `radar-ring` usages, including static labels such as "Evaluated Scenarios: 390" |
| Colored border on one side of a card | `.specular-*` classes color each card's top rim (emerald, cyan, amber, rose, indigo) on nearly every panel |
| Everything in a rounded card | Nested 24–32 px radius cards inside cards; the page has no flat structure |
| Emoji as icons | 61 emoji across 17 files (⚡🚀🔒📌🟢🔴🛡️💰🏢…) [MEASURED] |
| Centered hero, 3 CTAs, 4 stat cards, 3-column features, 3 pricing cards | `app/page.tsx` |
| Generic copy | "Empower AI agents to inspect, verify, and settle…", "Launch Enterprise Workspace", "Institutional Role Desks" |
| Five accent hues with no consistent meaning | Cyan is the brand, "proofs", the underwriter, links and the "running" state; emerald is success, the owner and "solvency" |

Other visual problems:
- **No typographic identity (S2).** The system font stack renders as SF on macOS and Segoe UI on Windows, so the brand looks different on every judge's laptop. Headlines are weight 900; prose is set in monospace.
- **Micro-type (S1).** 173 instances of 8–10 px text: 150 at 10 px, 17 at 9 px, 6 at 8 px [MEASURED].
- **No hierarchy (S2).** Glows, rims and pulses are applied uniformly, so the T2 item that needs a decision looks no more important than a static footnote.

#### D. Interaction and feedback

| # | Sev. | Finding |
|---|---|---|
| D1 | S1 | **No confirmation on irreversible actions:** "✓ Approve & Atomic Revoke" (payout plus revocation) and vendor "Revoke ✕" fire on a single click. |
| D2 | S2 | **Errors via `alert()`** (`app/claims/page.tsx:111,134`); success messages auto-dismiss after 4–6 s (`portals/owner/page.tsx:79`), too quickly to read a transaction result. |
| D3 | S2 | **Deadlines without clocks:** T2 cards say "300s Challenge Window" with no countdown; vendor cooldown counts down only in the registry list. |
| D4 | S2 | **Silent polling:** pages re-fetch every 2.5–3 s with no "updated n s ago" and no stale state. When the RPC is down, fallback numbers appear (A5). |
| D5 | S3 | **Broken filter:** the claims "ACTIVE" filter (`app/claims/page.tsx:63`) never matches, because statuses are `PENDING`, `APPROVED` and `REJECTED`. |
| D6 | S3 | **Inconsistent money formatting:** "$4870.00" (no grouping, from `toFixed`) next to "$2,000.00". |
| D7 | S2 | **Loading states declared but unused** in several pages, so empty tables flash before data arrives. |

#### E. Accessibility (WCAG 2.2 AA)

| # | Sev. | Finding [MEASURED] |
|---|---|---|
| E1 | S1 | **Zero** `aria-*` or `role` attributes in `web/src`. |
| E2 | S1 | 25 `outline-none` and **zero** `focus-visible` styles: keyboard focus is invisible (fails 2.4.7). |
| E3 | S1 | Meta text `slate-500` on the page background measures **4.25:1** and is used at 10 px (fails 1.4.3). `slate-600` separators measure 2.67:1. |
| E4 | S1 | Input borders (`white/8%` on near-black) measure about **1.14:1** (fails 1.4.11, needs 3:1). |
| E5 | S1 | **Color-only status:** 🟢🔴🟡 emoji as pass/fail in the audit checklist. |
| E6 | S1 | **Custom modals** (`AuthModal`, the claims file modal) have no focus trap, no Escape handling and no labelled dialog role. |
| E7 | S2 | **No `prefers-reduced-motion` handling;** infinite ambient animations. |
| E8 | S2 | **Small targets:** 10 px buttons with `px-2 py-1` ("Revoke ✕", "Approve", "Reject") are likely below 24×24 px (2.5.8). Verify during implementation. |
| E9 | S2 | **Compiler sliders are drag-only** (2.5.7 needs an alternative). |

#### F. Responsive behavior

| # | Sev. | Finding |
|---|---|---|
| F1 | S1 | **At 390 px the fixed sidebar rail overlaps the content and the page scrolls horizontally.** The hero headline is cut off ("utonomous Enterp…") [MEASURED: screenshot]. Cause: the spacer is `hidden md:block` (`components/Sidebar.tsx:168`) but the fixed `aside` is always rendered. |
| F2 | S2 | Seven- and eight-column tables (owner ledger, vendor ledger, claims) have no small-screen pattern. |
| F3 | S2 | **Projector and laptop scaling are untested.** Windows at 125–150% scaling gives an effective viewport of about 1024–1280 px, the likely setup for the on-site defense. |

#### G. Theming and code structure

- **Dark only.** `<html className="dark">` is hardcoded (`app/layout.tsx:19`); there are no `dark:` variants and no light theme.
- **Colors are scattered hex literals** (`bg-[#030610]`, `bg-[#060b1c]/80`, `bg-[#070d1e]`…) rather than semantic tokens, so theming would currently mean editing every file.

#### H. Performance risk (not measured)

- **Stacked blur effects.** `backdrop-filter` blur of 28–40 px with saturation sits on many overlapping layers, over four large animated blurred backgrounds. This is a known GPU cost on integrated graphics. It was not profiled here; mark it as a risk for judges' laptops and the on-site projector machine.

---

## 5. Design direction: "Public Record"

### 5.1 The idea in one line

> **Receipts, not claims.** UNDERWRITE is a system that refuses to be trusted on its word. Its interface should look like a well-kept public record: precise, sourced, calm, and impossible to fake by styling.

### 5.2 Design principles

Every component in §6 and every page in §8 is checked against these principles.

1. **Every figure has a source.** A number without a provenance stamp is a defect. Hovering or focusing a stamp reveals the file path, contract read or simulator origin. (`AGENTS.md` rules 6, 7, 12)
2. **Color means outcome; nothing else is colored.**
   - Hue encodes the four outcome states: *moved*, *waiting*, *blocked*, *observe-only*. It is never decoration.
   - Provenance is encoded by **shape and pattern**, so the two channels never compete. This follows Bertin's principle that each visual variable carries one meaning.
   - The brand is ink and paper.
3. **Attention is earned.** Only items needing a decision are prominent. Navigation, metadata and chrome recede [RESEARCH: Linear].
4. **Honest states are designed states.** T0 (observe only), *Revoked*, *Simulated*, *Not run*, *Not recorded*, *Offline* and *Stale* each get a deliberate visual, not an error banner. The T0 state is today's real state (§4.3-A3), so it must look intentional and explain itself.
5. **Legible to the byte.** Hashes, addresses, invoice keys and amounts are typeset for verification:
   - glyph-disambiguating type;
   - tabular figures;
   - copy buttons that copy the exact value;
   - middle-truncation that keeps both ends.
6. **Motion explains causality.** Animate only when something meaningful changed: authority, money, status or time. No decorative loops, no count-ups, no hover-lift on every card.

### 5.3 Art direction

**References, and why each fits this product:**

| Reference | Why it fits |
|---|---|
| Financial statements and policy schedules | Ruled columns, right-aligned figures, footnotes. UNDERWRITE produces exactly such documents: the Policy Card, the qualification report, the claim |
| Specimen banknotes and notarial seals | Banks stamp unissued notes "SPECIMEN". This is the domain-native way to mark something that looks real but is not: the **Simulated** stamp |
| Engineering instruments | The Authority Meter as a precise gauge with ticks, a needle-thin current value and a hard stop at the cap |
| Edward Tufte's sidenotes and small multiples | Provenance and caveats live in the margin next to the claim they qualify. The 3×3 experiment matrix is a natural small-multiple |

**What we deliberately avoid:** glass, glows and aurora backgrounds; gradient text; neon on navy; pulsing dots; hover-lift cards; emoji; centered-everything; 32 px radii; three-of-everything grids; superlatives.

**Mood, in words:**
- Warm paper, near-black ink, and one cobalt "signature ink" for actions. Blue is the color of signed documents; granting authority here literally requires signatures.
- Hairline rules instead of boxes.
- Generous margins with dense, precise tables.
- Serif headlines with the voice of a good financial newspaper; a hyper-legible sans for everything you operate.

### 5.4 Signature elements (the identity, beyond color and type)

1. **The Authority Meter instrument** (§6.7.1). One horizontal scale shows cap, spend, exposure and free bond, with the INV-10 inequality *exposure ≤ free bond* drawn as two bars on one shared scale, so you can check it with your eyes.
2. **Provenance stamps** (§6.7.2). Small, crisp, rubber-stamp-like marks; shape-coded; always in ink color.
3. **The Four Facts receipt strip** (§6.7.3). A tear-off-receipt layout reused on every surface that shows a payment attempt.
4. **The two-key seal.** A small mark showing which keys granted the current authority (examiner signature plus owner activation), and which key removed it, if any.
5. **Ledger rules and marginalia.** Content sits on a ruled grid; caveats and sources sit in a right margin column on wide screens.

### 5.5 Voice and copy rules

- **Plain verbs, concrete nouns, units and sources:**
  - "Pays automatically up to $180 per day", not "T1 autonomous envelope".
  - Tier codes stay as secondary labels for experts and judges.
- **Never use:** "world's first", "zero risk", "guaranteed", "insured", "literally", "100%", "enterprise-grade", "startup-grade", "military-grade", or "bank-level", unless a measured value supports the exact claim.
- **Replace "safe" with what is bounded:** "can only pay registered suppliers past cooldown, within $X per window".
- **The agent's text is quoted, never asserted:** "The agent says: …".
- **Sentence case everywhere.** Uppercase only inside provenance stamps and tier tags.

**User-facing glossary (UI label → internal term):**

| UI label | Internal | Short explanation shown on first use |
|---|---|---|
| Observe only | T0 | The agent may read and propose; it cannot pay |
| Pays automatically | T1 | Within the bonded cap, to registered suppliers past cooldown |
| Waits for review | T2 | Executes after the challenge window unless vetoed |
| Owner only | T3 | Only you can do this |
| Out-of-bounds attempt | Class I | Something the contract must stop |
| Wrong but permitted | Class II | Allowed by the rules but still wrong; measured by the exam, repaid by the bond |
| Unreviewed exposure | Unreconciled T1 exposure | Autonomous payments you have not accepted yet |
| Free bond | `bondPool.freeBond()` | Capital still available to repay a loss |

---

## 6. Visual system

### 6.1 Typography

**Families [DECISION]:**

| Role | Family | Why this one | Alternatives rejected |
|---|---|---|---|
| Display and editorial (headlines, Policy Card, disclosures, homepage) | **Newsreader** (variable `wght` 200–800, `opsz` 6–72, italic), OFL-1.1 | Built for on-screen reading, with true optical sizes: large sizes get finer contrast, small sizes get sturdier forms. It gives the product the voice of a serious financial publication. It is uncommon in SaaS, so it is distinctive without being a trend | *Instrument Serif*: the 2024–25 trend face and single-weight, so it is becoming its own cliché. *Fraunces*: too playful for a risk product. *Source Serif*: sober but anonymous |
| UI text (labels, body, tables, numbers) | **Atkinson Hyperlegible Next** (variable `wght` 200–800, italic), OFL-1.1, with `tnum` | Designed by the Braille Institute to make similar characters unmistakable. Decisive for a UI full of amounts, invoice numbers and IDs. Tabular figures align columns. It signals care for accessibility, which the rubric rewards | *Inter*: the most-cited AI-template default. *Geist*: the font `create-next-app` scaffolds and the shadcn ecosystem uses, so it is becoming a template signature. *Space Grotesk*: a crypto-site cliché. *IBM Plex Sans*: excellent, but strongly IBM-branded and common in developer tools |
| Data (hashes, addresses, invoice keys, code, CLI) | **Atkinson Hyperlegible Mono**, OFL-1.1 | The same disambiguation philosophy (0/O, 1/l/I) in monospace, which is exactly what character-by-character hash comparison needs | *JetBrains Mono*, *IBM Plex Mono*: fine, but not tuned for glyph confusion |

**Loading (China-safe):**
- Commit subset `.woff2` variable files: Latin plus Latin-Extended, both italic and roman where used. Load them with `next/font/local`, `display: 'swap'`, and `adjustFontFallback` for minimal layout shift.
- Preload only the UI family.
- No request leaves the app's origin.
- Budget: **≤ 300 KB total** font transfer on first load. Verify; sizes were not measured here.

**Fallback and CJK stacks** (for Chinese text a judge may enter, and future localization; no multi-megabyte CJK webfont is shipped):

```css
--font-sans:  "Atkinson Hyperlegible Next", ui-sans-serif, system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
--font-serif: "Newsreader", ui-serif, Georgia, "Songti SC", "SimSun", serif;
--font-mono:  "Atkinson Hyperlegible Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
```

**Type scale.** Base 16 px. Fluid display sizes use `clamp()`. **The minimum rendered size is 12 px, anywhere.**

| Token | Family | Size / line height | Weight | Use |
|---|---|---|---|---|
| `display-1` | Newsreader, opsz 72 | `clamp(2.75rem, 1.6rem + 4.2vw, 5.5rem)` / 0.98; tracking −0.02em | 450 | Homepage hero only |
| `display-2` | Newsreader, opsz 60 | `clamp(2.25rem, 1.5rem + 2.6vw, 3.75rem)` / 1.04 | 450 | Homepage section heads |
| `h1` | Newsreader, opsz 36 | 2.25rem / 1.1 | 500 | App page titles |
| `h2` | Newsreader, opsz 24 | 1.625rem / 1.2 | 500 | Section titles |
| `h3` | Atkinson Next | 1.125rem / 1.35 | 650 | Panel titles |
| `body-lg` | Atkinson Next | 1.125rem / 1.6 | 400 | Lead paragraphs |
| `body` | Atkinson Next | 1rem / 1.55 | 400 | Default |
| `small` | Atkinson Next | 0.875rem / 1.45 | 400 | Secondary text, table cells |
| `label` | Atkinson Next | 0.8125rem / 1.3; tracking +0.01em | 600 | Field labels, column heads (sentence case) |
| `micro` | Atkinson Next | 0.75rem / 1.3 | 600 | Stamps, tier tags; the floor |
| `figure-xl` | Atkinson Next, `tnum` | 2.5rem / 1.05 | 600 | Meter figures, KPIs |
| `figure` | Atkinson Next, `tnum` | inherits | 500 | All money and counts |
| `mono` | Atkinson Mono | 0.875rem / 1.5 | 400 | Hashes, addresses, code |

**Rules:**
- Money is always right-aligned in tables, with `tnum` and the currency symbol in the figure: `$1,234.50`. Units are spelled out once per view ("USDC").
- Rates always appear with counts: `15.83% (38 / 240)` (`plan.md` §8.4).
- **Hash display:** middle-truncate to `0x5ac7…3d0f` with a copy button that copies the full value; the full value appears in a tooltip and on focus. No other truncation pattern.
- No weight above 700. No italics for emphasis in UI (only in quotes and editorial copy). No all-caps headings.

### 6.2 Color

**Light theme ("Paper")** and **dark theme ("Carbon")**. Every text pair below was computed against WCAG 2.x relative luminance [MEASURED]. All text tokens meet AA (≥ 4.5:1) on all three surfaces.

| Token | Role | Light | on paper / sheet / well | Dark | on paper / sheet / well |
|---|---|---|---|---|---|
| `--paper` | Page background | `#F4F1E8` | — | `#131210` | — |
| `--sheet` | Panels, table bodies | `#FBF9F4` | — | `#1B1A17` | — |
| `--well` | Inputs, code, sunken areas | `#ECE7DA` | — | `#0E0D0B` | — |
| `--ink` | Primary text | `#1A1916` | 15.57 / 16.71 / 14.24 | `#EDE9E0` | 15.45 / 14.36 / 16.03 |
| `--ink-2` | Secondary text | `#4F4B43` | 7.68 / 8.25 / 7.03 | `#B7B1A4` | 8.77 / 8.15 / 9.10 |
| `--ink-3` | Metadata, captions | `#6B665C` | 5.05 / 5.42 / 4.62 | `#959084` | 5.88 / 5.47 / 6.11 |
| `--rule` | Hairline dividers (decorative) | `#D8D1C1` | n/a | `#33302B` | n/a |
| `--rule-control` | Input and control borders (needs ≥ 3:1) | `#8A826F` | 3.38 / 3.63 | `#706A5F` | 3.49 / 3.24 |
| `--accent` ("signature ink") | Primary actions, links, focus ring | `#2B44B8` | 7.09 / 7.61 / 6.49 | `#9AABFF` | 8.60 / 7.99 / 8.92 |
| `--on-accent` | Text on the accent fill | `#FFFFFF` (8.01) | — | `#131210` (8.60) | — |
| `--moved` | Funds moved, executed, pass | `#1D6A43` | 5.82 / 6.25 / 5.32 | `#6CC796` | 9.14 / 8.49 / 9.48 |
| `--pending` | Waiting, T2, cooldown | `#8A5300` | 5.60 / 6.02 / 5.13 | `#E9B65A` | 10.08 / 9.37 / 10.46 |
| `--blocked` | Reverted, rejected, fail, revoked | `#B0271F` | 5.89 / 6.32 / 5.39 | `#F2786C` | 6.85 / 6.36 / 7.10 |
| `--observe` | T0, not submitted, neutral | `#5A564D` | 6.47 / 6.95 / 5.92 | `#A8A397` | 7.44 / 6.92 / 7.72 |

**Tints** (chip and row backgrounds), with the status color as text on top [MEASURED]:

| Tint | Light | Text contrast | Dark | Text contrast |
|---|---|---|---|---|
| `--moved-tint` | `#E2ECE3` | 5.43 | `#1A2A21` | 7.33 |
| `--pending-tint` | `#F5E7C8` | 5.17 | `#2E2616` | 8.05 |
| `--blocked-tint` | `#F6DEDA` | 5.19 | `#331C19` | 5.81 |
| `--accent-tint` | `#E2E6F6` | 6.44 | `#1E2236` | 7.21 |

**Usage rules:**
- About 90% of any screen is paper, sheet and ink. The accent appears only on the single primary action per view, links and focus.
- **Status hue is never used without a shape and a word** (✓ Executed / ◷ Waiting / ✕ Reverted / — Observe only). This satisfies WCAG 1.4.1 and colour-blind users.
- Charts use ink shades plus at most one accent series (§6.6). Agents α, β, γ are distinguished by direct labels, not hues.
- Dark mode uses lighter, desaturated status hues to avoid halation on dark grounds (§3.9).

### 6.3 Space, grid and layout

- **Spacing scale (4 px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **App grid:** 12 columns, 24 px gutters (16 px below 768 px), content max 1440 px.
- **Marginalia column:** at ≥ 1280 px the right 3 columns hold provenance notes, definitions and caveats beside the content they qualify (Tufte sidenotes). Below 1280 px they collapse into inline footnotes.
- **Prose measure:** 60–72 characters (`max-width: 68ch`) for disclosures, explanations and homepage copy.
- **Table density:** "Comfortable" (44 px rows) by default; "Compact" (32 px) toggle for the ledger, traces and claims registry. Research on dense data tables suggests offering density modes rather than adding whitespace [RESEARCH: data-table guides, secondary].
- **Breakpoints:** 390 (phone), 768 (tablet), 1024 (laptop and projector at 150%), 1280 (desktop and projector at 125%), 1536 (wide).

### 6.4 Shape, rules and elevation

- **Radii:**

  | Radius | Used for |
  |---|---|
  | 0 | Tables and rules |
  | 2 px | Stamps |
  | 4 px | Inputs, chips, buttons |
  | 6 px | Panels |
  | 10 px | Dialogs and sheets only |

  This replaces today's 24–32 px.
- **Structure through rules, not boxes.** 1 px `--rule` hairlines separate sections. Panels are used only when content is a distinct object (an invoice, a claim case file, the meter).
- **Elevation through tone.** Level 0 is paper. Level 1 is sheet plus a 1 px rule. Level 2 (menus, dialogs) is sheet plus one soft shadow: light `0 1px 2px rgb(26 25 22 / .06), 0 8px 24px rgb(26 25 22 / .08)`; dark uses a lighter surface `#24221F` and a rule, with almost no shadow.
- **No `backdrop-filter` anywhere** except, optionally, the sticky app header at 92% opaque paper. This removes the performance risk in §4.3-H.

### 6.5 Iconography

- **Lucide** (`lucide-react`, already a dependency) at 1.5 px stroke, 16 px inline and 20 px in navigation. Icons always accompany a text label, except in the collapsed rail, where the label becomes a tooltip *and* the accessible name.
- **No emoji anywhere in UI chrome.**
- **Status glyphs are drawn, not emoji:** ✓ check, ◷ clock, ✕ cross, — dash, ⊘ revoked. Each pairs with its word.

### 6.6 Data visualization rules

- Direct labels on series; no legends where avoidable.
- Zero baselines for bars.
- Show the number, then the bar. Bars support the figure; they never replace it.
- **The experiment matrix (3 agents × 3 regimes) is a small-multiple grid.** Each cell shows automation rate with counts, net loss, and bond payout where applicable. Losses span $5 to $38,700, so the loss bar uses a **clearly labelled logarithmic scale**; the exact number is always printed.
- **Patterns for regimes:**

  | Regime | Fill |
  |---|---|
  | R0 (raw EOA, unbounded) | Diagonal hatch in `--ink-3` |
  | R1 (fixed caps) | Solid `--ink-2` |
  | R2 (UNDERWRITE) | Solid `--accent` |

  This works in grayscale, print and both themes.
- Every chart has a text alternative: a visually hidden table plus a one-sentence summary.

### 6.7 Core components (new)

Each component lists its states. Every component must render correctly in both themes, at 390 px, at 200% zoom, keyboard-only, and with reduced motion.

#### 6.7.1 Authority Meter

```
┌ AUTHORITY ─────────────────────────────────────────────── [LIVE CHAIN] ┐
│ γ  llm:gamma · qualification 0x5ac7…3d0f · expires in 13 d 04 h          │
│ Pays automatically                                         Tier T1      │
│ per payment ≤ $180.00                                                   │
│ this window   $62.00 of $180.00   ▕████████░░░░░░░░░░░░▏ resets 14:00    │
│ Backing  (unreviewed exposure must stay ≤ free bond · INV-10)           │
│ exposure      $62.00              ▕██░░░░░░░░░░░░░░░░░░░░░░░░░░░░▏       │
│ free bond  $1,938.00 of $2,000.00 ▕█████████████████████████████░▏       │
│ Granted by  ✓ examiner 0x37bd…96aE (signature)  ✓ owner 0x7099…79C8 (tx) │
│ Evidence  0 out-of-bounds · p ≤ 0.0582 · Policy card →                   │
└──────────────────────────────────────────────────────────────────────────┘
```

(Illustrative values. The real meter binds to `/api/state` and the active report.)

**States** (each with distinct copy and visual):

| State | Display |
|---|---|
| **T0 Observe only** | Scale hatched; "Not yet earned: 40 of ≥ 100 benign scenarios (gate G2 · UTILITY_GATE)"; link to Policy Card |
| **T1 active** | As drawn above |
| **T2 only** | Cap bar absent; "Every payment waits for review" |
| **Window exhausted** | Bar at cap with a `--pending` end-stop; "Next payment waits until 14:00" |
| **Backing exhausted** | Exposure meets free bond; "Reconcile to continue" (US-10; see gap note in §15) |
| **Paused** | — |
| **Expired** | — |
| **Revoked** | Hatched `--blocked`; "Revoked by claim #1 · tx 0x…" with the revoking key named |
| **Offline or stale** | Last known values greyed, a "Stale · last read 14:02:11" stamp, and a retry control |

**Accessibility:** The meter is a `role="group"` with a visually hidden sentence summary, for example "Pays automatically up to 180 dollars per day; 62 spent; exposure 62 of 1,938 free bond". It is not just `<progress>` elements.

#### 6.7.2 Provenance stamp

| Stamp | Meaning | Shape (always in `--ink`; never hue) |
|---|---|---|
| `LIVE CHAIN` | Read from RPC this session (`isLiveRpc: true`) | Filled ink chip, solid dot |
| `RECORDED` | From a committed evidence file. *New:* completes the provenance model, so "unlabeled" is never ambiguous | Outline plus document glyph; focusing shows the file path |
| `REPLAY` | Replayed agent trace | Double outline |
| `SCRIPTED` | Deterministic script or fixture | Dashed outline |
| `CONTROLLED` | Controlled condition (designated adjudicator, tamper toggle, compiler what-if) | Outline with corner ticks |
| `SIMULATED` | Produced by the in-memory demo runtime; not on any chain | Diagonal hatch fill, "specimen" style |
| `NOT RUN` | `AGENTS.md` rule 7 | Dotted outline, `--ink-3` text |

Stamps are `micro` uppercase with a 2 px radius. Each has a tooltip and an accessible name with its definition ("Simulated: produced by the demo runtime; no transaction was sent"). They replace `components/Badges.tsx` while keeping its four existing variants.

#### 6.7.3 Four Facts strip

```
① Proposed ─────────── ② Decided ──────────── ③ Contract ─────────────── ④ Funds moved
Acme Industrial        ◷ Waits for review      requestPayment            — Not yet
INV-104 · PO-103       over $180 automatic     pending #3 · ready 14:32  executes after window
$240.00                limit (EXCEEDS_T1…)     tx 0x71a9…8a38 [SIMULATED] unless vetoed
"The agent says: matches PO-103, goods received 12/12."
```

- Each fact has a status glyph and word.
- "Not submitted" and "Not recorded" are explicit neutral states.
- The agent's rationale is rendered as a quotation under the strip, visually subordinate to what the policy and contract did (§3.3).
- **Contract result:** a decoded event name, or a decoded custom error ("Reverted · `RecipientNotAllowed()`").
- "Funds moved: Yes" is allowed **only** with a success receipt and a matching decoded `PaymentExecuted` event (`AGENTS.md` rule 6). Otherwise it shows "No" or "Simulated: no chain transaction".

#### 6.7.4 Other primitives

| Component | Notes |
|---|---|
| `Amount` | bigint in, formatted out; tabular; optional delta; never `toFixed` on floats |
| `Hash` | Middle truncation, copy button with "Copied" live-region feedback, optional explorer link **only** when the receipt is verified to exist |
| `TierTag` | "T1 · Pays automatically" with tier glyph |
| `Countdown` | Accessible timer: text updates every second, announced only at milestones (60 s, 10 s, done) via `aria-live="polite"`. Thin rule shows remaining time |
| `ConfirmConsequence` dialog | For irreversible actions: lists exact consequences ("Pays $165.00 from the bond to the vault. Revokes qualification 0x5ac7…. Cannot be undone."); the confirm button repeats the verb and amount |
| `StatusLine` | Persistent, dismissible result area per panel, replacing `alert()` and 4-second toasts. Keeps the last result with its transaction and timestamp |
| `DataTable` | Sortable headers with `aria-sort`, caption, density toggle, sticky first column on scroll, card-row layout under 768 px |
| `EmptyState` | Says why it is empty and the next action ("No claims yet. Claims can be filed on autonomous payments from the Owner inbox.") |
| `Sidenote` | Marginal note at ≥ 1280 px; inline footnote below |
| `SourceLink` | "Recorded in `evidence/exams/0x5ac7…/report.json`" with a copy-path action |
| Primitives: Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Tabs, Select, Sheet, ToggleGroup | Radix behavior vendored via the shadcn CLI; styled with the tokens above |

---

## 7. Information architecture and navigation

### 7.1 New map

```
PUBLIC SITE                                   APP (workspace)
/                Homepage                     OPERATE
/evidence        Proof hub (also in app)        /dashboard              Overview (Authority Meter)
/auth/login      Sign in (demo personas)        /portals/owner          Inbox (owner): review · invoices · vendors · claims
/auth/register   Create profile                 /portals/vendor         Supplier portal
                                                /claims                 Claims registry (+ role actions)
                                              QUALIFY
                                                /exam                   Policy card (α β γ, compiler)
                                                /portals/examiner       Examiner desk
                                                /portals/underwriter    Bond
                                                /portals/adjudicator    Adjudication queue
                                              PROVE
                                                /traces                 Traces
                                                /evidence  (/verify)    Verify & artifacts
                                                /experiment             Experiment
                                              LAB  (presenter / judge; everything stamped)
                                                /submit                 Invoice studio
                                                /attack-lab             Attack lab
```

- **No URL is removed.** README and DEMO_SCRIPT links keep working.
- `/verify` renders the Verify tab of the Evidence view, bound to `/api/verify` instead of constants.
- `/claims` and `/portals/adjudicator`, `/exam` and `/portals/examiner`, `/submit` and `/attack-lab` each become **tabs of one area** with shared components, so the Four Facts and claim case files are implemented once.

### 7.2 Navigation behavior

- **App rail (≥ 1024 px):**
  - Always shows icon plus label, grouped under Operate, Qualify, Prove and Lab.
  - It collapses to icons **on click** (persisted per viewer), never on hover. This keeps DEC-028's compact-rail capability without the hover-only problem.
  - The rail sits at reduced contrast (`--ink-2`); the current page uses `--ink` with a 2 px accent rule.
- **< 1024 px:** a top bar with a "Menu" button opening a full-height Sheet with the same groups. No fixed rail, which fixes F1.
- **Global status strip** (in the app header, right side):
  - chain (`Anvil 31337` / `Base Sepolia 84532` / `Offline`);
  - data-source mix (e.g. "Chain + Simulated runtime");
  - "Updated 2 s ago";
  - **Reset sandbox**, behind a confirm dialog.
- **"Viewing as" persona switcher:** one control replaces the header dropdown, sidebar dock and per-portal switch buttons. It is labelled honestly; see §8.13.
- **Role-aware landing:** after sign-in, each persona lands on its home:

  | Persona | Lands on |
  |---|---|
  | Owner | Inbox |
  | Supplier | Supplier portal |
  | Examiner | Examiner desk |
  | Underwriter | Bond |
  | Adjudicator | Adjudication queue |

  Other areas stay visible, marked with a small lock and the role that can act there, so judges can explore.

### 7.3 Judge path: about 60 seconds, then about 5 minutes

1. **Homepage hero:** the mechanism in one sentence, plus a specimen meter showing earn → pay → revoke.
2. **"Watch the authority move"** (guided demo, Phase 3) or **Overview:** the real meter with stamps.
3. **Lab → Attack lab:** three attacks, each stopped at its layer, shown as Four Facts strips.
4. **Claims:** approve a claim; the meter collapses (the signature motion moment).
5. **Evidence → Verify:** PASS, then toggle tamper, then FAIL, field by field.
6. **Experiment:** 3×3 matrix with counts; hypotheses H1–H4 with outcomes, including the documented H4 leak.

---

## 8. Page-by-page redesign

Each entry covers purpose, primary users, layout, states, motion, preserved features, and changes with their justification.

### 8.1 Homepage `/` (conversion-focused)

**Conversion goals, in priority order:**
1. A judge understands the mechanism and opens the demo.
2. A skeptic opens Verify.
3. A builder or risk buyer runs it offline or reads the technical paper.

For a risk product, credibility *is* conversion: the page wins by being specific and honest where competitors are vague [RESEARCH §3.3].

**Structure:**

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ UNDERWRITE      How it works   Evidence   Run it offline     ◐   [Open the demo] │
├──────────────────────────────────────────────────────────────────────────────────┤
│ FinTechathon 2026 · Topic F · Agent wallet for accounts payable                  │
│                                                                                  │
│  Don’t trust the agent.                   ┌ SPECIMEN · illustration ──────────┐  │
│  Test it. Bound it.                       │ Pays automatically up to $180/day │  │
│  Back what remains.                       │ ▕██████░░░░░░▏ spent $62           │  │
│                                           │ exposure ≤ free bond               │  │
│  An accounts-payable agent that pays      │ ▕██░░░░░░░░░░▏ $62 / $1,938        │  │
│  suppliers in USDC. Its limit is computed │ ① earned  ② paying  ③ revoked  ❚❚ │  │
│  from an adversarial exam, enforced by a  └───────────────────────────────────┘  │
│  contract, backed by a bond, and revoked                                         │
│  in the same transaction that repays a                                           │
│  proven loss.                                                                    │
│  [Watch the authority move]   Verify a qualification →                           │
│ ──────────────────────────────────────────────────────────────────────────────── │
│ 330-invoice pre-registered stream · 0 out-of-bounds payments under R1/R2 ·       │
│ net loss under UNDERWRITE $0 · $0 · $5 (α · β · γ)        [RECORDED] rescore →   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Sections:**

| # | Section | Content | Source of truth |
|---|---|---|---|
| 1 | Hero | The plan's own tagline as H1 (`plan.md` §0, "kept from the original"); a one-sentence mechanism; primary CTA "Watch the authority move" (Overview until the guided demo exists); secondary "Verify a qualification". The visual is a **specimen** meter cycling *earned → paying → revoked* (about 9 s) with a visible pause control (WCAG 2.2.2), clearly stamped "Specimen · illustration" and linking to the live meter | Illustration; the proof strip comes from `protocol-summary.json` |
| 2 | "Two keys to grant. Any one to take away." | Typographic statement plus a seal diagram: examiner signature + owner activation → authority. Owner veto, examiner revocation, adjudicated claim or expiry → removal | `plan.md` §0 |
| 3 | "Four layers, one invoice" | Scroll story: an invoice card descends through Agent → Policy → Contract → Bond. At each layer a caption names what that layer stops, with the real typed error (`RecipientNotAllowed`, `DuplicateInvoice`, `RecipientCoolingDown`, `InsufficientBacking`, `QualificationRevoked`) | `README.md` §3; `plan.md` §5.3 |
| 4 | "What contracts can't catch" | Honest residual: wrong-but-permitted payments. Real numbers: "In the blind red-team set, a freight discrepancy got past γ: **$170**. The bond repaid **$165**; the owner's deductible was **$5**." Stamped "Recorded · self-authored Generator B (DEC-023)" | `README.md` §4 H4; evidence summary |
| 5 | Evidence | 3×3 small-multiple matrix (automation with counts; net loss); "Every number re-derives from committed traces" plus the `pnpm uw experiment rescore` command; link to `/experiment` | `protocol-summary.json` |
| 6 | "Who holds which key" | The five roles as a key-holder table: holds / can / cannot, from `plan.md` §5.1, linking to each desk. Replaces five identical cards | `plan.md` §5.1 |
| 7 | "Run it offline in 2 minutes" | Quickstart block (`pnpm install`, `forge test`, `pnpm -r test`, `pnpm demo:local`). "No API keys. No internet. Local Anvil chain." | `README.md` §2 |
| 8 | "Limits we publish" | Bounds describe the exam distribution; the adjudicator is a designated key; testnet and local only; Generator B is self-authored; this is not insurance | `README.md` §7; `plan.md` §0 |
| 9 | "Who would pay" (hypothesis) | Replaces the pricing table: "Future model, not validated: agent providers pay for examination; underwriting capital requires licensed partners." CTA: "Read the technical paper" (`docs/TECHNICAL.pdf`) and "View the repository" | `plan.md` §4.F |
| — | Footer | Provenance legend (all stamps), theme switch (System / Light / Dark), links to docs, "FinTechathon 2026 · Topic F" | — |

**Changes requiring justification:**
- **The pricing tiers are replaced, not deleted silently.** The figures ($4,990/mo, the $50k bond allocation, the 24/7 adjudicator SLA) are unvalidated commercial claims that contradict `plan.md` §4.F and the non-goals. The *topic* (business model) is preserved as section 9, labelled as a hypothesis.
- **The five "Role Desks" cards become the key-holder table** (section 6). Same destinations, more information (can and cannot), less visual repetition.
- **No count-up animations** on figures; they misrepresent static recorded values as live.

**Motion:** the hero specimen loop (Motion or a small GSAP timeline) and the section 3 scroll story (GSAP ScrollTrigger, pinned and scrubbed). All other reveals are subtle fade-ups. With reduced motion, the hero shows three static frames side by side and section 3 is a static vertical diagram (§9).

### 8.2 Guided demo, "Watch the authority move" (Phase 3; additive)

A presenter layer, not a new page: a numbered six-scene stepper (Earn, Work, Attack, Residual, Consequence, Learn) that opens the real screens with a caption bar and "Next scene". Each scene shows the stamps relevant to it, per `docs/DEMO_SCRIPT.md`. It adds **no** new data paths. It sequences existing screens for judges and the video recording.

**Justification:** `plan.md` §10 defines this exact story, and the rubric's "Innovation & Interaction" names an accessible demonstration.

### 8.3 Overview `/dashboard`

**Users:** everyone. It is the "where do we stand" screen.

**Layout:**
- Left (8 columns): the **Authority Meter** (§6.7.1).
- Right (4 columns): "Needs attention", a list of up to five items (T2 waiting with countdowns, pending claims, vendors in cooldown, expiring qualification), each deep-linking to the item.
- Below:
  - "Recent payment attempts": the last 10 Four Facts strips in compact form, linking to Traces;
  - "Mandate": owner ceilings, reserve floor, challenge period and cooldown, **read from `/api/state`**, each with a stamp.

**States:** T0 (today's real state per evidence), active, revoked, offline/stale, simulated runtime (stamp on every simulator-derived figure).

**Changes:**
- Remove the literal $2,000 and $500 and the 42.50 and 180 fallbacks (A5).
- Remove the "Four Cryptographic Facts" marketing block, which belongs on the homepage.
- Remove the portal jump-button row; navigation and "Needs attention" cover it.

**Preserved:** T1 cap, window exposure with percentage, bond, reserve floor, qualification status, and 3 s polling (now with "updated n s ago").

### 8.4 Owner Inbox `/portals/owner`

**Users:** the owner/finance lead, daily. The center of gravity of the product (§3.1).

**Tabs:**

| Tab | Content |
|---|---|
| **To review** (default; count badge) | T2 cards, one per item: |
| **All invoices** | The Owner Agent Audit Ledger as a DataTable: invoice, supplier, amount, tier, the agent's checklist as glyph+word cells (replacing 🟢🔴🟡), contract result, stamp. Filters: tier, status, supplier, provenance. Row opens a side sheet with the full Four Facts and raw JSON |
| **Suppliers** | The registry: name, payout address (Hash), status (Active · Cooling down with live countdown · Deactivated), lifetime paid. "Deactivate" goes through ConfirmConsequence ("Future payments to CloudCorp will revert with `RecipientInactive()`"). "Add supplier" opens a form explaining the 300 s cooldown and that address changes restart it (the BEC defense, `plan.md` §2.2 P1) |
| **Claims** | File a claim against an executed **T1** payment, using a picker over executed payments instead of a free-text "Payment ID". A live preview computes deductible and estimated payout from pool parameters; evidence-hash input with validation. Lists this owner's claims with status |

Each **To review** card shows:
- supplier, invoice, PO and amount;
- **why it is waiting**, in words plus the reason code;
- the agent's checklist as glyph+word;
- **"Executes at 14:32 unless vetoed"** with a live Countdown;
- actions **Veto** and **Approve now**. These are today's Reject and Approve, relabelled; see §15 Q3 for aligning them with contract semantics;
- the result persists in a StatusLine with the transaction and its stamp.

**Header strip:** the compact Authority Meter (cap, window spend, exposure ≤ free bond) and vault balance with stamp.

**Changes:** grouped by job instead of three equal panels; the decision queue first. "Paid On-Chain" for simulator results becomes "Executed in demo runtime" with a SIMULATED stamp (A8).

**Preserved:** T2 approve/reject, vendor list with cooldown, revoke/reactivate, add vendor, file claim, the inbound audit ledger, 2.5 s sync.

### 8.5 Supplier portal `/portals/vendor`

**Users:** a supplier, per invoice. Designed like a calm customer portal, not a control room.

**Layout:**
- **Your status with Acme Corp:** registered and active / cooling down until 14:32 (live) / not registered (and what that means: "Invoices will be blocked; ask Acme to add you"). Target customer card: Acme Corp, Sarah Chen, vault Hash.
- **New invoice:** customer (fixed to the target owner), invoice number, PO, line items (description, quantity, unit price, subtotal, all with bigint-safe totals) and memo. Submit button says "Send invoice to Acme Corp".
- **What happens next:** the result appears as a Four Facts strip, plus a plain sentence: "This will pay automatically (under $180)" / "Acme will review this; it executes after the challenge window unless vetoed" / "Blocked: you are not on Acme's supplier list".
- **Your invoices:** a ledger with status, tier and settlement (stamped), filterable.

**Changes:**
- **The five red-team presets move** into a collapsed "Demo scenarios" disclosure at the bottom, stamped SCRIPTED, and are also available in the Lab. They stay one click away for the video. **Justification:** role clarity (B5). A real supplier never submits prompt injections; mixing them confuses both judges and the persona model.
- **The timed 5-stage pipeline animation is replaced** by a result-driven reveal. After the single API response, the four facts appear in sequence over ≤ 400 ms as a reading aid, labelled "Result", not "Progress" (A11).

**Preserved:** target-owner targeting (DEC-031), allowlist status, cooldown timer, lifecycle explainer (now "What happens next"), vault parameter summary (in an info popover), the five presets, line items, custom supplier ID (in demo scenarios), notes/memo, submit, reason codes, owner-agent audit, the T2 link to the owner portal, the trace log (in a "Details" drawer), the invoice ledger, 2.5 s polling.

### 8.6 Qualification: Policy card `/exam` and Examiner desk `/portals/examiner`

**Policy card (public)** is typeset like a policy schedule:

```
POLICY CARD                                                     [RECORDED] report.json
Qualification 0x5ac7…3d0f   ·   agent scripted-naive   ·   config 0x446c…617f
Corpus corpus-v1 (0xa063…6512) · seed 0x5c7c… · compiler@1 · issued 16 Oct 2026 17:10 UTC

Status   ▌ T0 · Observe only
         Not yet earned: 40 benign scenarios evaluated; gate G2 needs ≥ 100 (UTILITY_GATE).
Envelope   T1 per payment $0.00 · T1 per window $0.00 · T2 allowed · T2 per payment $2,000.00
Bounds     p_b 1.000 · p_a 1.000 · p 1.000   (one-sided Clopper–Pearson; joint ≥ 95% via Bonferroni, F = 5)
Gates      G1 ✓ no out-of-bounds executed   G2 ✕ utility   G3 —   G4 —
Sensitivity   a = 0.01 → $0 · a = 0.05 → $0 · a = 0.20 → $0
Notes (verbatim, plan §7)
  “Bounds describe the exam's scenario distribution, not real-world attack frequency.”
  “a is the owner's assumption about the share of adversarial invoices; sensitivity shown for a ∈ {0.01, 0.05, 0.20}.”
  “Worst case if this agent is fully compromised: unreviewed autonomous payments never exceed the bond
   remaining; at most t1MaxPerWindow per window; only to registered vendors past cool-down.”
```

- **Compare view:** α, β and γ as three columns of the same schedule, aligned row by row (Scene 1). Values come from `/api/exams` `evidenceExams` only. The `defaultReports` constant is removed from the response, or stamped SCRIPTED if the team wants to keep it for the demo (§15 Q2).
- **Compiler explorer** ("what if"), stamped CONTROLLED:
  - It uses the **spec formula** (`plan.md` §7) via a shared pure function, ideally imported from the engine's `compiler@1` so the UI cannot drift from the CLI.
  - Inputs *a* and R_window, each with a number field **and** a slider (2.5.7).
  - Shows the raw cap, the clamp by ceilings and bond, and the floorTo10 result, step by step.
- **Verbatim notes** are rendered as real typography (*a* in italic, `t1MaxPerWindow` in mono), not raw markdown (A6).

**Examiner desk:**
1. Pick a configuration.
2. View its exam report (RECORDED) with per-family counts and bounds.
3. "Re-run exam" shows the exact CLI command (`pnpm uw exam …`), because a 390-scenario run is a CLI job.
4. The attestation panel shows the **real** `attestation.json` where one exists in `evidence/exams/*` (RECORDED).
5. A "Sign (demo)" action that remains for the walkthrough is stamped SIMULATED and states that no EIP-712 signature was produced (A7).

**Preserved:** agent selection, exam result display, sign-attestation interaction (honestly labelled), link to owner activation, verbatim disclosures, α/β/γ comparison, compiler simulation with *a* presets and R_window.

### 8.7 Bond `/portals/underwriter`

**Hero:** the INV-10 inequality as an instrument, with exposure and free bond on one shared scale, the relation "≤" between them, and headroom labelled. Pool parameters (per-claim cap, deductible, grace period, total payouts) come from `/api/claims` `bondStatus` with stamps. Locked bond is shown per qualification.

**Deposit and withdraw:** these are wired to nothing today (A7). Until they call the contract, the forms render **disabled** with "Not available in this demo build: not wired to BondPool". The value proposition ("pool earns fees…") is removed until it exists.

**Preserved:** total, free and locked figures; the deposit and withdraw UI (disabled and honest); the INV-10 panel.

### 8.8 Claims `/claims` and Adjudication `/portals/adjudicator`

**Claims registry (all roles):** a DataTable with claim, payment (links to its trace), qualification, loss, deductible, payout, status (glyph+word), decided by, transaction (stamped), and evidence Hash. The filter becomes **All · Pending · Approved · Rejected**, fixing D5.

**Adjudication queue:** each pending claim is a **case file**:
- the claimed payment as a Four Facts strip;
- whether it is a covered T1 payment;
- whether it was reconciled (not claimable);
- the evidence hash with Verify;
- a computed **consequence preview**.

"Approve" opens ConfirmConsequence:

> Approving claim #2 will, in one transaction: pay **$165.00** from the bond to the vault (loss $170.00 − $5.00 deductible), and revoke qualification **0x5ac7…3d0f**. The agent's next payment will revert with `QualificationRevoked()`. This can't be undone.

"Reject" requires a reason. A persistent StatusLine shows the outcome and stamp. The Authority Meter (compact, in the header) visibly collapses, the signature motion moment in §9.4.

**"Simulate claim lifecycle"** stays as a clearly stamped SCRIPTED scene runner in the Claims header, under a "Demo scene" menu. Its log text is generated from real responses only; the hardcoded "$295.00" and "0x9fE4…" strings are removed (A5).

**Preserved:** bond metrics, file-claim modal (now a proper Dialog), simulate lifecycle, 4-step consequence visualizer (now driven by real state), log console (in a "Details" drawer), registry with filter, approve/reject, adjudicator history with consequence summary.

### 8.9 Lab: Invoice studio `/submit` and Attack lab `/attack-lab`

**One area with two tabs and one result component.** A stamped banner reads: "Lab: crafted inputs for demonstration. Results come from the policy engine and demo runtime. [SIMULATED] unless marked [LIVE CHAIN]."

- **Invoice studio:**
  - left, the preset library grouped by expected outcome (Pays automatically / Waits / Blocked);
  - center, the form, with the agent model selector α/β/γ;
  - right, the Four Facts result and a session history of attempts.
- **Attack lab:**
  - left, attack vectors grouped by layer (Agent / Policy / Contract / Bond) with the expected stop point;
  - an `ALLOW_REDTEAM_BYPASS` toggle in a bordered "Compromised key mode" panel that explains what it simulates (a raw agent-key transaction bypassing the policy);
  - results as Four Facts with the decoded revert.
- **The offline client-side fallback evaluator** stays, but its result is stamped SIMULATED and the hardcoded "Tx: 0x7fa2…901b" string is removed (A5).

**Preserved:** all nine presets, agent selector, free-form inputs, bypass toggle, offline fallback, and the result header ("Funds moved / Protected").

### 8.10 Traces `/traces`

**Master-detail layout:**
- run list (left; filter by source, search by run ID);
- step timeline (center; one row per step with tier tag and outcome glyph);
- step detail (right, or a sheet on small screens): the Four Facts strip, reasons, decoded errors, and a "Raw JSON" drawer with a copy button.
- Keyboard: ↑/↓ moves between steps; Enter opens detail.

**Changes:** every fabricated fallback (vendor, invoice number, amount, tier, status, receipt hash) becomes an explicit "Not recorded" in `--ink-3` with a dotted outline (A5). "Vault Invariant: Guaranteed" becomes nothing, or "No funds moved".

**Preserved:** run list, `?runId=` deep links, tier filter (plus an outcome filter), per-step Four Facts, raw JSON.

### 8.11 Evidence and Verify `/evidence` (and `/verify`)

**Verify tab:**
- qualification picker (all `evidence/exams/*`);
- a field-by-field table: field, recomputed locally, on-chain, result (glyph+word), detail;
- overall verdict as a large PASS/FAIL;
- "Simulate 1-byte tamper" toggle stamped CONTROLLED;
- "Re-verify" button;
- the equivalent CLI command (`pnpm uw verify <qualId>`) with copy.

It is bound to `/api/verify` on both routes. The `/verify` constants are deleted (A5).

**Artifacts tab:** generated from the evidence directory, not a constant array. Each artifact shows name, category, real size, real hash computed by the server, path, and a "View" action. On-chain receipts are listed with their chain, and an explorer link appears **only if the receipt is confirmed to exist on that chain**. Otherwise they show "Unverified: receipt not found on chain 84532" (A9).

**Preserved:** verify panel, tamper toggle, re-verify, checks list, artifact list, on-chain evidence table.

### 8.12 Experiment `/experiment`

- **Header:** question, protocol and pre-registration facts ("Protocol committed `93dfb1a` before the run; hashes committed `3a6f74c`", from `STATUS.md`), each linked.
- **Hypotheses H1–H4** as a list with outcome tags (Confirmed / Documented) and one-sentence findings. The H4 leak is stated plainly.
- **Main view:** a 3×3 small-multiple matrix (rows α, β, γ; columns R0, R1, R2). Each cell shows automation "x% (k / 240)", owner review burden, Class I breaches, Class II loss, bond payout and net loss, all from `evidence/experiments/main-run/protocol-summary.json` (RECORDED).
- **Toggle:** automation versus loss emphasis; the loss scale is log, labelled.
- **Per-window drill-down:** clicking a cell shows its 10 windows as a small table or bar strip. The last window holds 60 invoices (30 stream plus the 30-invoice blind set) [MEASURED from `protocol-summary.json`]; label that window "includes blind set".
- **Footnote:** "Generator B and the blind set are self-authored (DEC-023); bounds describe the exam distribution only."

**Changes:** replace all constants with evidence data (A2). Replace the marketing "conclusion" quote with the plan's close line *and* the actual numbers.

**Preserved:** protocol summary, metric toggle, chart, table, conclusion.

### 8.13 Sign-in, register, persona switching, portal guard

- **Login** (`/auth/login`), retitled "Sign in to the demo workspace". It offers:
  - a persona list (Owner, Supplier, Examiner, Underwriter, Adjudicator), each with name, role and what they can do;
  - "Use demo credentials", which fills the field (keeps DEC-028 password verification; satisfies WCAG 3.3.8);
  - the email and password form, with paste allowed;
  - "Connect browser wallet" (EIP-1193), preserved.
- **Honest label:** "Demo personas use local Anvil throwaway keys; credentials are published in DEC-028. This is not production authentication." (A10; `SECURITY_SELF_ASSESSMENT.md` KR-1.)
- **PortalGuard:** a compact inline card: "This is Elena Rostova's desk (Underwriter). Switch persona to act here", with "Use demo credentials" and password field. Read-only browsing of the page stays possible where safe, so judges see the screen behind it. **[DECISION needed, §15 Q5]**
- **Header:** never shows "Sign in" while a persona is active (A10).
- **Register:** preserved and restyled. It explains that profiles are stored locally in this browser.

### 8.14 Global shell, errors, loading, empty states

- **Header (app):** product mark, area title, status strip (§7.2), theme switch, "Viewing as". Sticky at 92% opaque paper; content padding ensures focused elements are never hidden beneath it (WCAG 2.4.11).
- **Footer (public):** provenance legend, docs, theme switch.
- **Loading:** skeletons that match final layout. No spinners for under 300 ms. Data panels show "Reading chain…" or "Reading evidence…" so users know the source.
- **Errors:** a plain-language cause ("Can't reach the local chain at 127.0.0.1:8545"), the next step ("Start Anvil with `pnpm demo:local`"), and a retry. Last known values greyed with a "Stale" stamp.
- **404 and error pages** in the same document style.
- **Print stylesheet** for the Policy Card, a trace step and a claim case file: light theme forced, no nav, URLs printed. This suits a "public record" and the paper deliverables.

---

## 9. Interaction and animation strategy

### 9.1 Principles

1. **Animate state changes users must notice:** authority, money, status, time. Nothing ambient.
2. **Motion follows data, never precedes it.** No staged "progress" before a response exists (A11).
3. **Only `transform` and `opacity` are animated** in the app. No animated blur, shadows or layout properties, except Motion layout animations on list removal.
4. **Every motion has a reduced-motion equivalent** that keeps the information: instant state change, a static marker, or a live-region announcement.

### 9.2 Motion tokens

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--motion-instant` | 0 ms | — | Reduced motion; toggles |
| `--motion-quick` | 120 ms | `cubic-bezier(0.2, 0, 0, 1)` | Hover, press, focus ring |
| `--motion-standard` | 200 ms | `cubic-bezier(0.2, 0, 0, 1)` | Menus, tabs, reveal |
| `--motion-emphasized` | 320 ms | `cubic-bezier(0.3, 0, 0, 1)` | Dialogs, sheets, row removal |
| `--motion-narrative` | 600–900 ms | `cubic-bezier(0.65, 0, 0.35, 1)` | Meter changes, revocation, homepage story |

### 9.3 Catalogue

| Moment | What moves | Why | Tool | Reduced motion |
|---|---|---|---|---|
| Page or tab enter | Content fades in, 6 px rise, stagger ≤ 30 ms × 6 | Orientation | CSS | Fade only, 120 ms |
| Meter value change | Bar width tweens; figure updates with tabular digits | Shows *how much* changed | Motion (`animate`) | Instant; live-region sentence |
| **Revocation** (signature) | Cap bar collapses to zero over 700 ms; hatch fills; "Revoked" stamp settles (scale 1.04→1, 160 ms); the two-key seal shows which key removed authority | The product's core consequence (`plan.md` §10 Scene 5) | Motion sequence | Instant state plus announcement "Authority revoked by claim #2" |
| Four Facts after a response | Facts appear left to right, 4 × 80 ms | Reading order; causality | Motion stagger | All at once |
| T2 resolved (veto/approve) | Card collapses, list closes the gap (240 ms) | Confirms the item left the queue | Motion layout (`domMax` on the inbox only) | Instant removal plus announcement |
| Countdown | Text per second; thin rule shrinks | Deadlines are real | CSS `transform: scaleX` | Text only |
| Dialog / sheet | Fade plus scale 0.98→1 / slide 16 px | Spatial continuity | Radix + CSS | Fade only |
| Copy hash | Icon swaps to check for 1.2 s; "Copied" announced | Feedback | CSS | Same, without transition |
| Theme switch | Colors cross-fade 200 ms (only during the switch) | Avoid a jarring flash | CSS class toggle | Instant |
| Homepage hero specimen | 3-state loop, about 9 s, **with pause button** | Shows the mechanism in one glance | Motion or GSAP timeline | Three static frames side by side |
| Homepage "Four layers" | Pinned section; invoice card descends through layers, scrubbed by scroll; captions swap | Teaches the architecture by causality | GSAP + ScrollTrigger | Static vertical diagram with all captions |
| Hover on rows and links | Underline or rule thickens; row tint | Affordance | CSS | Same |

**Explicitly not used:** count-up numbers, parallax backgrounds, cursor followers, card hover-lift or scale, infinite pulses, typewriter text, aurora or blob motion, page-wide View Transitions (experimental in Next.js; §3.6).

### 9.4 Signature moment, in detail: "authority moves"

The meter is the centerpiece the plan asks judges to watch change in Scenes 1, 5 and 6:

| Scene | Moment | Motion |
|---|---|---|
| 1 | **Grant** | The examiner key and the owner key each "press" into the two-key seal (120 ms each). The cap bar grows from 0 to the compiled cap (600 ms). Stamp: LIVE CHAIN, or SIMULATED in the demo runtime |
| 5 | **Revoke** | Collapse sequence (§9.3); the bond bar drops by the payout at the same moment, showing *atomic* visually: one beat, two consequences |
| 6 | **Re-grant** | Same as grant, with a "new key · new configHash" note |

### 9.5 Tools and loading [DECISION]

- **App routes:** CSS transitions plus **Motion** (`motion/react`) through `LazyMotion` + `m`, with `domAnimation` globally. `domMax` (layout animations) is loaded only in the Inbox and Adjudication queue. Budget per §3.6: about 4.6 KB + 15 KB, plus about 10 KB for `domMax` where used.
- **Homepage only:** **GSAP** core plus ScrollTrigger, dynamically imported after first paint. Use `gsap.matchMedia()` to respect `prefers-reduced-motion`. GSAP's plugins are now free for commercial use (§3.6).
- **Why both:** Motion fits React state (presence, layout), which is 95% of app motion. GSAP is stronger for scroll-scrubbed, pinned timelines. Keeping GSAP off app routes means operators never pay for it.

### 9.6 Performance budgets (to verify in Phase 4)

| Metric | Budget |
|---|---|
| Largest Contentful Paint, homepage, local production build | < 2.0 s on a mid-range laptop |
| Cumulative Layout Shift | < 0.05 |
| Animation frames during the scroll story | No long tasks > 50 ms |
| Font transfer | ≤ 300 KB first load |
| Homepage JavaScript, compared to today | No increase over today's page. Measure the current baseline first; the target replaces today's effects rather than adding to them |
| `backdrop-filter` | Zero instances in content (§6.4) |

---

## 10. Light and dark theme specification

### 10.1 Behavior

- **Default:** follow the OS (`prefers-color-scheme`).
- **User choice:** System / Light / Dark, a three-way ToggleGroup in the header menu and the footer. Stored in `localStorage` under `uw-theme`, with all access wrapped in try/catch.
- **No flash:** a tiny inline script in `<head>` sets `data-theme` before first paint. `<html suppressHydrationWarning>` replaces the current hardcoded `className="dark"` (`app/layout.tsx:19`).
- Set the CSS `color-scheme` property per theme, so native controls (scrollbars, date inputs, autofill) match.

### 10.2 Token implementation

```css
:root {                       /* Paper (light) */
  color-scheme: light;
  --paper:#F4F1E8; --sheet:#FBF9F4; --well:#ECE7DA;
  --ink:#1A1916; --ink-2:#4F4B43; --ink-3:#6B665C;
  --rule:#D8D1C1; --rule-control:#8A826F;
  --accent:#2B44B8; --on-accent:#FFFFFF; --accent-tint:#E2E6F6;
  --moved:#1D6A43;   --moved-tint:#E2ECE3;
  --pending:#8A5300; --pending-tint:#F5E7C8;
  --blocked:#B0271F; --blocked-tint:#F6DEDA;
  --observe:#5A564D;
  --shadow-overlay: 0 1px 2px rgb(26 25 22 / .06), 0 8px 24px rgb(26 25 22 / .08);
}
:root[data-theme="dark"] { /* Carbon (dark) */
  color-scheme: dark;
  --paper:#131210; --sheet:#1B1A17; --well:#0E0D0B; --raised:#24221F;
  --ink:#EDE9E0; --ink-2:#B7B1A4; --ink-3:#959084;
  --rule:#33302B; --rule-control:#706A5F;
  --accent:#9AABFF; --on-accent:#131210; --accent-tint:#1E2236;
  --moved:#6CC796;   --moved-tint:#1A2A21;
  --pending:#E9B65A; --pending-tint:#2E2616;
  --blocked:#F2786C; --blocked-tint:#331C19;
  --observe:#A8A397;
  --shadow-overlay: 0 0 0 1px var(--rule);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* same values as [data-theme="dark"] */ }
}
```

**Tailwind mapping:** the theme exposes only semantic names (`bg-paper`, `text-ink-2`, `border-rule-control`, `text-moved`…). Raw hex in components is disallowed; enforce it with a lint rule or a grep check in CI.

### 10.3 Theme-specific rules

| Concern | Light ("Paper") | Dark ("Carbon") |
|---|---|---|
| Base | Warm paper, not white, so the meter and stamps read as printed | Warm near-black `#131210`, not pure black (§3.9) |
| Text | Near-black ink | Off-white `#EDE9E0`, not pure white, to reduce glare |
| Elevation | Sheet plus rule plus soft shadow | Lighter surface (`--raised`) plus rule; shadow nearly invisible |
| Status hues | Deep, ink-like | Lighter and desaturated (computed ratios in §6.2) |
| Stamps and hatches | Ink on paper | Ink-light on carbon; hatch at 35% opacity |
| Charts | R0 hatch / R1 ink-2 / R2 accent | Same tokens; contrast holds via theme values |
| Images and diagrams | Inline SVG using `currentColor` and tokens only, so no raster swaps are needed | Same |
| Print | Always Paper | Forced to Paper |

### 10.4 Theme QA matrix

Test every page in {Light, Dark} × {390, 1024, 1440 px} × {100%, 200% zoom} × {default, reduced motion}, plus Windows High Contrast and forced colors. Stamps and glyphs must survive (use real borders and text, not background images).

---

## 11. Accessibility and responsiveness acceptance criteria

These criteria gate merging each Phase 2 page:

- [ ] axe-core (Playwright) reports **0 serious or critical** issues on every route, in both themes.
- [ ] Full keyboard path through the judge flow (§7.3); focus always visible (2 px `--accent` ring with 2 px offset) and never hidden under the sticky header (2.4.11).
- [ ] All interactive targets ≥ 24×24 CSS px (2.5.8); primary actions ≥ 40 px tall.
- [ ] No text below 12 px; all text pairs from §6.2 tokens (AA verified); control borders ≥ 3:1.
- [ ] Status never conveyed by color alone (glyph plus word).
- [ ] Dialogs: focus trap, Escape closes, focus returns, labelled title (Radix).
- [ ] Countdowns and live updates announced politely and sparingly; no announcement storms from 2.5 s polling. Announce changes, not ticks.
- [ ] Sliders have number-input equivalents (2.5.7); password fields allow paste and autofill (3.3.8).
- [ ] Auto-moving content longer than 5 s (the hero loop) has pause control (2.2.2).
- [ ] Tables have captions and `scope`; sortable headers expose `aria-sort`.
- [ ] Reflow at 320 CSS px with no horizontal page scroll (1.4.10); wide tables scroll inside their own container with a visible affordance.
- [ ] Projector check: 1280×720 at 100% and 1920×1080 at 150% scaling; the meter and Four Facts readable from about 4 m. Verify on the actual on-site machine if possible.
- [ ] `lang="en"`; CJK input renders with a system fallback, without tofu.

---

## 12. Content and data-integrity contract

This contract is the precondition for any visual work. It is not optional styling.

### 12.1 The provenance model

Every value rendered by a data component carries a source:

```ts
type Provenance =
  | { kind: 'live-chain'; chainId: number; readAt: number }
  | { kind: 'recorded'; path: string; sha256?: string }
  | { kind: 'replay'; runId: string }
  | { kind: 'scripted'; fixture: string }
  | { kind: 'controlled'; condition: string }
  | { kind: 'simulated'; origin: 'demo-runtime' }
  | { kind: 'not-run' }
  | { kind: 'not-recorded' };
```

- API routes return provenance alongside values. `/api/state` already exposes `isLiveRpc`; extend it to mark which fields the runtime overwrote.
- Components refuse to render a figure without provenance in development builds (console error plus a visible "Unsourced" stamp). That makes regressions loud.
- **"Executed" is only allowed when** the receipt status is success **and** a matching decoded `PaymentExecuted` is present (`AGENTS.md` rule 6). Simulator results render as "Executed in demo runtime" with SIMULATED.
- **Money:** components accept bigint base units only (rule 4). Today `/api/state` and `runtimeState.ts` use floats (`toFixed`), and the redesign's `Amount` component should not paper over that. Converting the runtime to bigint is a web-layer change that needs your approval (§15 Q4).

### 12.2 Copy replacements

| Current | Replacement | Reason |
|---|---|---|
| "The World's First Insured AI Payment Authority" | "FinTechathon 2026 · Topic F · Agent wallet for accounts payable" | Not insurance; no superlatives (`plan.md` §0, §4.F) |
| "Autonomous Enterprise Payments. Zero Rogue Spending Risk." | "Don't trust the agent. Test it. Bound it. Back what remains." | The plan's tagline; makes no false guarantee |
| "backed 100% by an on-chain underwriter bond pool" | "Unreviewed autonomous payments never exceed the bond still available." | Exact statement of INV-10 |
| "Theft Loss Default 0.00% · 100% atomic recovery" | "Net loss under UNDERWRITE: $0 · $0 · $5 (α · β · γ) on 330 invoices" | Matches evidence |
| "The agent literally cannot exceed its verified Clopper-Pearson spending cap" | "The contract rejects any autonomous payment above the activated cap." | Precise (INV-2) |
| "Clopper-Pearson 99% Exact" | "One-sided Clopper–Pearson bounds, ≥ 95% jointly (Bonferroni)" | `plan.md` §7 |
| "Vault capital strictly guaranteed" / "Vault Invariant: Guaranteed" | "No funds moved" | Says what happened |
| "Paid On-Chain" (simulator) | "Executed in demo runtime" + SIMULATED | Rule 12 |
| "Enterprise password authentication" / "startup-grade security" | "Demo personas (local keys)" | KR-1; no security overclaim |
| Pricing tiers | "Who would pay (hypothesis)" | `plan.md` §4.F |
| "Launch Enterprise Workspace" | "Watch the authority move" / "Open the demo" | Says what happens |

### 12.3 Single source of truth for numbers

The Policy Card, Examiner desk, homepage proof strip and Experiment page read **only** from `evidence/` via API routes. DEMO_SCRIPT and README numbers should then be regenerated from the same files. That last step is outside this plan's scope; flagged in §15.

---

## 13. Feature preservation matrix

"Kept" means the same capability in the new design. "Changed" lists what differs and why. Nothing is removed without a justification.

| Feature (today) | Where today | New home | Status | Justification if changed |
|---|---|---|---|---|
| Value proposition, problem/solution | `/` | Home §1–§4 | Changed | Overclaims removed (§12.2) |
| Role desk cards (5) | `/` | Home §6 key-holder table | Changed | Same destinations, more information |
| Pricing tiers (3) | `/` | Home §9 "Who would pay (hypothesis)" | Changed | Unvalidated claims contradict `plan.md` §4.F |
| Proof strip (4 stats) | `/` | Home hero strip | Changed | Bound to evidence (A1, A2) |
| Protocol HUD metrics (cap, exposure %, bond, reserve) | `/dashboard` | Overview meter + mandate | Kept | Literals replaced by reads (A5) |
| "Four facts" overview block | `/dashboard` | Home §2–§3 | Moved | Marketing content belongs on Home |
| Portal jump links | `/dashboard` | Nav + "Needs attention" | Changed | Navigation covers it |
| T2 approve / reject | Owner | Inbox → To review | Kept | Relabelled Approve now / Veto; Q3 |
| Vendor registry, cooldown, revoke/reactivate, add | Owner | Inbox → Suppliers | Kept | Confirm on deactivate (D1) |
| File claim | Owner, `/claims` modal | Inbox → Claims; `/claims` | Kept | Payment picker replaces free text |
| Inbound agent audit ledger | Owner | Inbox → All invoices | Kept | Glyph+word instead of emoji |
| Vault deposit handler (unrendered) | Owner | — | Dead code | Not rendered today; nothing to preserve |
| Supplier target owner, allowlist status, cooldown | Vendor | Supplier portal status | Kept | — |
| 5 vendor presets | Vendor | Supplier "Demo scenarios" + Lab | Moved | Role clarity (B5) |
| Line-item composer, memo, custom supplier ID | Vendor | Supplier new invoice / demo scenarios | Kept | — |
| 5-stage pipeline visualizer | Vendor | Four Facts result reveal | Changed | Timed fake progress removed (A11) |
| Invoice ledger with 2.5 s polling | Vendor | Supplier "Your invoices" | Kept | "Updated n s ago" added |
| Run battery (constants) | Examiner | Exam report (recorded) + CLI command | Changed | Rule 7 (A7) |
| Sign attestation (random hex) | Examiner | Real `attestation.json` + "Sign (demo)" stamped SIMULATED | Changed | Rule 7, 12 |
| Bond totals, free, locked; INV-10 panel | Underwriter | Bond | Kept | Bound to API |
| Deposit / withdraw (no-op) | Underwriter | Bond (disabled, labelled) | Changed | Did nothing; rule 7 |
| Pending claims approve / dismiss | Adjudicator | Adjudication queue | Kept | Consequence confirmation |
| Adjudication history | Adjudicator | Claims registry | Kept | — |
| Simulate claim lifecycle + log + 4-step visualizer | `/claims` | Claims "Demo scene" (SCRIPTED) | Kept | Log from real responses only |
| Claims registry + filter | `/claims` | Claims | Kept | Filter fixed (D5) |
| Invoice studio presets (5), agent selector, form, Four Facts | `/submit` | Lab → Invoice studio | Kept | — |
| Attack presets (4), bypass toggle, form, Four Facts, offline fallback | `/attack-lab` | Lab → Attack lab | Kept | Fallback stamped SIMULATED |
| Runs list, `?runId=`, tier filter, steps, raw JSON | `/traces` | Traces | Kept | Fabricated fallbacks removed |
| Verify with tamper + re-verify | `/evidence` | Evidence → Verify | Kept | — |
| Field-by-field verify (constants) | `/verify` | Same view, bound to `/api/verify` | Changed | Constants were fabricated (A5) |
| Artifact list (constants) | `/evidence` | Evidence → Artifacts (from disk) | Changed | Constants were fabricated |
| On-chain evidence table | `/verify` | Evidence → Artifacts → On-chain | Kept | Unverified hashes labelled (A9) |
| Experiment chart, table, toggle, summary | `/experiment` | Experiment | Kept | Bound to evidence (A2) |
| Verbatim disclosures | `/exam` | Policy card | Kept | Rendered correctly (A6) |
| α/β/γ comparison | `/exam` | Policy card → Compare | Kept | From evidence (A3) |
| Compiler simulation (a, R) | `/exam` | Policy card → Compiler explorer (CONTROLLED) | Kept | Spec formula (A4) |
| Login with presets, show password | `/auth/login` | Sign in | Kept | Honest label; quick-fill relabelled |
| Register (local accounts) | `/auth/register` | Register | Kept | — |
| Password challenge modal | `AuthModal` | "Viewing as" switcher dialog | Kept | Radix dialog, accessible |
| Portal guard | `PortalGuard` | Inline guard card | Kept | Password no longer printed; Q5 |
| Wallet connect / disconnect (EIP-1193) | Header | Sign in + Viewing as | Kept | — |
| Reset sandbox | Header | Status strip (confirm) | Kept | Confirmation added |
| Chain indicator | Header | Status strip | Kept | Shows real chain and source mix |
| Hover-expand sidebar + pin | Sidebar | Click-collapse rail (persisted) | Changed | Hover-only fails keyboard and touch (B4) |
| Footer tagline | Layout | Footer with provenance legend | Changed | — |

---

## 14. Phased implementation plan

### 14.1 Why the phases are split around the deadline

- **Today is Sat 17 Oct.** The plan's code-freeze checkpoint is after **20 Oct 06:00Z**; submission closes **20 Oct 21:59 Bangladesh time**. The human-recorded demo video (P9-T07) is still pending and will show whatever UI exists then.
- **A full visual rebuild in about two days risks the submission.** It touches all 17 routes and five shared components, and Playwright is not installed in `web/` despite P8-T11 being marked done [MEASURED: no `playwright` in either `package.json`]. So there is no automated regression net.
- **The integrity fixes are small, low-risk, and directly scored** under "Security & Compliance (30%)": audit trail, honest labelling. They also prevent judges from catching the overclaims the plan warns about. They must happen before the video.
- **Finalists are announced 31 Oct; the on-site defense is 20–23 Nov.** That leaves about four weeks for the full redesign, enough to do it properly.

### Phase 0: Honesty pass (before the freeze; about 1 working day; content and binding only)

**Goal:** nothing on screen is false. No new visual system.

| # | Task | Files (indicative) | Accept when |
|---|---|---|---|
| 0.1 | Replace overclaim copy (§12.2) and the pricing section | `app/page.tsx` | No banned phrases (§5.5) remain in `web/src` |
| 0.2 | Bind Experiment to `protocol-summary.json` | `app/experiment/page.tsx` (+ small API or server read) | Every figure equals `pnpm uw experiment rescore` output |
| 0.3 | Bind the Policy Card to `/api/exams` `evidenceExams`; drop or stamp `defaultReports`; fix the verbatim rendering; use the spec formula, or label the explorer CONTROLLED with the formula shown | `app/exam/page.tsx`, `api/exams/route.ts` | Values match `report.json`; the T0 state is explained |
| 0.4 | Bind `/verify` to `/api/verify`; build the artifact list from disk | `app/verify/page.tsx`, `app/evidence/page.tsx` | No literal hashes in `web/src/app` |
| 0.5 | Remove trace fallbacks; show "Not recorded" | `app/traces/page.tsx` | No invented vendor, amount, tier, status or receipt |
| 0.6 | Stamp simulator outputs SIMULATED; rename "Paid On-Chain" | Owner, Vendor, Submit, Attack lab, Claims | Every random-hash value carries SIMULATED |
| 0.7 | Disable underwriter deposit/withdraw with a label; stamp the examiner signature SIMULATED | Underwriter, Examiner | No success message without an action |
| 0.8 | Dashboard: remove literals and fallbacks | `app/dashboard/page.tsx` | Values from `/api/state` or "Not available" |
| 0.9 | Auth honesty: hide "Sign In" when signed in; relabel quick-fill as "Use demo credentials"; add the demo-personas note | Header, PortalGuard, Login | No password printed in plain text |
| 0.10 | Mobile overlap fix: hide the fixed rail below `md` | `components/Sidebar.tsx` | No horizontal scroll at 390 px |
| 0.11 | Add Policy Card, Claims and Verify to navigation | Sidebar, Header | All demo-scene pages reachable |

- **Verification:** `pnpm --filter web build` clean; manual pass of the six demo scenes; grep checks for banned phrases and literal hashes.
- **Governance:** record a DEC entry ("UI integrity pass") per `AGENTS.md` rule 10; update STATUS, TESTING and CHANGELOG.
- **Out of Phase 0, needs your decision:** the unresolvable Base Sepolia hashes (A9; §15 Q1).

### Phase 1: Foundations (21–27 Oct)

| # | Task | Accept when |
|---|---|---|
| 1.1 | Record DEC entries: "Public Record" direction supersedes DEC-025 (visionOS) and DEC-029 (landing); provenance stamps; navigation; personas copy | Entries in `DECISIONS.md` |
| 1.2 | **Tailwind decision:** migrate to Tailwind v4 now, while every class is being rewritten anyway (lowest marginal cost); CSS-first `@theme` maps directly to the tokens. Stay on Next.js 15; Next 16 brings breaking changes (e.g. `middleware.ts` → `proxy.ts`) and no benefit for this work [RESEARCH §3.7]. Check Tailwind v4's modern-browser baseline against the judges' browsers | Build clean; tokens only |
| 1.3 | Tokens (§6.2, §10.2), theme script, theme switch | Both themes render; no flash; contrast table reproduced in a unit test |
| 1.4 | Fonts via `next/font/local` (§6.1), subset `.woff2` committed, licenses (OFL texts) committed | No external font requests (network panel); ≤ 300 KB |
| 1.5 | Primitives via the shadcn CLI (Radix): Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Tabs, Select, Sheet, ToggleGroup, restyled. Optional: shadcn MCP for the implementing agent | No default shadcn styling remains |
| 1.6 | Data components: Stamp, Amount (bigint), Hash, TierTag, Countdown, StatusLine, ConfirmConsequence, EmptyState, DataTable, Sidenote, Four Facts strip, Authority Meter | Each has a dev-only gallery route `/__styleguide` (excluded from production) showing all states in both themes |
| 1.7 | Shell: app header with status strip, rail, mobile sheet, "Viewing as", footer | Keyboard-complete; 390 px clean |
| 1.8 | Install Playwright + axe-core in `web/`; smoke test per route; screenshot baseline per theme | CI or local script green |

### Phase 2: Product screens (28 Oct – 8 Nov)

Build in demo-scene order, so each step is demoable:
1. Overview (meter)
2. Owner Inbox
3. Policy card + Examiner
4. Lab (studio + attack)
5. Traces
6. Claims + Adjudication
7. Bond
8. Supplier portal
9. Evidence / Verify
10. Experiment

Each page merges only when it passes §11 and the §12 contract.

### Phase 3: Homepage and storytelling (9–13 Nov)

1. Homepage sections 1–9 (§8.1) with real evidence bindings.
2. Hero specimen loop with pause; GSAP scroll story with reduced-motion fallback.
3. Guided demo stepper (§8.2), if the team wants it for the defense.
4. Print stylesheets.

### Phase 4: Hardening and rehearsal (14–19 Nov)

1. Full accessibility audit (§11), including screen-reader pass (NVDA on Windows) and keyboard-only judge path.
2. Performance budgets (§9.6) measured and recorded in `TESTING.md`.
3. Offline rehearsal: fresh clone → `pnpm demo:local` with networking disabled; verify no external requests (fonts, scripts).
4. Projector check at the target resolutions; presenter run-through of all six scenes in both themes; choose the theme for the venue.
5. Freeze; tag; update STATUS, CHANGELOG and TESTING.

---

## 15. Risks and decisions needed from you

| # | Question | Recommendation | Why it matters |
|---|---|---|---|
| Q1 | **Unresolvable on-chain hashes (A9).** Two Base Sepolia hashes in `evidence/onchain/receipts` return `null` from the public RPC, and P6-T02 (testnet deploy) is open. How should the UI and submission treat them? | Before submission: either broadcast for real (P6-T02) and regenerate the receipts, or relabel the file and UI as "planned / not broadcast" and link only verified hashes | The plan's checklist requires every hash to resolve. A judge clicking a dead explorer link undermines every other claim |
| Q2 | Keep the hardcoded α/β/γ demo envelopes ($40 / $180) for the narrative, or show the real T0 results? | Show the real results. If a T1 demo envelope is needed, generate it through the real compiler with ≥ 100 benign scenarios and commit it as evidence | Three conflicting number sets today (A3) |
| Q3 | T2 actions: the contract model is "executes after the challenge window unless vetoed" (`plan.md` §5.2 US-5); the runtime offers Approve/Reject | Keep both behaviors; label them "Veto" and "Approve now", and show the auto-execute countdown. Confirm the contract supports early execution, or drop "Approve now" | Users must understand what happens if they do nothing |
| Q4 | Convert the demo runtime and `/api/state` from floats to bigint (`AGENTS.md` rule 4)? | Yes, in Phase 1, behind the same API shape | The `Amount` component should not hide float drift |
| Q5 | Should portal pages be viewable read-only by other personas, or stay fully locked (DEC-028)? | Read-only view for judges, actions locked | Judges explore; locked screens hide the product |
| Q6 | Timing: Phase 0 only before submission, Phases 1–4 for the Grand Final? | Yes (§14.1) | Protects the submission and the video |
| Q7 | Reconcile (US-10) has no UI today; the "Backing exhausted" meter state points to it | Add a "Reconcile" action in Inbox → All invoices in Phase 2, *if* the runtime or contract path exists. Otherwise show the state without the action | A dead end in the meter otherwise |
| Q8 | Default theme at the venue | Decide during the Phase 4 projector test; ship both | Projection conditions vary |

**Other risks:**
- **Rewrite regressions.** Mitigated by Playwright smoke tests plus screenshot baselines (1.8) before page work.
- **The font look may be unfamiliar to some reviewers.** Mitigated by showing the type in context early (styleguide route) and keeping all type tokens swappable.
- **Animation library sprawl.** Mitigated by §9.5 boundaries: GSAP homepage-only, Motion app-only.

---

## 16. Sources

**Project sources (read during this analysis):** `AGENTS.md`; `README.md`; `STATUS.md`; `plan.md` §0–§10, §12 (P8, P9), §14; `DECISIONS.md` DEC-025 – DEC-031; `PHASES.md` (P6, P8, P9); `docs/DEMO_SCRIPT.md`; `docs/competition/OFFICIAL_RULES.md`; `evidence/exams/*/report.json` and `policy-card.md`; `evidence/experiments/main-run/protocol-summary.json`; `evidence/onchain/EXECUTION_EVIDENCE.md` and `receipts/*.json`; every file under `web/src`.

**AP teams and agentic payments**
- [Ottimate: only 4% of finance teams have fully automated AP (Feb 2026, vendor survey)](https://ottimate.com/news/only-4-of-finance-teams-have-fully-automated-accounts-payable-despite-widespread-software-adoption/)
- [Ramp: Agentic payments explained (14 Apr 2026)](https://ramp.com/blog/agentic-payments)
- [Ramp Help Center: Bill Pay approvals](https://support.ramp.com/hc/en-us/articles/4417843897747-Bill-Pay-Approvals)
- [Payabli: Agentic payments (cites CSA 2026 survey; secondary)](https://www.payabli.com/?p=3476)
- [Agent Payments Protocol (AP2)](https://ap2-protocol.org)
- [PaymentsJournal: Coinbase unveils Agentic Wallets (secondary)](https://www.paymentsjournal.com/coinbase-unveils-agentic-wallets-to-power-autonomous-ai-spending-and-investing/amp/)

**Trust and AI UX**
- [p0stman: Calibrated confidence (secondary; cites NN/g, Microsoft, ACM)](https://p0stman.com/agent-ux/calibrated-confidence)
- [ParallelHQ: AI agent UX design (Jul 2026)](https://www.parallelhq.com/blog/ai-agent-ux-design)
- [UXmatters: Designing for autonomy (Dec 2025)](https://www.uxmatters.com/mt/archives/2025/12/designing-for-autonomy-ux-principles-for-agentic-ai.php)
- [UXmatters: Designing AI user interfaces that foster trust (Apr 2025)](https://www.uxmatters.com/mt/archives/2025/04/designing-ai-user-interfaces-that-foster-trust-and-transparency.php)

**Reference products and art direction**
- [Linear: Behind the latest design refresh (12 Mar 2026)](https://linear.app/now/behind-the-latest-design-refresh)
- [Linear: How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Mercury design guide (third-party; details conflict across sources)](https://blakecrosley.com/guides/design/mercury)
- [Awwwards: Typography honors listing](https://www.awwwards.com/inspiration_search/winner_category_typography/)
- [Awwwards: Messenger by abeto (SOTD, Nov 2025)](https://www.awwwards.com/sites/messenger)
- Edward Tufte, *The Visual Display of Quantitative Information* and *Envisioning Information* (sidenotes, small multiples)
- Jacques Bertin, *Semiology of Graphics* (visual variables)

**AI-generated design patterns (opinion, secondary)**
- [925studios: AI slop design tells](https://www.925studios.co/blog/ai-slop-design-tells)
- [925studios: AI slop web design guide (2026)](https://www.925studios.co/blog/ai-slop-web-design-guide)
- [Noqta: AI design slop, overused UI patterns (2026)](https://noqta.tn/en/blog/ai-design-slop-overused-ui-patterns-fix-2026)
- [Superdesign: Why AI design looks generic](https://www.superdesign.dev/blog/why-ai-design-looks-generic)

**Animation and frameworks**
- [GSAP on npm (plugins free, including commercial use)](https://classic.yarnpkg.com/en/package/gsap)
- [Motion: Reduce bundle size (LazyMotion, `m`, feature packages)](https://motion.dev/docs/react-reduce-bundle-size)
- [Next.js: `viewTransition` config (experimental)](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition)
- [Lucky Media: Next.js 16 overview (secondary)](https://www.luckymedia.dev/blog/nextjs-16-an-early-look-and-release-date)
- [shadcn/ui: MCP server](https://ui.shadcn.com/docs/mcp)
- [shadcn/ui: Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui v3 docs](https://v3.shadcn.com/docs/tailwind-v4)

**Accessibility and theming**
- [W3C: What's new in WCAG 2.2 (canonical)](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [TetraLogical: What's new in WCAG 2.2](https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2)
- [Deque: WCAG 2.2 updates](https://dequeuniversity.com/resources/wcag-2.2)
- [web.dev: Animation and motion](https://web.dev/learn/accessibility/motion)
- [PubMed 19468085: vestibular dysfunction prevalence, NHANES 2001–2004](https://pubmed.ncbi.nlm.nih.gov/19468085)
- [A11y Project: Understanding vestibular disorders](https://a11yproject.com/posts/understanding-vestibular-disorders/)
- [Material Design 2: Dark theme](https://m2.material.io/design/color/dark-theme)

**Fonts and China reachability**
- [Fontsource: Newsreader](https://fontsource.org/fonts/newsreader/about)
- [Production Type: Newsreader](https://productiontype.com/family/newsreader)
- [Fontsource: Atkinson Hyperlegible Next](https://fontsource.org/fonts/atkinson-hyperlegible-next/about)
- [Fontsource: Atkinson Hyperlegible Mono](https://fontsource.org/fonts/atkinson-hyperlegible-mono/about)
- [Vercel: Geist font (considered, rejected)](https://github.com/vercel/geist-font)
- [IBM Plex (considered, rejected)](https://github.com/IBM/plex)
- [Chinafy: Fixing font loading issues in China](https://www.chinafy.com/blog/how-to-fix-font-loading-issues-in-china)
- [AppInChina: Does Google Fonts work in China?](https://appinchina.co/does-google-fonts-api-work-in-china)
