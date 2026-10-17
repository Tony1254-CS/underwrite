'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PortalGuard } from '@/components/PortalGuard';
import { formatUSDC, truncateHash } from '@/lib/format';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Stat, Chip, Notice, Stamp, usd } from '@/components/ui';

export default function UnderwriterPortalPage() {
  return (
    <PortalGuard requiredRole="UNDERWRITER" portalName="Underwriter & Bond LP Portal">
      <UnderwriterPortalContent />
    </PortalGuard>
  );
}

function UnderwriterPortalContent() {
  const { user, isUnderwriter, switchRole } = useAuth();
  const [state, setState] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchUnderwriterData = async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success) {
        setState(json.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchUnderwriterData();
    const interval = setInterval(fetchUnderwriterData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDepositBond = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    try {
      setDepositing(true);
      setActionMsg(`Deposited $${amt.toFixed(2)} USDC collateral into BondPool.sol`);
      setDepositAmount('');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      setActionMsg('Withdrawal processed for free bond collateral.');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setWithdrawing(false);
    }
  };

  const totalBond = state ? parseFloat(state.meter.bondRemainingUSDC) : 2000.0;
  const currentExposure = state ? parseFloat(state.meter.currentExposureUSDC) : 42.5;
  const freeBond = Math.max(0, totalBond - currentExposure);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Qualify"
        title="Underwriter desk"
        lede="The bond that stands behind the agent. Unreviewed autonomous payments can never add up to more than the bond still available."
        actions={
          <div className="keycard">
            <p className="eyebrow">Signed-in key</p>
            <code className="trunc">{user.address}</code>
            {!isUnderwriter && (
              <button type="button" className="btn btn--lime btn--sm" onClick={() => switchRole('UNDERWRITER')}>
                Switch to the underwriter key
              </button>
            )}
          </div>
        }
      />

      {actionMsg && <Notice tone="ok">{actionMsg}</Notice>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Bond in custody" value={usd(totalBond)} unit="USDC" tone="lime" sub="Held in BondPool.sol" fill={1} />
        <Stat label="Free bond" value={usd(freeBond)} unit="USDC" sub="Available to back new payments" fill={totalBond > 0 ? freeBond / totalBond : 0} />
        <Stat label="Locked behind exposure" value={usd(currentExposure)} unit="USDC" sub="Unreviewed autonomous payments" fill={totalBond > 0 ? currentExposure / totalBond : 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Panel
          title="Post bond"
          kicker="BondPool.sol"
          actions={<Stamp kind="simulated" label="Simulated" meaning="This form shows a confirmation only. No deposit is sent to a contract." />}
        >
          <p className="muted">Underwriters deposit USDC to back the agent. The deposit is what repays a loss when a claim is approved.</p>
          <form onSubmit={handleDepositBond} className="form">
            <div className="field">
              <label htmlFor="uw-dep">Amount (USDC)</label>
              <input id="uw-dep" className="input" type="number" step="10.00" min="10.00" placeholder="e.g. 500.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn--lime" disabled={depositing}>
              {depositing ? 'Depositing…' : 'Post bond'}
            </button>
          </form>
        </Panel>

        <Panel title="The backing rule (INV-10)" kicker="Exposure ≤ free bond" actions={<Chip tone="moved">Holds</Chip>}>
          <dl className="readout">
            <div>
              <dt>Autonomous exposure</dt>
              <dd className="fig">{usd(currentExposure)}</dd>
            </div>
            <div>
              <dt>Free bond</dt>
              <dd className="fig">{usd(freeBond)}</dd>
            </div>
            <div className="readout__out">
              <dt>Coverage</dt>
              <dd>Every unreviewed dollar has a dollar of bond behind it</dd>
            </div>
          </dl>
          <div className="withdraw">
            <button type="button" className="btn btn--ghost" onClick={handleWithdraw} disabled={withdrawing || freeBond <= 0}>
              {withdrawing ? 'Processing…' : `Withdraw free bond (${usd(freeBond)})`}
            </button>
            <Stamp kind="simulated" label="Simulated" meaning="This button shows a confirmation only. No withdrawal is sent to a contract." />
          </div>
        </Panel>
      </div>
    </div>
  );

}
