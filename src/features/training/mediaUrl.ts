import { API_BASE_URL } from '@/configs/constants';

// Uploaded training files are stored as a relative path (e.g. "training/172...-slides.pdf")
// and served from the JWT-protected /uploads static route, which accepts the token as a
// query param for exactly this case (an <a>/<video>/<iframe> src can't send an Authorization
// header). A pasted external link (http/https) is used as-is. Matches the same convention
// already used for profilePhoto/receiptFile elsewhere in this app.
export function resolveMediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') ?? '' : '';
  return `${API_BASE_URL.replace(/\/api$/, '/uploads')}/${pathOrUrl}?token=${encodeURIComponent(token)}`;
}
