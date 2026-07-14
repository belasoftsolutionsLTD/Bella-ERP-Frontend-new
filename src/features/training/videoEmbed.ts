// A plain <video src="..."> only works for a direct media file (mp4/webm/ogg) — it
// cannot play a YouTube/Vimeo *page* URL, since that's an HTML document, not a decodable
// stream. This resolves any pasted URL to either an embeddable iframe (YouTube/Vimeo) or
// a direct-file <video>, so authors can just paste whatever link they have.

export type VideoEmbed =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'vimeo'; embedUrl: string }
  | { kind: 'file'; url: string };

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i,
];
const VIMEO_PATTERN = /vimeo\.com\/(?:video\/)?(\d+)/i;

export function resolveVideoEmbed(url: string): VideoEmbed | null {
  if (!url) return null;
  const trimmed = url.trim();

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return { kind: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${match[1]}` };
  }

  const vimeoMatch = trimmed.match(VIMEO_PATTERN);
  if (vimeoMatch) return { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };

  return { kind: 'file', url: trimmed };
}
