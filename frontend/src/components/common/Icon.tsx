import type { SVGProps } from 'react';

type IconName =
  | 'activity' | 'alert-circle' | 'alert-triangle' | 'arrow-left' | 'arrow-right'
  | 'badge-check' | 'bell' | 'book-open' | 'calendar' | 'check-circle-2'
  | 'chevron-right' | 'clipboard-list' | 'clock' | 'file-audio' | 'file-text'
  | 'heart' | 'heart-handshake' | 'info' | 'loader-2' | 'message-square-text'
  | 'refresh-cw' | 'search' | 'shield' | 'shield-alert' | 'sparkles'
  | 'stethoscope' | 'users' | 'zap';

const p: Record<IconName, JSX.Element> = {
  activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
  'alert-circle': <><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></>,
  'alert-triangle': <><path d="m12 3 9 17H3L12 3Z"/><path d="M12 9v4M12 16h.01"/></>,
  'arrow-left': <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
  'arrow-right': <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  'badge-check': <><path d="M12 3 14 5.2l3-.2.8 2.9 2.2 2-1.2 2.7 1.2 2.7-2.2 2-.8 2.9-3-.2L12 21l-2-2.2-3 .2-.8-2.9-2.2-2L5.2 11 4 8.3l2.2-2L7 3.8l3 .2L12 3Z"/><path d="m8.8 12.2 2.1 2.1 4.4-4.6"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></>,
  'book-open': <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5A2.5 2.5 0 0 1 20 22V5.5Z"/></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18"/></>,
  'check-circle-2': <><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.3 2.3 4.8-5"/></>,
  'chevron-right': <path d="m9 18 6-6-6-6"/>,
  'clipboard-list': <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 9h7M8.5 13h7M8.5 17h4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  'file-audio': <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 15a2 2 0 1 0 2 2v-6l4-1v5a2 2 0 1 0 2 2"/></>,
  'file-text': <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></>,
  heart: <path d="M20.8 8.7c0 5.4-8.8 10.3-8.8 10.3S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"/>,
  'heart-handshake': <><path d="M19 8.5a4.5 4.5 0 0 0-7-2.2A4.5 4.5 0 0 0 5 8.5c0 4.8 7 8.8 7 8.8s7-4 7-8.8Z"/><path d="M4 13.5 7 11l3 3 3-2 3 3 4-3"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
  'loader-2': <path d="M21 12a9 9 0 1 1-6.2-8.6"/>,
  'message-square-text': <><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h6"/></>,
  'refresh-cw': <><path d="M20 11a8 8 0 0 0-14-5L3 9M3 5v4h4M4 13a8 8 0 0 0 14 5l3-3M21 19v-4h-4"/></>,
  search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
  shield: <><path d="M12 21s7-3.5 7-9V5l-7-3-7 3v7c0 5.5 7 9 7 9Z"/><path d="m9 12 2 2 4-4"/></>,
  'shield-alert': <><path d="M12 21s7-3.5 7-9V5l-7-3-7 3v7c0 5.5 7 9 7 9Z"/><path d="M12 8v4M12 15h.01"/></>,
  sparkles: <><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
  stethoscope: <><path d="M6 3v5a6 6 0 0 0 12 0V3M6 3H4M18 3h2M9 3v5M15 3v5"/><path d="M12 14v2a5 5 0 0 0 10 0v-1"/><circle cx="22" cy="14" r="1"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5M16 6.5a3 3 0 0 1 0 5.8M17 15c2.4.6 4 2.2 4 5"/></>,
  zap: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>,
};

function toIconName(name: string): IconName {
  return name.toLowerCase().replace(/[A-Z]/g, m => `-${m.toLowerCase()}`) as IconName;
}

export function ProjectIcon({ name, size = 20, className = '', strokeWidth = 1.7, ...props }: { name: string; size?: number; className?: string; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  const icon = p[toIconName(name)];
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>{icon ?? p.info}</svg>;
}

export const Activity = (props: any) => <ProjectIcon name="activity" {...props}/>;
export const AlertCircle = (props: any) => <ProjectIcon name="alert-circle" {...props}/>;
export const AlertTriangle = (props: any) => <ProjectIcon name="alert-triangle" {...props}/>;
export const ArrowLeft = (props: any) => <ProjectIcon name="arrow-left" {...props}/>;
export const ArrowRight = (props: any) => <ProjectIcon name="arrow-right" {...props}/>;
export const BadgeCheck = (props: any) => <ProjectIcon name="badge-check" {...props}/>;
export const Bell = (props: any) => <ProjectIcon name="bell" {...props}/>;
export const BookOpen = (props: any) => <ProjectIcon name="book-open" {...props}/>;
export const Calendar = (props: any) => <ProjectIcon name="calendar" {...props}/>;
export const CheckCircle2 = (props: any) => <ProjectIcon name="check-circle-2" {...props}/>;
export const ChevronRight = (props: any) => <ProjectIcon name="chevron-right" {...props}/>;
export const ClipboardList = (props: any) => <ProjectIcon name="clipboard-list" {...props}/>;
export const Clock = (props: any) => <ProjectIcon name="clock" {...props}/>;
export const FileAudio = (props: any) => <ProjectIcon name="file-audio" {...props}/>;
export const FileText = (props: any) => <ProjectIcon name="file-text" {...props}/>;
export const Heart = (props: any) => <ProjectIcon name="heart" {...props}/>;
export const HeartHandshake = (props: any) => <ProjectIcon name="heart-handshake" {...props}/>;
export const Info = (props: any) => <ProjectIcon name="info" {...props}/>;
export const Loader2 = (props: any) => <ProjectIcon name="loader-2" className={`animate-spin ${props.className || ''}`} {...props}/>;
export const MessageSquareText = (props: any) => <ProjectIcon name="message-square-text" {...props}/>;
export const RefreshCw = (props: any) => <ProjectIcon name="refresh-cw" {...props}/>;
export const Search = (props: any) => <ProjectIcon name="search" {...props}/>;
export const Shield = (props: any) => <ProjectIcon name="shield" {...props}/>;
export const ShieldAlert = (props: any) => <ProjectIcon name="shield-alert" {...props}/>;
export const Sparkles = (props: any) => <ProjectIcon name="sparkles" {...props}/>;
export const Stethoscope = (props: any) => <ProjectIcon name="stethoscope" {...props}/>;
export const Users = (props: any) => <ProjectIcon name="users" {...props}/>;
export const Zap = (props: any) => <ProjectIcon name="zap" {...props}/>;
