// Which project this browser tab is for, from the address:
//   oneless.embed.design            → "oneless"
//   embed-client-web-xyz.ondigitalocean.app, localhost → none (the project
//   picker), unless ?project=oneless is given, which is remembered for the tab
//   so previews and local development can open any project.
export const ROOT_DOMAIN = 'embed.design';

export function projectAddress(sub: string) {
  return `https://${sub}.${ROOT_DOMAIN}`;
}

export function currentSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('.' + ROOT_DOMAIN)) {
    const label = host.slice(0, -(ROOT_DOMAIN.length + 1));
    if (label && !label.includes('.') && label !== 'www') return label;
    return null;
  }
  const q = new URLSearchParams(window.location.search).get('project');
  try {
    if (q !== null) {
      if (q) sessionStorage.setItem('embed_project', q.toLowerCase());
      else sessionStorage.removeItem('embed_project');
    }
    return sessionStorage.getItem('embed_project');
  } catch {
    return q ? q.toLowerCase() : null;
  }
}

/** Link to a project from the picker: its subdomain in production, ?project= elsewhere. */
export function projectHref(sub: string) {
  if (typeof window !== 'undefined' && window.location.hostname.toLowerCase().endsWith('.' + ROOT_DOMAIN)) return projectAddress(sub);
  return `/?project=${encodeURIComponent(sub)}`;
}
