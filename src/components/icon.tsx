export type IconName =
  | "search"
  | "heart"
  | "menu"
  | "user"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "close"
  | "filter"
  | "mountain"
  | "cabin"
  | "waves"
  | "farm"
  | "pool"
  | "sparkles"
  | "compass"
  | "star"
  | "plus"
  | "minus"
  | "arrow-left"
  | "share"
  | "map"
  | "calendar"
  | "check"
  | "globe"
  | "shield";

const paths: Record<IconName, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></>,
  heart: <path d="M20.8 8.8c0 5.2-8.8 10.1-8.8 10.1S3.2 14 3.2 8.8A4.4 4.4 0 0 1 11 5.9l1 .9 1-.9a4.4 4.4 0 0 1 7.8 2.9Z" />,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.3 3.1-5 7-5s6.3 1.7 7 5" /></>,
  "chevron-left": <path d="m14.5 5-7 7 7 7" />,
  "chevron-right": <path d="m9.5 5 7 7-7 7" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  filter: <><path d="M4 7h16" /><path d="M7 12h10" /><path d="M10 17h4" /></>,
  mountain: <><path d="m3 19 6-11 4 6 3-4 5 9H3Z" /><path d="m9 8 2 3" /></>,
  cabin: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  waves: <><path d="M3 8c2.4 0 2.4-2 4.8-2s2.4 2 4.8 2 2.4-2 4.8-2S19.6 8 22 8" /><path d="M3 13c2.4 0 2.4-2 4.8-2s2.4 2 4.8 2 2.4-2 4.8-2 2.4 2 4.8 2" /><path d="M3 18c2.4 0 2.4-2 4.8-2s2.4 2 4.8 2 2.4-2 4.8-2 2.4 2 4.8 2" /></>,
  farm: <><path d="M3 20V9l9-5 9 5v11" /><path d="M7 20v-6h10v6" /><path d="M9 10h.01M15 10h.01" /></>,
  pool: <><path d="M4 5v13c0 1.1.9 2 2 2 1.7 0 1.7-2 3.3-2s1.7 2 3.4 2 1.7-2 3.3-2 1.7 2 3.4 2c1.1 0 2-.9 2-2V5" /><path d="M4 9h16M8 5v4m4-4v4m4-4v4" /></>,
  sparkles: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  "arrow-left": <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
};

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}