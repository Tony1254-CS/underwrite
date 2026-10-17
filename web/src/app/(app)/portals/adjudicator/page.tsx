'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PortalGuard } from '@/components/PortalGuard';
import { formatUSDC, truncateHash } from '@/lib/format';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Chip, Notice, Empty, Hash, Modal, Stamp, useNewKeys } from '@/components/ui';

/** Approving a claim is irreversible (payout and revocation in one transaction), so it asks first. */
function ApproveClaim({ claim, busy, onApprove }: { claim: any; busy: boolean; onApprove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn--lime" disabled={busy} onClick={() => setOpen(true)}>
        Approve and revoke
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Approve claim #${claim.id}?`}>
        <p className="modal__text">
          In one transaction the bond pays <strong>{formatUSDC(claim.payout)}</strong> to the vault (the loss of {formatUSDC(claim.lossAmount)} less the deductible), and the agent&rsquo;s qualification is revoked. Its next payment will be refused. This cannot be undone.
        </p>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--lime"
            onClick={() => {
              setOpen(false);
              onApprove();
            }}
          >
            Approve and revoke
          </button>
        </div>
      </Modal>
    </>
  );
}

function Settled({ claims }: { claims: any[] }) {
  const fresh = useNewKeys(claims.map((c) => c.id));
  if (claims.length === 0) return <Empty>No claims have been settled yet.</Empty>;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Claim</th>
            <th scope="col">Payment</th>
            <th scope="col">Loss</th>
            <th scope="col">Repaid</th>
            <th scope="col">Status</th>
            <th scope="col">Consequence</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id} className={fresh.has(String(c.id)) ? 'is-new' : ''}>
              <th scope="row" data-label="Claim">#{c.id}</th>
              <td data-label="Payment">Payment #{c.paymentId}</td>
              <td data-label="Loss" className="fig">{formatUSDC(c.lossAmount)}</td>
              <td data-label="Repaid" className="fig">{formatUSDC(c.payout)}</td>
              <td data-label="Status"><Chip tone={c.status === 'APPROVED' ? 'moved' : 'blocked'}>{c.status}</Chip></td>
              <td data-label="Consequence">{c.consequenceSummary || 'Settled on the chain.'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdjudicatorPortalPage() {
  return (
    <PortalGuard requiredRole="ADJUDICATOR" portalName="Claims Adjudication & Dispute Portal">
      <AdjudicatorPortalContent />
    </PortalGuard>
  );
}

function AdjudicatorPortalContent() {
  const { user, isAdjudicator, switchRole } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [adjudicatingId, setAdjudicatingId] = useState<number | null>(null);

  const fetchClaimsData = async () => {
    try {
      const res = await fetch('/api/claims');
      const json = await res.json();
      if (json.success && json.claims) {
        setClaims(json.claims);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimsData();
    const interval = setInterval(fetchClaimsData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAdjudicate = async (claimId: number, approve: boolean) => {
    try {
      setAdjudicatingId(claimId);
      setActionMsg(`Dispatching atomic ${approve ? 'approveClaim' : 'rejectClaim'} for Claim #${claimId}...`);

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
      if (!res.ok || !json.success) throw new Error(json.error);

      setActionMsg(json.consequence || `Claim #${claimId} adjudicated successfully.`);
      await fetchClaimsData();
      setTimeout(() => setActionMsg(null), 6000);
    } catch (err: any) {
      setActionMsg(`Adjudication Error: ${err.message}`);
    } finally {
      setAdjudicatingId(null);
    }
  };

  const pendingClaims = claims.filter((c) => c.status === 'PENDING');
  const settledClaims = claims.filter((c) => c.status !== 'PENDING');

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Qualify"
        title="Adjudication desk"
        lede="Check the evidence the owner filed, apply the policy terms, and decide. Approving pays the vault from the bond and revokes the agent's limit in one transaction."
        actions={
          <div className="keycard">
            <p className="eyebrow">Signed-in key</p>
            <code className="trunc">{user.address}</code>
            {!isAdjudicator && (
              <button type="button" className="btn btn--lime btn--sm" onClick={() => switchRole('ADJUDICATOR')}>
                Switch to the adjudicator key
              </button>
            )}
          </div>
        }
      />

      {actionMsg && <Notice tone={/Error/.test(actionMsg) ? 'bad' : 'ok'}>{actionMsg}</Notice>}

      <Panel
        title="Waiting for a decision"
        kicker="Pending claims"
        actions={
          <>
            <Chip tone={pendingClaims.length ? 'held' : 'neutral'}>{pendingClaims.length} open</Chip>
            <Stamp kind="controlled" label="Designated key" meaning="In this prototype the adjudicator is a designated key." />
          </>
        }
      >
        {pendingClaims.length === 0 ? (
          <Empty>
            No claims are waiting. The owner can file one from the{' '}
            <Link href="/portals/owner" className="text-link">owner inbox</Link>.
          </Empty>
        ) : (
          <ul className="holds">
            {pendingClaims.map((claim) => (
              <li key={claim.id} className="hold">
                <div className="hold__top">
                  <div>
                    <p className="eyebrow">Claim #{claim.id}</p>
                    <p className="hold__who">Payment #{claim.paymentId}</p>
                    <p className="muted small">
                      Evidence <Hash value={claim.evidenceHash} start={12} end={8} />
                    </p>
                  </div>
                  <dl className="hold__nums">
                    <div>
                      <dt>Claimed loss</dt>
                      <dd className="fig">{formatUSDC(claim.lossAmount)}</dd>
                    </div>
                    <div>
                      <dt>Net payout</dt>
                      <dd className="fig">{formatUSDC(claim.payout)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="hold__foot">
                  <span className="muted small">After the deductible. This will revoke the agent&rsquo;s qualification.</span>
                  <span className="rowactions">
                    <ApproveClaim
                      claim={claim}
                      busy={adjudicatingId === (claim.claimId || parseInt(claim.id, 10))}
                      onApprove={() => handleAdjudicate(claim.claimId || parseInt(claim.id, 10), true)}
                    />
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={adjudicatingId === (claim.claimId || parseInt(claim.id, 10))}
                      onClick={() => handleAdjudicate(claim.claimId || parseInt(claim.id, 10), false)}
                    >
                      Dismiss
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Settled claims" kicker="Settlement and revocation registry">
        <Settled claims={settledClaims} />
      </Panel>
    </div>
  );

}
