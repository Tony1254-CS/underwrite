import React from "react";

/** Small stroke icon set (24px grid). Decorative: always paired with a text label or an aria-label. */
const PATHS = {
  home: "M3 11.5 12 4l9 7.5M5.5 10v9.5h5v-5h3v5h5V10",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  inbox: "M4 13l2.5-8h11L20 13M4 13v6h16v-6M4 13h5l1 2h4l1-2h5",
  building: "M5 21V5l7-2.5V21M12 9h7v12M8 8.5h1.5M8 12h1.5M8 15.5h1.5M15 13h1.5M15 16.5h1.5M3 21h18",
  scale: "M12 4v16M7 20h10M5.5 8 3 14a3 3 0 006 0zM18.5 8 16 14a3 3 0 006 0zM5.5 8h13",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h5M9.5 16h5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 5-5",
  coins: "M12 4a8 8 0 100 16 8 8 0 000-16zM9.5 14.3c.6.8 1.5 1.2 2.5 1.2 1.4 0 2.5-.7 2.5-1.7 0-2.2-5-1.2-5-3.4 0-1 1.1-1.7 2.5-1.7 1 0 1.9.4 2.5 1.2M12 6.5v1.4M12 16.1v1.4",
  warn: "M12 4l9.5 16.5h-19zM12 10v4.5M12 17.2v.3",
  list: "M4 6h16M4 12h16M4 18h10",
  search: "M11 4a7 7 0 105 12l4.5 4.5M8.5 11l2 2 3.5-4",
  check: "M12 3a9 9 0 100 18 9 9 0 000-18zM8 12.2l2.8 2.8L16 9.5",
  chart: "M5 20V11M12 20V4M19 20v-6",
  invoice: "M6 3h9l3 3v15l-3-1.5L12 21l-3-1.5L6 21zM9 9h6M9 13h6",
  lab: "M9 3l2 2h2l2-2M7.5 9.5a4.5 4.5 0 019 0V15a4.5 4.5 0 01-9 0zM3 12h4.5M16.5 12H21M4 19l3.3-2.2M20 19l-3.3-2.2M12 9.5V19.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  find: "M11 4a7 7 0 105 12l4.5 4.5",
  user: "M16 8a4 4 0 11-8 0 4 4 0 018 0zM4 20c1-4 4-6 8-6s7 2 8 6",
  reset: "M4 12a8 8 0 108-8M4 4v5h5",
  out: "M10 4H5v16h5M15 8l4 4-4 4M19 12H9",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
