import React from "react";
import { formatUSDC } from "@/lib/format";
import { AGENT_IDS, REGIME_IDS, getCell, loadSiteEvidence } from "@/lib/siteEvidence";
import { ExperimentView, type ExperimentCell, type HypothesisRow } from "./ExperimentView";
import { PageHeader, Panel, Stamp } from "@/components/ui";

// The numbers come from the committed experiment summary at request time, never from constants here.
export const dynamic = "force-dynamic";

export default function ExperimentPage() {
  const ev = loadSiteEvidence();

  if (!ev) {
    return (
      <div className="stack">
        <PageHeader eyebrow="Prove" title="Experiment" lede="Nine recorded runs: three agents under three control regimes." />
        <Panel>
          <p>
            <Stamp kind="notrun" label="Not recorded" meaning="The experiment summary could not be read, so no figures are shown." /> The summary file{" "}
            <code>evidence/experiments/main-run/protocol-summary.json</code> could not be read.
          </p>
        </Panel>
      </div>
    );
  }

  // bigint cannot cross the server/client boundary, so money travels as base-unit strings.
  const cells: ExperimentCell[] = ev.cells.map((c) => ({
    agent: c.agent,
    regime: c.regime,
    automationRate: c.automationRate,
    automatedCount: c.automatedCount,
    benignTotal: c.benignTotal,
    reviewBurden: c.reviewBurden,
    classIExecuted: c.classIExecuted,
    classIILoss: c.classIILoss.toString(),
    bondPayout: c.bondPayout.toString(),
    netLoss: c.netLoss.toString(),
  }));

  const r0 = (a: (typeof AGENT_IDS)[number]) => formatUSDC(getCell(ev, a, "R0").netLoss);
  const g2 = getCell(ev, "gamma", "R2");
  const rows: HypothesisRow[] = [
    {
      key: "h1",
      title: "Safety floor",
      ok: ev.hypotheses.h1SafetyFloor,
      yes: "Confirmed",
      no: "Not confirmed",
      text: `Out-of-bounds payments executed with fixed caps or UNDERWRITE (R1, R2): ${ev.classIExecutedUnderLimits}. With no limits (R0) the naive script executed ${getCell(ev, "alpha", "R0").classIExecuted}.`,
    },
    {
      key: "h2",
      title: "Calibration",
      ok: ev.hypotheses.h2Calibration,
      yes: "Confirmed",
      no: "Not confirmed",
      text: "Realized error rates stayed within the exam's statistical upper bounds.",
    },
    {
      key: "h3",
      title: "Discrimination",
      ok: ev.hypotheses.h3Discrimination,
      yes: "Confirmed",
      no: "Not confirmed",
      text: `With no limits (R0), net loss tracks agent quality: hardened ${r0("gamma")}, basic ${r0("beta")}, naive ${r0("alpha")}.`,
    },
    {
      key: "h4",
      title: "Distribution shift",
      ok: ev.hypotheses.h4DistributionShift,
      yes: "Documented",
      no: "Not documented",
      text: `On the blind set one unseen attack still got past the hardened agent under UNDERWRITE (${formatUSDC(g2.classIILoss)}). Exam bounds describe the exam, not every future attack.`,
    },
    {
      key: "mech",
      title: "Mechanism check",
      ok: ev.hypotheses.mechanismCheck,
      yes: "Passed",
      no: "Not passed",
      text: `A loss claim was repaid ${formatUSDC(g2.bondPayout)} from the bond and the agent's authority was revoked in the same transaction.`,
    },
  ];

  return (
    <ExperimentView
      streamSize={ev.streamSize}
      benignTotal={ev.benignTotal}
      classITotal={ev.classITotal}
      classIITotal={ev.classIITotal}
      sourcePath={ev.sourcePath}
      cells={cells}
      hypotheses={rows}
      agents={[...AGENT_IDS]}
      regimes={[...REGIME_IDS]}
    />
  );
}
