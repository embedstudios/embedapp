import type { ReactNode } from 'react';
import { ICONS, type IconName } from './icon-data';

const MARK_PATH = 'M 39.138 0 C 17.523 0 0 17.523 0 39.138 C 0 46.547 2.058 53.474 5.635 59.381 C 6.393 60.839 7.347 62.222 8.497 63.491 C 10.304 65.761 12.358 67.826 14.618 69.644 L 45.709 100.736 L 39.249 100.736 C 17.572 100.736 0 118.308 0 139.985 C 0 161.662 17.572 179.234 39.249 179.234 L 165.102 179.234 L 145.928 198.408 C 144.91 199.427 144.027 200.529 143.28 201.694 L 39.138 201.694 C 17.523 201.694 0 219.217 0 240.832 C 0 262.448 17.523 279.97 39.138 279.97 L 204.585 279.97 C 226.201 279.97 243.723 262.448 243.723 240.832 C 243.723 219.217 226.201 201.694 204.585 201.694 L 197.991 201.694 L 229.294 170.392 C 231.413 168.66 233.347 166.711 235.064 164.579 C 235.991 163.544 236.788 162.434 237.456 161.27 C 241.421 155.138 243.723 147.831 243.723 139.985 C 243.723 118.308 226.151 100.736 204.474 100.736 L 100.339 100.736 C 99.563 99.489 98.633 98.31 97.55 97.227 L 78.599 78.276 L 204.585 78.276 C 226.201 78.276 243.723 60.753 243.723 39.138 C 243.723 17.523 226.201 0 204.585 0 L 39.138 0 Z M 78.599 78.276 L 39.138 78.276 C 29.855 78.276 21.327 75.044 14.618 69.644 L 9.168 64.194 C 8.937 63.964 8.714 63.729 8.497 63.491 C 7.459 62.186 6.502 60.813 5.635 59.381 C 1.802 52.008 2.98 42.707 9.168 36.52 C 16.81 28.877 29.2 28.877 36.842 36.52 L 78.599 78.276 Z M 237.456 161.27 C 236.715 162.415 235.917 163.52 235.064 164.579 C 234.822 164.85 234.571 165.115 234.311 165.375 L 229.294 170.392 C 222.531 175.919 213.89 179.234 204.474 179.234 L 165.102 179.234 L 206.636 137.7 C 214.278 130.058 226.668 130.058 234.311 137.7 C 240.698 144.088 241.747 153.793 237.456 161.27 Z M 197.991 201.694 L 173.603 226.083 C 165.961 233.725 153.57 233.725 145.928 226.083 C 139.305 219.459 138.422 209.269 143.28 201.694 L 197.991 201.694 Z M 100.339 100.736 C 105.039 108.286 104.109 118.343 97.55 124.902 C 89.908 132.544 77.517 132.544 69.875 124.902 L 45.709 100.736 L 100.339 100.736 Z';

/** The woven-E logo mark; size is its height. */
export function Mark({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 243.723 279.97" width={size * (243.723 / 279.97)} height={size} aria-hidden="true" style={{ display: 'block', color }}>
      <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** One of the design system's glyphs, drawn in currentColor. */
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const d = ICONS[name];
  return <svg width={size} height={size} viewBox={d.viewBox} fill="none" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d.body }} />;
}

/** The brand's code-tag voice: <tag> message </tag>. */
export function Tag({ tag, children, attr }: { tag: string; children?: ReactNode; attr?: ReactNode }) {
  return (
    <span className="tag">
      {'<' + tag}{attr}{'>'}
      {children != null && <> <b>{children}</b> {'</' + tag + '>'}</>}
    </span>
  );
}

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'mute' | 'mint';
export const Pill = ({ tone = 'mute', children }: { tone?: Tone; children: ReactNode }) => <span className={'pill pill-' + tone}>{children}</span>;

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-mark"><Mark size={36} /></span>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Metadata segments split by a hairline rule (no dot separators). Falsy parts are dropped. */
export function Meta({ parts, className }: { parts: ReactNode[]; className?: string }) {
  const xs = parts.filter(p => p !== null && p !== undefined && p !== false && p !== '');
  return <span className={'meta' + (className ? ' ' + className : '')}>{xs.map((p, i) => <span key={i}>{p}</span>)}</span>;
}
