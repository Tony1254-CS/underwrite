'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type RoleType = 'OWNER' | 'EXAMINER' | 'UNDERWRITER' | 'ADJUDICATOR' | 'AGENT' | 'WALLET';

export interface UserProfile {
  address: string;
  role: RoleType;
  name: string;
  badge: string;
  color: string;
  isWeb3Connected: boolean;
}

export const PRESET_ROLES: Record<Exclude<RoleType, 'WALLET'>, UserProfile> = {
  OWNER: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    role: 'OWNER',
    name: 'Vault Owner / CFO',
    badge: 'OWNER S6',
    color: 'emerald',
    isWeb3Connected: false,
  },
  EXAMINER: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    role: 'EXAMINER',
    name: 'Safety Examiner',
    badge: 'EIP-712 ATTESTOR',
    color: 'indigo',
    isWeb3Connected: false,
  },
  UNDERWRITER: {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    role: 'UNDERWRITER',
    name: 'Underwriter / Bond LP',
    badge: 'COLLATERAL VAULT',
    color: 'cyan',
    isWeb3Connected: false,
  },
  ADJUDICATOR: {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    role: 'ADJUDICATOR',
    name: 'Designated Adjudicator',
    badge: 'ORACLE / CLAIMS',
    color: 'amber',
    isWeb3Connected: false,
  },
  AGENT: {
    address: '0xDC062a66c9E400f7EAcdE3E1b049E664337538d0',
    role: 'AGENT',
    name: 'Autonomous Agent Enclave',
    badge: 'AUTONOMOUS SIGNER',
    color: 'rose',
    isWeb3Connected: false,
  },
};

interface AuthContextType {
  user: UserProfile;
  switchRole: (role: RoleType) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isOwner: boolean;
  isExaminer: boolean;
  isUnderwriter: boolean;
  isAdjudicator: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(PRESET_ROLES.OWNER);

  useEffect(() => {
    // Restore role from local storage if available
    try {
      const savedRole = localStorage.getItem('underwrite_active_role');
      if (savedRole && savedRole in PRESET_ROLES) {
        setUser(PRESET_ROLES[savedRole as keyof typeof PRESET_ROLES]);
      }
    } catch {
      // ignore
    }
  }, []);

  const switchRole = (role: RoleType) => {
    if (role === 'WALLET') return;
    const profile = PRESET_ROLES[role];
    setUser(profile);
    try {
      localStorage.setItem('underwrite_active_role', role);
    } catch {}
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          const walletProfile: UserProfile = {
            address: addr,
            role: 'WALLET',
            name: 'Connected Web3 Wallet',
            badge: 'METAMASK / BROWSER',
            color: 'cyan',
            isWeb3Connected: true,
          };
          setUser(walletProfile);
          try {
            localStorage.setItem('underwrite_active_role', 'WALLET');
          } catch {}
        }
      } catch (err) {
        console.error('Wallet connection rejected:', err);
      }
    } else {
      alert('No Web3 wallet extension found. Switching to simulated Owner role instead.');
      switchRole('OWNER');
    }
  };

  const disconnectWallet = () => {
    switchRole('OWNER');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        switchRole,
        connectWallet,
        disconnectWallet,
        isOwner: user.role === 'OWNER' || user.role === 'WALLET',
        isExaminer: user.role === 'EXAMINER',
        isUnderwriter: user.role === 'UNDERWRITER',
        isAdjudicator: user.role === 'ADJUDICATOR',
        isAgent: user.role === 'AGENT',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
