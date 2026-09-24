import React from 'react';

type IconName = 'overview'|'patients'|'observations'|'handovers'|'guidance'|'support'|'settings'|'notifications'|'reports'|'plus'|'arrow'|'mic'|'shield'|'search'|'close'|'menu'|'logout'|'chevron-down'|'check';

const paths: Record<IconName, React.ReactNode> = {
  overview: <><path d="M4 12h4V4H4v8Zm0 8h4v-5H4v5Zm8 0h4V4h-4v16Zm8 0h-4v-8h4v8Z"/><path d="M3 20h18"/></>,
  patients: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5"/><path d="M16 6.5a3 3 0 0 1 0 5.8M17 15c2.4.6 4 2.2 4 5"/></>,
  observations: <><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><path d="M16 16v4M14 18h4"/></>,
  handovers: <><path d="M4 6h16v12H4z"/><path d="M8 10h8M8 14h5"/><path d="m17 14 3 3-3 3"/></>,
  guidance: <><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4 4V4Z"/><path d="M9 20h10"/><path d="M9 9h6M9 13h5"/></>,
  support: <><path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z"/><path d="M9 13h6M12 10v6"/></>,
  settings: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.5"/></>,
  notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></>,
  reports: <><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h5M8 12h8M8 16h6"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  mic: <><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></>,
  shield: <><path d="M12 21s7-3.5 7-9V5l-7-3-7 3v7c0 5.5 7 9 7 9Z"/><path d="m9 12 2 2 4-4"/></>,
  search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9"/></>,
  'chevron-down': <path d="m6 9 6 6 6-6"/>,
  check: <path d="M20 6 9 17l-5-5"/>,
};

export function MediQIcon({ name, size = 20, strokeWidth = 1.7, className = '' }: { name: IconName; size?: number; strokeWidth?: number; className?: string }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}
