import type { IconName } from "./icons";

/** One source of truth for navigation: the rail, the command palette and the breadcrumb all read this. */
export interface NavItem {
  name: string;
  href: string;
  icon: IconName;
  hint: string;
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Operate",
    items: [
      { name: "Overview", href: "/dashboard", icon: "grid", hint: "Authority meter and limits" },
      { name: "Owner inbox", href: "/portals/owner", icon: "inbox", hint: "Review, suppliers, claims" },
      { name: "Supplier portal", href: "/portals/vendor", icon: "building", hint: "Send and track invoices" },
      { name: "Claims", href: "/claims", icon: "scale", hint: "Bond claims and settlement" },
    ],
  },
  {
    title: "Qualify",
    items: [
      { name: "Policy card", href: "/exam", icon: "doc", hint: "Exam bounds and compiler" },
      { name: "Examiner desk", href: "/portals/examiner", icon: "shield", hint: "Exam and attestation" },
      { name: "Underwriter desk", href: "/portals/underwriter", icon: "coins", hint: "Bond pool" },
      { name: "Adjudication desk", href: "/portals/adjudicator", icon: "warn", hint: "Decide claims" },
    ],
  },
  {
    title: "Prove",
    items: [
      { name: "Traces", href: "/traces", icon: "list", hint: "Step-by-step runs" },
      { name: "Evidence", href: "/evidence", icon: "search", hint: "Verify a qualification" },
      { name: "Verification audit", href: "/verify", icon: "check", hint: "Field-by-field audit" },
      { name: "Experiment", href: "/experiment", icon: "chart", hint: "Nine recorded results" },
    ],
  },
  {
    title: "Lab",
    items: [
      { name: "Invoice studio", href: "/submit", icon: "invoice", hint: "Craft and submit invoices" },
      { name: "Attack lab", href: "/attack-lab", icon: "lab", hint: "Try to break it" },
    ],
  },
];

export const ALL_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function titleFor(pathname: string): string {
  if (pathname.startsWith("/auth/login")) return "Sign in";
  if (pathname.startsWith("/auth/register")) return "Create profile";
  return ALL_NAV.find((n) => n.href === pathname)?.name ?? "Workspace";
}
