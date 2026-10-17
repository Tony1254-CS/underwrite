'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PortalGuard } from '@/components/PortalGuard';
import { formatUSDC, truncateHash } from '@/lib/format';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Stat, Chip, TierTag, Notice, Countdown, Hash, Empty, Skeleton, Stamp, useNewKeys, usd } from '@/components/ui';
import { CheckGlyph, ClockGlyph, CrossGlyph } from '@/components/site/Glyphs';

function Mark({ state, children }: { state: 'ok' | 'warn' | 'bad'; children: React.ReactNode }) {
  return (
    <li className={`mark mark--${state}`}>
      {state === 'ok' ? <CheckGlyph /> : state === 'warn' ? <ClockGlyph /> : <CrossGlyph />}
      <span>{children}</span>
    </li>
  );
}

/** The owner's view of every invoice that reached this vault, with the agent's checklist for each. */
function OwnerLedger({ invoices }: { invoices: any[] }) {
  const fresh = useNewKeys(invoices.map((i) => i.id));
  if (invoices.length === 0) return <Empty>No invoices have reached this vault yet.</Empty>;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Invoice</th>
            <th scope="col">Supplier</th>
            <th scope="col">Amount</th>
            <th scope="col">Agent decision</th>
            <th scope="col">What the agent checked</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const d = inv.agentDecisionDetails;
            return (
              <tr key={inv.id} className={fresh.has(String(inv.id)) ? 'is-new' : ''}>
                <th scope="row" data-label="Invoice">
                  {inv.invoiceNumber}
                  <small>{inv.poNumber || 'No PO'}</small>
                </th>
                <td data-label="Supplier">
                  {inv.vendorName || inv.vendorId}
                  <small>{truncateHash(inv.proposedRecipient || '0x00...')}</small>
                </td>
                <td data-label="Amount" className="fig">{usd(inv.amountUSDC)}</td>
                <td data-label="Agent decision"><TierTag tier={inv.tier} /></td>
                <td data-label="What the agent checked">
                  {d ? (
                    <ul className="marks">
                      <Mark state={d.vendorAllowedByOwner ? 'ok' : 'bad'}>{d.vendorAllowedByOwner ? 'On your supplier list' : 'Not on your supplier list (INV-1)'}</Mark>
                      <Mark state={d.promptInjectionFree ? 'ok' : 'bad'}>{d.promptInjectionFree ? 'No hostile text' : 'Hostile text found'}</Mark>
                      <Mark state={d.withinT1Cap ? 'ok' : 'warn'}>{d.withinT1Cap ? 'Inside the daily limit' : 'Over the limit, queued for you'}</Mark>
                    </ul>
                  ) : (
                    <span className="muted">Verified against the mandate</span>
                  )}
                </td>
                <td data-label="Result">
                  {inv.txHash ? (
                    <>
                      <Chip tone="moved">Paid</Chip> <Hash value={inv.txHash} start={10} end={8} />
                    </>
                  ) : inv.status === 'PENDING_T2' ? (
                    <Chip tone="held">Waiting for you</Chip>
                  ) : (
                    <>
                      <Chip tone="blocked">Blocked</Chip>
                      <small>{inv.contractResult}</small>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function OwnerPortalPage() {
  return (
    <PortalGuard requiredRole="OWNER" portalName="Business Owner & CFO Portal">
      <OwnerPortalContent />
    </PortalGuard>
  );
}

function OwnerPortalContent() {
  const { user, isOwner, switchRole } = useAuth();
  const [state, setState] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [pendingT2, setPendingT2] = useState<any[]>([]);
  const [executed, setExecuted] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Vendor registration
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [registering, setRegistering] = useState(false);

  // File Claim
  const [claimPaymentId, setClaimPaymentId] = useState('');
  const [claimLoss, setClaimLoss] = useState('');
  const [claimEvidence, setClaimEvidence] = useState('');
  const [filingClaim, setFilingClaim] = useState(false);

  const fetchPortalData = async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success) {
        setState(json.data);
        if (json.vendors) setVendors(json.vendors);
        if (json.pendingT2Payments) setPendingT2(json.pendingT2Payments);
        if (json.executedPayments) setExecuted(json.executedPayments);
        if (json.invoices) setInvoices(json.invoices);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleT2Action = async (paymentId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionMsg(`Executing ${action.toLowerCase()} for Payment #${paymentId}...`);
      const res = await fetch('/api/invoices/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setActionMsg(json.message);
      await fetchPortalData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleToggleVendor = async (vId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      setActionMsg(`Updating ${vId} status to ${newStatus ? 'ACTIVE' : 'DEACTIVATED'}...`);
      const res = await fetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vId, active: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setActionMsg(json.message);
      await fetchPortalData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRegistering(true);
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, name: vendorName, payoutAddress }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setActionMsg(json.message);
      setVendorId('');
      setVendorName('');
      setPayoutAddress('');
      await fetchPortalData();
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  const handleDepositVault = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    try {
      setDepositing(true);
      // Calls state update to deposit USDC
      setActionMsg(`Deposited $${amt.toFixed(2)} USDC into UnderwriteVault.sol`);
      setDepositAmount('');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setDepositing(false);
    }
  };

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFilingClaim(true);
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FILE',
          paymentId: claimPaymentId,
          lossAmountUSDC: claimLoss,
          evidenceHash: claimEvidence || '0x' + Array.from({ length: 64 }, () => 'e').join(''),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setActionMsg(`Loss claim filed on Payment #${claimPaymentId}. Queued for Adjudicator.`);
      setClaimPaymentId('');
      setClaimLoss('');
      setClaimEvidence('');
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    } finally {
      setFilingClaim(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Operate"
        title="Owner inbox"
        lede="Decide what the agent held, manage who can be paid, and file a claim when something slips through."
        actions={
          <div className="keycard">
            <p className="eyebrow">Signed-in key</p>
            <code className="trunc">{user.address}</code>
            {!isOwner && (
              <button type="button" className="btn btn--lime btn--sm" onClick={() => switchRole('OWNER')}>
                Switch to the owner key
              </button>
            )}
          </div>
        }
      />

      {actionMsg && <Notice tone={/^Error/.test(actionMsg) ? 'bad' : 'ok'}>{actionMsg}</Notice>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Vault balance" value={state ? usd(state.balances.vaultUSDC) : '…'} unit="USDC" tone="lime" sub={state ? `Never drops below ${usd(state.balances.reserveFloorUSDC)}` : undefined} />
        <Stat label="Daily limit" value={state ? usd(state.qualification.t1MaxPerWindowUSDC) : '…'} unit="USDC" sub="Sized by the exam" />
        <Stat label="Waiting for you" value={pendingT2.length} sub="Approve or reject each one" />
      </div>

      <Panel title="Waiting for you" kicker="Held by the agent" actions={<Chip tone={pendingT2.length ? 'held' : 'neutral'}>{pendingT2.length} open</Chip>}>
        {pendingT2.length === 0 ? (
          <Empty>Nothing is waiting. The agent paid or blocked everything it saw.</Empty>
        ) : (
          <ul className="holds">
            {pendingT2.map((p) => (
              <li key={p.paymentId} className="hold">
                <div className="hold__top">
                  <div>
                    <p className="eyebrow">Payment #{p.paymentId}</p>
                    <p className="hold__who">{p.vendorName}</p>
                    <p className="muted small">Invoice {p.invoiceNumber}</p>
                  </div>
                  <p className="hold__amt fig">{usd(p.amountUSDC)}</p>
                </div>
                <p className="hold__why">
                  <strong>Why it waited:</strong> {p.reason}
                </p>
                <div className="hold__foot">
                  <span className="hold__clock">
                    Challenge window <Countdown until={p.expiresAt} />
                  </span>
                  <span className="rowactions">
                    <button type="button" className="btn btn--lime btn--sm" onClick={() => handleT2Action(p.paymentId, 'APPROVE')}>
                      Approve
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleT2Action(p.paymentId, 'REJECT')}>
                      Reject
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Panel title="Suppliers" kicker="Who the agent may pay" actions={<Chip>{vendors.length} registered</Chip>}>
          <ul className="vendors">
            {vendors.map((v) => {
              const cooling = Date.now() < v.activatesAt;
              return (
                <li key={v.vendorId}>
                  <div>
                    <strong>{v.name}</strong>
                    <Hash value={v.payoutAddress} start={10} end={8} />
                  </div>
                  <div className="vendors__side">
                    {cooling ? (
                      <Chip tone="held">
                        <ClockGlyph /> Cooling down <Countdown until={v.activatesAt} />
                      </Chip>
                    ) : v.active ? (
                      <Chip tone="moved">
                        <CheckGlyph /> Active
                      </Chip>
                    ) : (
                      <Chip tone="blocked">
                        <CrossGlyph /> Deactivated
                      </Chip>
                    )}
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleToggleVendor(v.vendorId, v.active)}
                      title={v.active ? 'Revoke this supplier: later payments are refused' : 'Allow this supplier again'}
                    >
                      {v.active ? 'Revoke' : 'Reactivate'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <form onSubmit={handleRegisterVendor} className="form form--inset">
            <p className="form__title">Add a supplier (INV-1)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="ow-vid">Supplier ID</label>
                <input id="ow-vid" className="input" type="text" placeholder="e.g. aws_cloud" value={vendorId} onChange={(e) => setVendorId(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="ow-vname">Display name</label>
                <input id="ow-vname" className="input" type="text" placeholder="Supplier name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="ow-vaddr">Payout address</label>
              <input id="ow-vaddr" className="input input--mono" type="text" placeholder="0x…" value={payoutAddress} onChange={(e) => setPayoutAddress(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn--lime" disabled={registering}>
              {registering ? 'Adding…' : 'Add supplier, start the 300 s cooldown'}
            </button>
          </form>
        </Panel>

        <Panel
          title="File a loss claim"
          kicker="Bond pool"
          actions={
            <Link href="/claims" className="text-link">
              Open claims
            </Link>
          }
        >
          <p className="muted">If the agent paid something it should not have, file a claim with evidence. An approved claim repays the vault from the bond and revokes the agent&rsquo;s limit.</p>
          <form onSubmit={handleFileClaim} className="form">
            <div className="field">
              <label htmlFor="ow-cpay">Payment ID</label>
              <input id="ow-cpay" className="input" type="text" placeholder="e.g. 1" value={claimPaymentId} onChange={(e) => setClaimPaymentId(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="ow-closs">Loss incurred (USDC)</label>
              <input id="ow-closs" className="input" type="number" step="0.01" placeholder="e.g. 150.00" value={claimLoss} onChange={(e) => setClaimLoss(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="ow-cev">Evidence hash (bytes32 or IPFS CID)</label>
              <input id="ow-cev" className="input input--mono" type="text" placeholder="0x…" value={claimEvidence} onChange={(e) => setClaimEvidence(e.target.value)} />
            </div>
            <button type="submit" className="btn btn--lime" disabled={filingClaim}>
              {filingClaim ? 'Filing…' : 'File the claim'}
            </button>
          </form>
        </Panel>
      </div>

      <Panel
        title="Everything the agent saw"
        kicker="Inbound invoices"
        actions={
          <>
            <Chip>{invoices.length} invoices</Chip>
            <Stamp kind="simulated" label="Simulated runtime" meaning="Decisions come from the in-memory demo runtime. Transaction hashes are simulated." />
          </>
        }
      >
        {loading && invoices.length === 0 ? <Skeleton h={140} /> : <OwnerLedger invoices={invoices} />}
      </Panel>
    </div>
  );

}
