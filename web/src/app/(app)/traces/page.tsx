"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ReplayBadge,
  ScriptedBadge,
  ControlledBadge,
  SimulatedBadge,
} from "@/components/Badges";
import {
  formatUSDC,
  formatTimestamp,
  truncateHash,
} from "@/lib/format";

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Segmented, Chip, Skeleton, Empty, Hash, Stamp } from '@/components/ui';
import { CheckGlyph, ClockGlyph, CrossGlyph } from '@/components/site/Glyphs';

interface RunItem {
  runId: string;
  source: string;
  timestamp?: number;
  stepCount: number;
  filePath: string;
}

interface TraceStep {
  scenarioId?: string;
  stepIndex?: number;
  timestamp?: number;
  runIndex?: number;
  policyDecision?: {
    tier: string;
    reasons: string[];
  };
  receiptStatus?: string;
  decodedErrors?: string[];
  execution?: {
    proposed?: boolean;
    proposal?: {
      vendorId?: string;
      invoiceNumber?: string;
      amount?: string;
      rationale?: string;
    };
    signed?: boolean;
    receiptStatus?: string;
    policyDecision?: {
      tier?: string;
      reasons?: string[];
    };
    executedPayment?: {
      vendorId?: string;
      invoiceNumber?: string;
      amount?: string;
      tier?: string;
      txHash?: string;
    };
  };
  // Fallbacks
  vendorId?: string;
  invoiceNumber?: string;
  amount?: string;
  txHash?: string;
}

function TracesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [runs, setRuns] = useState<RunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [expandedJson, setExpandedJson] = useState<Record<number, boolean>>({});

  // 1. Fetch runs list
  useEffect(() => {
    async function fetchRuns() {
      try {
        setLoadingRuns(true);
        const res = await fetch("/api/traces");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const runsList = data.runs || [];
        setRuns(runsList);

        const initialRun = searchParams.get("runId") || runsList[0]?.runId || "";
        if (initialRun) {
          setSelectedRunId(initialRun);
        }
      } catch (err) {
        console.error("Failed to load runs:", err);
      } finally {
        setLoadingRuns(false);
      }
    }
    fetchRuns();
  }, [searchParams]);

  // 2. Fetch specific run steps when selectedRunId changes
  useEffect(() => {
    if (!selectedRunId) return;

    async function fetchSteps() {
      try {
        setLoadingSteps(true);
        const res = await fetch(`/api/traces?runId=${encodeURIComponent(selectedRunId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSteps(data.steps || []);
      } catch (err) {
        console.error("Failed to fetch run steps:", err);
        setSteps([]);
      } finally {
        setLoadingSteps(false);
      }
    }
    fetchSteps();
  }, [selectedRunId]);

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    router.replace(`/traces?runId=${encodeURIComponent(runId)}`, { scroll: false });
  };

  const filteredSteps = useMemo(() => {
    if (tierFilter === "ALL") return steps;
    return steps.filter((step) => {
      const tier = step.policyDecision?.tier || step.execution?.policyDecision?.tier || "";
      return tier.toUpperCase() === tierFilter;
    });
  }, [steps, tierFilter]);

  const selectedRun = runs.find((r) => r.runId === selectedRunId);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(230px,1fr)_minmax(0,3fr)] items-start">
      <Panel title={`Runs (${runs.length})`} kicker="evidence/transcripts">
        {loadingRuns ? (
          <div className="stack-sm">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} h={54} />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <Empty>No runs recorded yet.</Empty>
        ) : (
          <ul className="runlist">
            {runs.map((r) => {
              const isSelected = r.runId === selectedRunId;
              return (
                <li key={r.runId}>
                  <button type="button" className={`runitem${isSelected ? ' is-on' : ''}`} aria-pressed={isSelected} onClick={() => handleSelectRun(r.runId)}>
                    <strong>{r.runId}</strong>
                    <span>
                      {r.stepCount} steps · {r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'local'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="stack">
        <Panel>
          <div className="toolbar">
            <div className="min-w-0">
              <p className="eyebrow">Viewing run</p>
              <p className="toolbar__title">{selectedRunId || 'None selected'}</p>
              <p className="muted small trunc">{selectedRun?.filePath || 'evidence/transcripts/…'}</p>
            </div>
            <Segmented label="Filter by decision" value={tierFilter} onChange={setTierFilter} options={[{ value: 'ALL', label: 'All' }, { value: 'T1', label: 'T1' }, { value: 'T2', label: 'T2' }, { value: 'REJECT', label: 'Rejected' }]} />
          </div>
        </Panel>

        {loadingSteps ? (
          <div className="stack">
            {[1, 2, 3].map((i) => (
              <Panel key={i}>
                <Skeleton h={120} />
              </Panel>
            ))}
          </div>
        ) : filteredSteps.length === 0 ? (
          <Panel>
            <Empty>No steps match &ldquo;{tierFilter}&rdquo; in this run.</Empty>
          </Panel>
        ) : (
          <div className="stack">
            {filteredSteps.map((step, idx) => {
              const stepNum = step.stepIndex || idx + 1;
              const scenario = step.scenarioId || `step-${stepNum}`;
              const tier = (step.policyDecision?.tier || step.execution?.policyDecision?.tier || '').toUpperCase();
              const reasons = step.policyDecision?.reasons || step.execution?.policyDecision?.reasons || [];
              const proposal = step.execution?.proposal;
              const vendor = proposal?.vendorId || step.vendorId;
              const invoice = proposal?.invoiceNumber || step.invoiceNumber;
              const amount = proposal?.amount || step.amount;
              const receiptStatus = step.receiptStatus || step.execution?.receiptStatus;
              const decodedErrors = step.decodedErrors || [];
              const isExecuted = receiptStatus === 'EXECUTED' || receiptStatus === 'APPROVED_BY_POLICY';
              const isReverted = receiptStatus === 'REVERTED' || decodedErrors.length > 0;
              const fundsMoved = isExecuted && tier === 'T1';
              const txHash = step.execution?.executedPayment?.txHash || step.txHash;
              const isJsonOpen = Boolean(expandedJson[idx]);
              const kind = tier === 'T1' ? 'paid' : tier === 'T2' ? 'held' : tier ? 'blocked' : 'unknown';

              return (
                <article key={`${scenario}-${idx}`} className={`stepcard stepcard--${kind}`}>
                  <header className="stepcard__head">
                    <div>
                      <p className="eyebrow">Step {stepNum}</p>
                      <h3 className="stepcard__title">{scenario}</h3>
                      {step.timestamp && <p className="muted small">{formatTimestamp(step.timestamp)}</p>}
                    </div>
                    {kind === 'paid' && <Chip tone="moved"><CheckGlyph /> T1 · pays automatically</Chip>}
                    {kind === 'held' && <Chip tone="held"><ClockGlyph /> T2 · waits for owner</Chip>}
                    {kind === 'blocked' && <Chip tone="blocked"><CrossGlyph /> Rejected</Chip>}
                    {kind === 'unknown' && <Chip>Decision not recorded</Chip>}
                  </header>

                  <dl className="facts4">
                    <div>
                      <dt>1 Proposed</dt>
                      <dd>
                        <strong>{vendor || 'Not recorded'}</strong>
                        <span>{invoice || 'Invoice not recorded'}</span>
                        <span className="fig">{amount ? formatUSDC(amount) : 'Amount not recorded'}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>2 Decided</dt>
                      <dd>
                        <strong>{kind === 'paid' ? 'Pays automatically' : kind === 'held' ? 'Waits for the owner' : kind === 'blocked' ? 'Rejected' : 'Not recorded'}</strong>
                        <span className="codes">
                          {reasons.length > 0 ? reasons.map((r: string, ri: number) => <code key={ri}>{r}</code>) : <span>No reasons recorded</span>}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>3 Contract</dt>
                      <dd>
                        <strong>{receiptStatus || 'Not recorded'}</strong>
                        {isExecuted ? (
                          <span>PaymentExecuted event matched</span>
                        ) : isReverted ? (
                          <span>Reverted: {decodedErrors.join(', ') || 'by the contract'}</span>
                        ) : (
                          <span>{receiptStatus ? 'Blocked before the contract' : '—'}</span>
                        )}
                        {txHash ? <Hash value={txHash} /> : <span className="muted">No receipt recorded</span>}
                      </dd>
                    </div>
                    <div>
                      <dt>4 Funds</dt>
                      <dd>
                        <strong>{fundsMoved ? 'Moved' : receiptStatus ? 'Did not move' : 'Not recorded'}</strong>
                        <span className="fig">{fundsMoved ? (amount ? formatUSDC(amount) : 'Amount not recorded') : receiptStatus ? '$0.00' : ''}</span>
                      </dd>
                    </div>
                  </dl>

                  <button type="button" className="disclose" aria-expanded={isJsonOpen} onClick={() => setExpandedJson((prev) => ({ ...prev, [idx]: !prev[idx] }))}>
                    {isJsonOpen ? 'Hide raw trace JSON' : 'Show raw trace JSON'}
                  </button>
                  {isJsonOpen && <pre className="jsonbox">{JSON.stringify(step, null, 2)}</pre>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TracesPage() {
  return (
    <div className="stack">
      <PageHeader
        eyebrow="Prove"
        title="Traces"
        lede="Every invoice the agent looked at: what it proposed, what the policy decided, what the contract did, and whether money moved."
        actions={
          <>
            <ReplayBadge />
            <ScriptedBadge />
          </>
        }
      />
      <Suspense
        fallback={
          <Panel>
            <Skeleton h={160} />
          </Panel>
        }
      >
        <TracesContent />
      </Suspense>
    </div>
  );

}
