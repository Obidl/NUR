/** Temporary seed / demo media — not licensed Islamic audio. */
const PLACEHOLDER_HOSTS = [
  'soundhelix.com',
  'placehold.co',
  'example.com',
  'www.soundhelix.com',
];

export function isPlaceholderMediaUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return PLACEHOLDER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return true;
  }
}
