'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type RoleType = 'OWNER' | 'EXAMINER' | 'UNDERWRITER' | 'ADJUDICATOR' | 'AGENT' | 'WALLET';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: RoleType;
  address: string;
  badge: string;
  color: string;
  password: string;
  title: string;
  department: string;
  avatarSeed: string;
}

export const INSTITUTIONAL_ACCOUNTS: Record<Exclude<RoleType, 'WALLET'>, UserAccount> = {
  OWNER: {
    id: 'acc_owner_001',
    email: 'cfo@underwrite.fi',
    password: 'OwnerPassword2026!',
    name: 'Sarah Chen',
    title: 'Chief Financial Officer & Vault Custodian',
    department: 'Treasury & Corporate Governance (S6)',
    role: 'OWNER',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    badge: 'OWNER S6',
    color: 'emerald',
    avatarSeed: 'sarah-cfo',
  },
  EXAMINER: {
    id: 'acc_examiner_002',
    email: 'auditor@underwrite.fi',
    password: 'ExaminerPassword2026!',
    name: 'Dr. Marcus Vance',
    title: 'Lead AI Safety Examiner',
    department: 'Risk, Alignment & Attestation Enclave',
    role: 'EXAMINER',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    badge: 'EIP-712 ATTESTOR',
    color: 'indigo',
    avatarSeed: 'marcus-auditor',
  },
  UNDERWRITER: {
    id: 'acc_underwriter_003',
    email: 'underwriter@underwrite.fi',
    password: 'UnderwriterPassword2026!',
    name: 'Elena Rostova',
    title: 'Principal Underwriting Partner',
    department: 'BondPool Capital LP Syndicate',
    role: 'UNDERWRITER',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    badge: 'COLLATERAL VAULT',
    color: 'cyan',
    avatarSeed: 'elena-lp',
  },
  ADJUDICATOR: {
    id: 'acc_adjudicator_004',
    email: 'adjudicator@underwrite.fi',
    password: 'AdjudicatorPassword2026!',
    name: 'Hon. Justice K. Thorne',
    title: 'Chief Claims Adjudicator',
    department: 'Disputes, Arbitration & Slashing Board',
    role: 'ADJUDICATOR',
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    badge: 'ORACLE / CLAIMS',
    color: 'amber',
    avatarSeed: 'thorne-judge',
  },
  AGENT: {
    id: 'acc_agent_005',
    email: 'vendor@cloudcorp.com',
    password: 'VendorPassword2026!',
    name: 'CloudCorp Global Logistics',
    title: 'Enterprise Supplier & Authorized AP Invoicing Agent',
    department: 'Global Logistics & Inbound Billing Portal',
    role: 'AGENT',
    address: '0xDC062a66c9E400f7EAcdE3E1b049E664337538d0',
    badge: 'VENDOR / AP AGENT',
    color: 'rose',
    avatarSeed: 'agent-submitter',
  },
};

// Backwards-compatible PRESET_ROLES for legacy callers
export const PRESET_ROLES: Record<Exclude<RoleType, 'WALLET'>, any> = {
  OWNER: {
    ...INSTITUTIONAL_ACCOUNTS.OWNER,
    isWeb3Connected: false,
  },
  EXAMINER: {
    ...INSTITUTIONAL_ACCOUNTS.EXAMINER,
    isWeb3Connected: false,
  },
  UNDERWRITER: {
    ...INSTITUTIONAL_ACCOUNTS.UNDERWRITER,
    isWeb3Connected: false,
  },
  ADJUDICATOR: {
    ...INSTITUTIONAL_ACCOUNTS.ADJUDICATOR,
    isWeb3Connected: false,
  },
  AGENT: {
    ...INSTITUTIONAL_ACCOUNTS.AGENT,
    isWeb3Connected: false,
  },
};

export interface AuthSession {
  token: string;
  user: UserAccount & { isWeb3Connected?: boolean };
  authenticatedAt: number;
}

