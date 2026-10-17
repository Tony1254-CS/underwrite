'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, RoleType, INSTITUTIONAL_ACCOUNTS } from '@/context/AuthContext';
import { AgentBar } from '@/components/ui/AgentBar';
import { PALETTE_EVENT } from '@/components/ui/CommandPalette';
import { Modal } from '@/components/ui';
import { Icon } from '@/components/ui/icons';
import { titleFor } from '@/components/ui/nav';
import { RAIL_EVENT } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/site/ThemeToggle';

const ROLE_PORTAL_ROUTES: Record<RoleType, string> = {
  OWNER: '/portals/owner',
  EXAMINER: '/portals/examiner',
  UNDERWRITER: '/portals/underwriter',
  ADJUDICATOR: '/portals/adjudicator',
  AGENT: '/portals/vendor',
  WALLET: '/portals/owner',
};

/** Top bar: where you are, the agent's live status, and the account controls (all behaviour unchanged). */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, openAuthChallenge, disconnectWallet } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleReset = async () => {
    try {
      setResetting(true);
      await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET' }),
      });
      window.location.reload();
    } catch {
      setResetting(false);
    }
  };

  const handleSelectRole = (r: Exclude<RoleType, 'WALLET'>) => {
    setRoleMenuOpen(false);
    if (user.role === r && isAuthenticated) {
      const targetRoute = ROLE_PORTAL_ROUTES[r];
      if (targetRoute) router.push(targetRoute);
      return;
    }
    // Require password authentication to switch profiles!
    openAuthChallenge(r);
  };

  // close the persona menu on outside click or Escape
  useEffect(() => {
    if (!roleMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setRoleMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setRoleMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [roleMenuOpen]);

  return (
    <>
      <header className="topbar">
        <button type="button" className="iconbtn topbar__menu" aria-label="Open navigation" onClick={() => window.dispatchEvent(new Event(RAIL_EVENT))}>
          <Icon name="menu" />
        </button>
        <p className="topbar__crumb">{titleFor(pathname)}</p>

        <AgentBar />

        <div className="topbar__actions">
          <button type="button" className="btn btn--ghost btn--sm topbar__find" aria-label="Go to a page (Ctrl K)" onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}>
            <Icon name="find" size={16} />
            <span>Go to</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="topbar__theme">
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={resetting}
            title="Reset sandbox state to pristine baseline"
            aria-label="Reset the demo sandbox"
            className="btn btn--ghost btn--sm topbar__reset"
          >
            <Icon name="reset" size={16} />
            <span>{resetting ? 'Resetting' : 'Reset'}</span>
          </button>

          <div className="menu" ref={menuRef}>
            <button
              type="button"
              className="btn btn--ghost btn--sm menu__btn"
              aria-haspopup="true"
              aria-expanded={roleMenuOpen}
              aria-label={`Switch persona. Signed in as ${user.name} ${user.badge.split(' ')[0]}`}
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            >
              <span className={`who who--${user.role.toLowerCase()}`} aria-hidden="true" />
              <span className="menu__name">{user.name}</span>{' '}
              <span className="chip chip--neutral menu__role">{user.badge.split(' ')[0]}</span>
            </button>

            {roleMenuOpen && (
              <div className="menu__pop" role="menu" aria-label="Switch persona">
                <p className="menu__hint">Switch persona. Each one asks for its password.</p>
                {(Object.keys(INSTITUTIONAL_ACCOUNTS) as (keyof typeof INSTITUTIONAL_ACCOUNTS)[]).map((r) => {
                  const p = INSTITUTIONAL_ACCOUNTS[r];
                  const isSelected = user.role === r && isAuthenticated;
                  return (
                    <button key={r} type="button" role="menuitem" className={`menu__item${isSelected ? ' is-on' : ''}`} onClick={() => handleSelectRole(r)}>
                      <span>
                        <strong>{p.name}</strong>
                        <small>{p.title}</small>
                      </span>
                      <span className="chip chip--neutral">{isSelected ? 'Open' : 'Unlock'}</span>
                    </button>
                  );
                })}
                <div className="menu__foot">
                  <Link href="/auth/login" onClick={() => setRoleMenuOpen(false)} className="text-link">
                    Sign-in page
                  </Link>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      setRoleMenuOpen(false);
                      logout();
                      router.push('/auth/login');
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {user.isWeb3Connected ? (
            <span className="walletpill">
              <code>
                {user.address.slice(0, 6)}...{user.address.slice(-4)}
              </code>
              <button type="button" className="iconbtn" onClick={disconnectWallet} aria-label="Disconnect wallet" title="Disconnect">
                ×
              </button>
            </span>
          ) : (
            !isAuthenticated && (
              <Link href="/auth/login" className="btn btn--lime btn--sm">
                Sign in
              </Link>
            )
          )}
        </div>
      </header>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset the sandbox?">
        <p className="modal__text">
          This returns the demo runtime to its starting state: invoices, pending reviews, vendors and claims you created go away. Nothing on a chain is affected.
        </p>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--lime"
            onClick={() => {
              setConfirmReset(false);
              handleReset();
            }}
          >
            Reset sandbox
          </button>
        </div>
      </Modal>
    </>
  );
}
