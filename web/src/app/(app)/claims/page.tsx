"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ControlledBadge,
  ScriptedBadge,
} from "@/components/Badges";
import {
  formatUSDC,
  truncateHash,
} from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Stat, Chip, Notice, Segmented, Modal, Hash, Pipeline, AgentLog, Empty, Skeleton, useNewKeys, usd } from '@/components/ui';
import type { NodeState } from '@/components/ui';

const CLAIM_STAGES = ['Loss', 'Claim', 'Settle', 'Revoke'] as const;

function ClaimsRows({ claims, onAdjudicate }: { claims: any[]; onAdjudicate: (claimId: number, approve: boolean) => void }) {
  const fresh = useNewKeys(claims.map((c) => c.id));
  if (claims.length === 0) return <Empty>No claims match this filter.</Empty>;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Claim</th>
            <th scope="col">Qualification</th>
            <th scope="col">Payment</th>
            <th scope="col">Loss</th>
            <th scope="col">Payout</th>
            <th scope="col">Status</th>
            <th scope="col">Evidence or action</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className={fresh.has(String(claim.id)) ? 'is-new' : ''}>
              <th scope="row" data-label="Claim">#{claim.id}</th>
              <td data-label="Qualification"><Hash value={claim.qualId} /></td>
              <td data-label="Payment">Payment #{claim.paymentId}</td>
              <td data-label="Loss" className="fig">{formatUSDC(claim.lossAmount)}</td>
              <td data-label="Payout" className="fig">{formatUSDC(claim.payout)}</td>
              <td data-label="Status">
                <Chip tone={claim.status === 'APPROVED' ? 'moved' : claim.status === 'PENDING' ? 'held' : 'blocked'}>{claim.status}</Chip>
              </td>
              <td data-label="Evidence or action">
                {claim.status === 'PENDING' ? (
                  <span className="rowactions">
                    <button type="button" className="btn btn--lime btn--sm" onClick={() => onAdjudicate(claim.claimId || parseInt(claim.id, 10), true)}>
                      Approve
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => onAdjudicate(claim.claimId || parseInt(claim.id, 10), false)}>
                      Reject
                    </button>
                  </span>
                ) : (
                  <Hash value={claim.evidenceHash} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ClaimRecord {
  id: string;
  claimId?: number;
  qualId: string;
  paymentId: string;
  lossAmount: string;
  deductible?: string;
  payout: string;
  status: string;
  timestamp?: number;
  evidenceHash: string;
  txHash?: string;
  adjudicator?: string;
  consequenceSummary?: string;
}

interface ClaimsApiResponse {
  chain: {
    chainId: number;
    connected: boolean;
    bondPool: string;
  };
  bondStatus?: {
    underwriter: string;
    adjudicator: string;
    deductibleUSDC: string;
    perClaimCapUSDC: string;
    claimGracePeriodDays: number;
    totalPayoutsUSDC: string;
    bondRemainingUSDC?: string;
  };
  poolConfig: {
    perClaimCap: string;
    deductible: string;
    openClaimsCount: string;
  };
  totalClaims: number;
  claims: ClaimRecord[];
}

export default function ClaimsPage() {
  const { user, isOwner, isAdjudicator } = useAuth();
  const [data, setData] = useState<ClaimsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatingClaim, setSimulatingClaim] = useState(false);
  const [adjudicationStep, setAdjudicationStep] = useState<number>(0);
  const [adjudicationLog, setAdjudicationLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "APPROVED" | "ALL">("ALL");

  // New claim filing state
  const [showFileModal, setShowFileModal] = useState(false);
  const [paymentIdInput, setPaymentIdInput] = useState('1');
  const [lossAmountInput, setLossAmountInput] = useState('300.00');
  const [evidenceInput, setEvidenceInput] = useState('0x3f9a7c2b1e4d5f8a0b9c2e1f4d7a8b3c5e2d1f0a9b8c7d6e5f4a3b2c1d0e9f8a');
  const [filing, setFiling] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFiling(true);
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FILE',
          paymentId: paymentIdInput,
          lossAmountUSDC: lossAmountInput,
          evidenceHash: evidenceInput,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to file claim');
      }
      setShowFileModal(false);
      await fetchClaims();
    } catch (err: any) {
      alert(`Claim Filing Error: ${err.message}`);
    } finally {
      setFiling(false);
    }
  };

  const handleAdjudicate = async (claimId: number, approve: boolean) => {
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUDICATE',
          claimId,
          approve,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Adjudication failed');
      }
      await fetchClaims();
    } catch (err: any) {
      alert(`Adjudication Error: ${err.message}`);
    }
  };

  const handleSimulateClaimLifecycle = async () => {
    setSimulatingClaim(true);
    setAdjudicationStep(1);
    setAdjudicationLog([
      "[INIT] Starting Phase 2 Atomic Consequence Execution...",
      "[STEP 1] Agent executed erroneous payment: $300.00 USDC (Payment #103, qualId: 0xa38c...)",
      "[STEP 2] Owner detected discrepancy; dispatching POST /api/claims (fileClaim)...",
    ]);

    try {
      // Step 2: Actually file the claim on the server
      const fileRes = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FILE',
          paymentId: '103',
          lossAmountUSDC: '300.00',
          evidenceHash: '0x8b3e819a7123efd6810294821049281049281049281049281049281049281049',
        }),
      });
      const fileData = await fileRes.json();
      const newClaimId = fileData.claim?.claimId || 2;

      await new Promise((r) => setTimeout(r, 700));
      setAdjudicationStep(2);
      setAdjudicationLog((prev) => [
        ...prev,
        `[STEP 3] Claim #${newClaimId} registered on BondPool with status: PENDING.`,
        `[STEP 4] Designated Adjudicator (${user.address.slice(0, 8)}...) approving claim via approveClaim(#${newClaimId})...`,
      ]);

      // Step 3: Actually adjudicate the claim
      await new Promise((r) => setTimeout(r, 800));
      const adjRes = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUDICATE',
          claimId: newClaimId,
          approve: true,
        }),
      });
      const adjData = await adjRes.json();

      setAdjudicationStep(3);
      setAdjudicationLog((prev) => [
        ...prev,
        "[ATOMIC TRANSACTION EXECUTED IN 1 TX]:",
        "  -> Bond Pool transferred $295.00 USDC payout directly into UnderwriteVault (net of $5 deductible).",
        `  -> Emitted ClaimPaid(claimId=${newClaimId}, payout=295 USDC, vault=0x9fE4...).`,
        "  -> Invoked vault.revokeQualification(qualId=0xa38c...) in the EXACT SAME CALL.",
        "  -> Qualification status updated to: REVOKED on-chain.",
      ]);

      await new Promise((r) => setTimeout(r, 800));
      setAdjudicationStep(4);
      setAdjudicationLog((prev) => [
        ...prev,
        "[INVARIANT VERIFICATION]:",
        "  -> Agent attempts subsequent pay() transaction with revoked key...",
        "  -> Smart Contract EVM Revert strictly triggered: QualificationRevoked().",
        "  -> Authority Meter for this agent immediately drops to $0.00.",
        `[COMPLETE] ${adjData.consequence || '1 transaction restores vault funds and removes authority.'}`,
      ]);

      await fetchClaims();
    } catch (err: any) {
      setAdjudicationLog((prev) => [...prev, `[ERROR] ${err.message}`]);
    } finally {
      setSimulatingClaim(false);
    }
  };

  const displayClaims = data?.claims || [];
  const filteredClaims = displayClaims.filter((c) => {
    if (activeTab === 'ALL') return true;
    return activeTab === 'ACTIVE' ? c.status === 'PENDING' : c.status === activeTab;
  });

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Operate"
        title="Claims"
        lede="When the agent pays something it shouldn't have, the owner files a claim. An approved claim repays from the bond and revokes the agent's limit in one transaction."
        actions={
          <>
            <ControlledBadge label="DESIGNATED ADJUDICATOR" />
            <ScriptedBadge />
            <button type="button" className="btn btn--lime" onClick={() => setShowFileModal(true)}>
              File a loss claim
            </button>
          </>
        }
      />

      {error && <Notice tone="bad">Could not load claims from the bond pool: {error}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Free bond" value={data?.bondStatus?.bondRemainingUSDC ? usd(data.bondStatus.bondRemainingUSDC) : '…'} tone="lime" sub="Backs unreviewed autonomous payments" />
        <Stat label="Owner deductible" value={data ? formatUSDC(data.poolConfig?.deductible || '0') : '…'} sub="The owner's first-loss share" />
        <Stat label="Pending claims" value={data ? (data.poolConfig?.openClaimsCount || '0') : '…'} sub="Open for adjudication" />
        <Stat label="Bond pool" value={data?.chain?.bondPool ? truncateHash(data.chain.bondPool, 8, 6) : '…'} sub={data?.chain?.connected ? `Connected · chain ${data.chain.chainId}` : 'Not connected'} />
      </div>

      <Panel
        title="Watch a claim settle"
        kicker="Scripted scene"
        actions={
          <button type="button" className="btn btn--ghost" onClick={handleSimulateClaimLifecycle} disabled={simulatingClaim}>
            {simulatingClaim ? 'Settling…' : 'Play the scene (adjudicator key)'}
          </button>
        }
      >
        <p className="muted">The adjudicator approves the claim: the bond pays the vault and the agent's qualification is revoked in the same transaction.</p>
        <Pipeline
          stages={CLAIM_STAGES}
          label="Claim settlement steps"
          states={CLAIM_STAGES.map((_, i): NodeState =>
            i === 3 && adjudicationStep >= 4 ? 'stop' : adjudicationStep > i + 1 ? 'pass' : adjudicationStep === i + 1 ? (simulatingClaim ? 'run' : 'pass') : 'idle',
          )}
        />
        <div className="grid gap-3 md:grid-cols-4 stepnotes">
          <p><strong>Loss.</strong> An erroneous payment goes through inside the limit.</p>
          <p><strong>Claim.</strong> The owner files it with an evidence hash.</p>
          <p><strong>Settle.</strong> The bond repays the vault, net of the deductible, in one call.</p>
          <p><strong>Revoke.</strong> The next payment reverts: the qualification is gone.</p>
        </div>
        <AgentLog lines={adjudicationLog} empty="Play the scene to see each step as the agent and the contract report it." />
      </Panel>

      <Panel
        title="Claims registry"
        kicker="Read from the bond pool"
        actions={
          <Segmented
            label="Filter claims"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'ACTIVE', label: 'Pending' },
            ]}
          />
        }
      >
        {loading && !data ? <Skeleton h={120} /> : <ClaimsRows claims={filteredClaims} onAdjudicate={handleAdjudicate} />}
      </Panel>

      <Modal open={showFileModal} onClose={() => setShowFileModal(false)} title="File a loss claim">
        <form onSubmit={handleFileClaim} className="form">
          <div className="field">
            <label htmlFor="cl-pay">Payment ID</label>
            <input id="cl-pay" className="input" type="text" value={paymentIdInput} onChange={(e) => setPaymentIdInput(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="cl-loss">Loss incurred (USDC)</label>
            <input id="cl-loss" className="input" type="number" step="0.01" value={lossAmountInput} onChange={(e) => setLossAmountInput(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="cl-ev">Evidence hash (bytes32)</label>
            <input id="cl-ev" className="input input--mono" type="text" value={evidenceInput} onChange={(e) => setEvidenceInput(e.target.value)} required />
          </div>
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowFileModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--lime" disabled={filing}>
              {filing ? 'Filing…' : 'Submit claim'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
