"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, RoleType } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  badge?: string;
  description: string;
  targetRole?: RoleType;
  icon: (props: { className?: string }) => React.JSX.Element;
}

const PORTAL_ITEMS: NavItem[] = [
  {
    name: "Owner Portal",
    href: "/portals/owner",
    badge: "CFO / S6",
    description: "Vault custody & T2 reviews",
    targetRole: "OWNER",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0H3m-1 0h1m16.5 0h.75a.75.75 0 01.75.75v.75m0 0H21m1 0h-1m-16.5 0h15m-15 0v10.5m15-10.5v10.5m-15 0h15" />
      </svg>
    ),
  },
  {
    name: "Examiner Portal",
    href: "/portals/examiner",
    badge: "AUDITOR",
    description: "AI exams & EIP-712 signing",
    targetRole: "EXAMINER",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    name: "Underwriter Portal",
    href: "/portals/underwriter",
    badge: "COLLATERAL",
    description: "Bond pool solvency & INV-10",
    targetRole: "UNDERWRITER",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: "Adjudicator Portal",
    href: "/portals/adjudicator",
    badge: "ARBITER",
    description: "Claims & atomic revocation",
    targetRole: "ADJUDICATOR",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    name: "Submit Invoice",
    href: "/submit",
    badge: "LIVE AP",
    description: "Inbound pipeline & agent",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

const AUDIT_ITEMS: NavItem[] = [
  {
    name: "Protocol HUD",
    href: "/",
    badge: "METER",
    description: "Authority meter & network",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    name: "Attack Lab",
    href: "/attack-lab",
    badge: "FIREWALL",
    description: "Adversarial replay & bypass",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    name: "Run Traces",
    href: "/traces",
    description: "Step-by-step executions",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
  {
    name: "Evidence Explorer",
    href: "/evidence",
    description: "Merkle roots & tamper audit",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: "Experiment Curves",
    href: "/experiment",
    badge: "BENCHMARK",
    description: "R0 vs R1 vs R2 empirical",
    icon: (props) => (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, openAuthChallenge } = useAuth();
  
  // Hover & Pin States for Auto-Minimize / Hover-Maximize
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const isExpanded = isHovered || isPinned;

  return (
    <>
      {/* Invisible static spacer that reserves rail width so main content does not jump */}
      <div className="w-20 shrink-0 hidden md:block" />

      {/* Dynamic Hover-Expanding VisionOS Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 h-screen bg-[#040816]/95 backdrop-blur-3xl border-r border-white/[0.08] flex flex-col z-40 transition-all duration-300 ease-in-out shadow-[8px_0_40px_rgba(0,0,0,0.7)] ${
          isExpanded ? "w-80 shadow-[16px_0_60px_rgba(0,0,0,0.9)]" : "w-20"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-white/[0.08] flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.5)] shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#060c1c] rounded-[14px] flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 shadow-glow-cyan" />
              </div>
            </div>

            {/* Revealed on hover */}
            <div className={`transition-opacity duration-200 overflow-hidden ${
              isExpanded ? "opacity-100 min-w-0" : "opacity-0 w-0 pointer-events-none"
            }`}>
              <span className="font-mono text-base font-black tracking-wider text-white flex items-center gap-1.5 whitespace-nowrap">
                UNDERWRITE
              </span>
              <div className="text-[10px] font-mono font-semibold tracking-widest text-cyan-400 uppercase whitespace-nowrap">
                Autonomous Enclave
              </div>
            </div>
          </Link>

          {/* Pin Toggle Button */}
          {isExpanded && (
            <button
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? "Unpin navbar (auto-minimize)" : "Pin navbar open"}
              className={`p-1.5 rounded-lg border transition-all text-xs font-mono shrink-0 ${
                isPinned
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                  : "bg-white/[0.05] text-slate-400 hover:text-white border-white/[0.1]"
              }`}
            >
              {isPinned ? "📌" : "📍"}
            </button>
          )}
        </div>

        {/* Navigation Scroll Canvas */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden">
          {/* Section 1: Role Portals */}
          <div className="space-y-1">
            <div className={`px-2 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between transition-opacity duration-200 ${
              isExpanded ? "opacity-100" : "opacity-0 h-0 p-0 overflow-hidden pointer-events-none"
            }`}>
              <span>Separate Role Portals</span>
              <span className="text-[9px] text-cyan-400 font-semibold">RBAC Verified</span>
            </div>

            {PORTAL_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isExpanded ? item.name : undefined}
                  className={`flex items-center rounded-2xl transition-all duration-200 group relative ${
                    isExpanded ? "gap-3 px-3 py-2.5" : "justify-center p-3"
                  } ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent text-white border border-cyan-500/40 shadow-[0_4px_24px_rgba(6,182,212,0.2)] backdrop-blur-xl"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-r-full shadow-[0_0_12px_#06b6d4]" />
                  )}
                  
                  <div className={`p-2 rounded-xl transition-all duration-200 shrink-0 ${
                    isActive 
                      ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                      : "bg-white/[0.04] text-slate-400 group-hover:text-cyan-300 group-hover:bg-white/[0.08]"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Expanded Text */}
                  <div className={`min-w-0 flex-1 transition-opacity duration-200 overflow-hidden ${
                    isExpanded ? "opacity-100" : "opacity-0 w-0 h-0 pointer-events-none hidden"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold tracking-wide whitespace-nowrap ${isActive ? "text-white font-bold" : ""}`}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                          isActive 
                            ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
                            : "bg-white/[0.04] text-slate-400"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Section 2: Audit & Telemetry */}
          <div className="space-y-1 pt-3 border-t border-white/[0.08]">
            <div className={`px-2 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 transition-opacity duration-200 ${
              isExpanded ? "opacity-100" : "opacity-0 h-0 p-0 overflow-hidden pointer-events-none"
            }`}>
              System &amp; Verification
            </div>

            {AUDIT_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isExpanded ? item.name : undefined}
                  className={`flex items-center rounded-2xl transition-all duration-200 group relative ${
                    isExpanded ? "gap-3 px-3 py-2.5" : "justify-center p-3"
                  } ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-white border border-cyan-500/40 shadow-[0_4px_24px_rgba(6,182,212,0.2)] backdrop-blur-xl"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-r-full shadow-[0_0_12px_#06b6d4]" />
                  )}
                  
                  <div className={`p-2 rounded-xl transition-all duration-200 shrink-0 ${
                    isActive 
                      ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                      : "bg-white/[0.04] text-slate-400 group-hover:text-cyan-300 group-hover:bg-white/[0.08]"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Expanded Text */}
                  <div className={`min-w-0 flex-1 transition-opacity duration-200 overflow-hidden ${
                    isExpanded ? "opacity-100" : "opacity-0 w-0 h-0 pointer-events-none hidden"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold tracking-wide whitespace-nowrap ${isActive ? "text-white font-bold" : ""}`}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-white/[0.04] text-slate-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Profile & Session Dock */}
        <div className="p-3 border-t border-white/[0.08] bg-black/40 shrink-0">
          {isExpanded ? (
            <div className="rounded-2xl bg-black/60 border border-white/[0.08] p-3 text-[11px] font-mono space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Signed In</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  {user.role}
                </span>
              </div>

              <div>
                <div className="text-white font-bold truncate text-xs">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                <button
                  onClick={() => openAuthChallenge(user.role === 'OWNER' ? 'EXAMINER' : 'OWNER')}
                  className="flex-1 py-1 px-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white text-[10px] font-bold transition-all text-center"
                >
                  Switch Role ⚡
                </button>
                <button
                  onClick={logout}
                  className="py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-[10px] font-bold transition-all text-center border border-rose-500/20"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 gap-2">
              <div 
                title={`${user.name} (${user.role})`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                  user.role === 'OWNER' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' :
                  user.role === 'EXAMINER' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]' :
                  user.role === 'UNDERWRITER' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]' :
                  'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                }`}
              >
                {user.name.charAt(0)}
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