interface AuthContextType {
  user: UserAccount & { isWeb3Connected?: boolean };
  isAuthenticated: boolean;
  sessionToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registerAccount: (accountData: {
    name: string;
    email: string;
    password: string;
    role: RoleType;
    department?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: RoleType, bypassPassword?: boolean) => void;
  verifyPasswordAndSwitch: (role: RoleType, password: string) => Promise<{ success: boolean; error?: string }>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isOwner: boolean;
  isExaminer: boolean;
  isUnderwriter: boolean;
  isAdjudicator: boolean;
  isAgent: boolean;
  isVendor: boolean;
  // Auth challenge modal state
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  targetRoleForModal: RoleType | null;
  openAuthChallenge: (targetRole: RoleType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount & { isWeb3Connected?: boolean }>(
    INSTITUTIONAL_ACCOUNTS.OWNER
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [sessionToken, setSessionToken] = useState<string | null>('uw_sess_owner_default');
  
  // Custom registered accounts pool
  const [customAccounts, setCustomAccounts] = useState<Record<string, UserAccount>>({});

  // Auth Challenge Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [targetRoleForModal, setTargetRoleForModal] = useState<RoleType | null>(null);

  useEffect(() => {
    try {
      // 1. Restore registered accounts
      const savedAccounts = localStorage.getItem('underwrite_custom_accounts');
      if (savedAccounts) {
        setCustomAccounts(JSON.parse(savedAccounts));
      }

      // 2. Restore active session
      const savedSession = localStorage.getItem('underwrite_auth_session');
      if (savedSession) {
        const parsed: AuthSession = JSON.parse(savedSession);
        if (parsed && parsed.user && parsed.token) {
          setCurrentUser(parsed.user);
          setIsAuthenticated(true);
          setSessionToken(parsed.token);
          return;
        }
      }

      // Default initial session: Owner
      const defaultSession: AuthSession = {
        token: 'uw_sess_owner_default',
        user: { ...INSTITUTIONAL_ACCOUNTS.OWNER, isWeb3Connected: false },
        authenticatedAt: Date.now(),
      };
      localStorage.setItem('underwrite_auth_session', JSON.stringify(defaultSession));
    } catch {
      // ignore
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check institutional accounts
    let target = Object.values(INSTITUTIONAL_ACCOUNTS).find(
      (acc) => acc.email.toLowerCase() === cleanEmail
    );

    // Check custom accounts
    if (!target && customAccounts[cleanEmail]) {
      target = customAccounts[cleanEmail];
    }

    if (!target) {
      return { success: false, error: 'No account registered with this email address.' };
    }

    if (target.password !== password) {
      return { success: false, error: 'Incorrect password. Please verify your corporate credentials.' };
    }

    const session: AuthSession = {
      token: `uw_sess_${target.role.toLowerCase()}_${Date.now()}`,
      user: { ...target, isWeb3Connected: false },
      authenticatedAt: Date.now(),
    };

    setCurrentUser(session.user);
    setIsAuthenticated(true);
    setSessionToken(session.token);

    try {
      localStorage.setItem('underwrite_auth_session', JSON.stringify(session));
      localStorage.setItem('underwrite_active_role', target.role);
    } catch {}

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSessionToken(null);
    try {
      localStorage.removeItem('underwrite_auth_session');
      localStorage.removeItem('underwrite_active_role');
    } catch {}
  };

  const registerAccount = async (accountData: {
    name: string;
    email: string;
    password: string;
    role: RoleType;
    department?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = accountData.email.trim().toLowerCase();

    if (INSTITUTIONAL_ACCOUNTS[accountData.role as keyof typeof INSTITUTIONAL_ACCOUNTS]?.email.toLowerCase() === cleanEmail) {
      return { success: false, error: 'This corporate institutional email is already reserved.' };
    }

    if (customAccounts[cleanEmail]) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newAcc: UserAccount = {
      id: `acc_custom_${Date.now()}`,
      email: cleanEmail,
      name: accountData.name,
      role: accountData.role,
      password: accountData.password,
      title: `${accountData.role} Officer`,
      department: accountData.department || 'Enterprise Operations',
      address: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      badge: `${accountData.role} VERIFIED`,
      color: accountData.role === 'OWNER' ? 'emerald' : accountData.role === 'EXAMINER' ? 'indigo' : accountData.role === 'UNDERWRITER' ? 'cyan' : 'amber',
      avatarSeed: cleanEmail,
    };

    const updated = { ...customAccounts, [cleanEmail]: newAcc };
    setCustomAccounts(updated);
    try {
      localStorage.setItem('underwrite_custom_accounts', JSON.stringify(updated));
    } catch {}

    // Auto-login newly registered user
    return login(cleanEmail, accountData.password);
  };

  const verifyPasswordAndSwitch = async (
    role: RoleType,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (role === 'WALLET') {
      return { success: false, error: 'Connect browser wallet directly.' };
    }

    const institutional = INSTITUTIONAL_ACCOUNTS[role];
    if (!institutional) {
      return { success: false, error: 'Invalid target role requested.' };
    }

    if (institutional.password !== password) {
      return { success: false, error: `Invalid password for ${institutional.name} (${role}).` };
    }

    const session: AuthSession = {
      token: `uw_sess_${role.toLowerCase()}_${Date.now()}`,
      user: { ...institutional, isWeb3Connected: false },
      authenticatedAt: Date.now(),
    };

    setCurrentUser(session.user);
    setIsAuthenticated(true);
    setSessionToken(session.token);

    try {
      localStorage.setItem('underwrite_auth_session', JSON.stringify(session));
      localStorage.setItem('underwrite_active_role', role);
    } catch {}

    return { success: true };
  };

  const switchRole = (role: RoleType, bypassPassword = false) => {
    if (role === 'WALLET') return;
    
    // If bypass is explicitly requested (e.g. within an authorized session test)
    if (bypassPassword) {
      const profile = INSTITUTIONAL_ACCOUNTS[role];
      setCurrentUser({ ...profile, isWeb3Connected: false });
      setIsAuthenticated(true);
      try {
        localStorage.setItem('underwrite_active_role', role);
      } catch {}
      return;
    }

    // Otherwise trigger the authentication challenge modal
    setTargetRoleForModal(role);
    setAuthModalOpen(true);
  };

  const openAuthChallenge = (targetRole: RoleType) => {
    setTargetRoleForModal(targetRole);
    setAuthModalOpen(true);
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          const walletProfile: UserAccount & { isWeb3Connected: boolean } = {
            id: `acc_wallet_${addr.slice(2, 8)}`,
            email: `${addr.slice(0, 6)}...@web3.eth`,
            password: '',
            address: addr,
            role: 'WALLET',
            name: 'Web3 Signer',
            title: 'EIP-1193 Connected Signer',
            department: 'On-Chain Web3 Identity',
            badge: 'METAMASK / BROWSER',
            color: 'cyan',
            avatarSeed: addr,
            isWeb3Connected: true,
          };
          setCurrentUser(walletProfile);
          setIsAuthenticated(true);
          try {
            localStorage.setItem('underwrite_active_role', 'WALLET');
          } catch {}
        }
      } catch (err) {
        console.error('Wallet connection rejected:', err);
      }
    } else {
      alert('No Web3 wallet extension found. Please enter password credentials to authenticate.');
      openAuthChallenge('OWNER');
    }
  };

  const disconnectWallet = () => {
    const defaultOwner = INSTITUTIONAL_ACCOUNTS.OWNER;
    setCurrentUser({ ...defaultOwner, isWeb3Connected: false });
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated,
        sessionToken,
        login,
        logout,
        registerAccount,
        switchRole,
        verifyPasswordAndSwitch,
        connectWallet,
        disconnectWallet,
        isOwner: currentUser.role === 'OWNER' || currentUser.role === 'WALLET',
        isExaminer: currentUser.role === 'EXAMINER',
        isUnderwriter: currentUser.role === 'UNDERWRITER',
        isAdjudicator: currentUser.role === 'ADJUDICATOR',
        isAgent: currentUser.role === 'AGENT',
        isVendor: currentUser.role === 'AGENT',
        authModalOpen,
        setAuthModalOpen,
        targetRoleForModal,
        openAuthChallenge,
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
