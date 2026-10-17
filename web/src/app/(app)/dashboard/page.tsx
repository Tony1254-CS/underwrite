'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { VaultStateResponse } from '@/lib/chain';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Stat, Notice, Skeleton, AuthorityMeter, usd } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/icons';
import { ArrowGlyph } from '@/components/site/Glyphs';

const FACTS = [
  { k: 'Sized by an exam', v: 'The limit comes from an adversarial exam, not from a number someone typed in.' },
  { k: 'Two keys', v: 'The examiner signs, the owner activates. The agent cannot raise its own limit.' },
  { k: 'Tiers', v: 'Invoices inside the limit pay at once. Larger or unusual ones wait for the owner.' },
  { k: 'One-step consequence', v: 'An approved claim repays from the bond and revokes the limit in the same transaction.' },
];

const DESKS: { href: string; name: string; icon: IconName; text: string }[] = [
  { href: '/portals/owner', name: 'Owner inbox', icon: 'inbox', text: 'Review what the agent held and manage suppliers.' },
  { href: '/portals/vendor', name: 'Supplier portal', icon: 'building', text: 'Send an invoice and follow it through the checks.' },
  { href: '/portals/examiner', name: 'Examiner desk', icon: 'shield', text: 'Run the exam and sign the attestation.' },
  { href: '/portals/underwriter', name: 'Underwriter desk', icon: 'coins', text: 'See the bond that backs the agent.' },
  { href: '/portals/adjudicator', name: 'Adjudication desk', icon: 'warn', text: 'Decide claims and revoke authority.' },
  { href: '/attack-lab', name: 'Attack lab', icon: 'lab', text: 'Try to get a bad invoice through.' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState<VaultStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success && json.data) {
        setState(json.data);
      } else {
        setError('Failed to load state');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentExposure = state ? parseFloat(state.meter.currentExposureUSDC) : 42.50;
  const t1Cap = state ? parseFloat(state.qualification.t1MaxPerWindowUSDC) : 180.00;
  const isRevoked = state ? !state.qualification.active : false;
  const exposurePercent = Math.min(100, Math.max(0, (currentExposure / t1Cap) * 100));

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Operate"
        title="Overview"
        lede="What the agent may spend on its own, what stands behind it, and who can change it."
        actions={
          <Link href="/submit" className="btn btn--lime">
            Send a test invoice <ArrowGlyph />
          </Link>
        }
      />

      {error && <Notice tone="bad">{error}</Notice>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {state ? (
          <AuthorityMeter
            active={!isRevoked}
            cap={t1Cap}
            windowSpend={parseFloat(state.meter.windowSpendUSDC) || 0}
            exposure={currentExposure}
            bond={parseFloat(state.meter.bondRemainingUSDC) || 0}
            agentLabel={`Viewing as ${user.name}`}
          />
        ) : (
          <Panel>
            <Skeleton h={260} />
          </Panel>
        )}

        <Panel title="How authority works" kicker="Four facts">
          <ol className="facts-list">
            {FACTS.map((f, i) => (
              <li key={f.k}>
                <span className="facts-list__n fig">{i + 1}</span>
                <div>
                  <strong>{f.k}</strong>
                  <p>{f.v}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Daily limit" value={state ? usd(t1Cap) : '…'} tone="lime" sub="Set by the exam, enforced by the contract" />
        <Stat
          label="Window exposure"
          value={state ? usd(currentExposure) : '…'}
          fill={state ? exposurePercent / 100 : 0}
          sub={state ? `${exposurePercent.toFixed(1)}% of the limit` : undefined}
        />
        <Stat label="Bond remaining" value={state ? usd(state.meter.bondRemainingUSDC) : '…'} sub="Backs payments nobody has reviewed yet" />
        <Stat label="Reserve floor" value={state ? usd(state.balances.reserveFloorUSDC) : '…'} sub="The vault never drops below this" />
      </div>

      <Panel title="Desks" kicker="Who does what">
        <ul className="desklinks">
          {DESKS.map((d) => (
            <li key={d.href}>
              <Link href={d.href} className="desklink">
                <Icon name={d.icon} size={22} />
                <span>
                  <strong>{d.name}</strong>
                  <small>{d.text}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );

}
