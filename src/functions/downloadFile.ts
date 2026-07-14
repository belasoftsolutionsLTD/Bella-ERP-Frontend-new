'use client';

import { API_BASE_URL } from '@/configs/constants';

/**
 * Resolves a raw stored upload path (which historically varies — relative
 * `uploads/x.pdf` from multer's `file.path`, or absolute `/uploads/sub/x.pdf`
 * from generated documents) into a full, fetchable backend URL.
 */
export function resolveUploadUrl(storedPath: string): string {
  const rest = storedPath.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `${API_BASE_URL.replace(/\/api$/, '')}/uploads/${rest}`;
}

/**
 * Download a file from an authenticated API endpoint.
 * Uses the Bearer token from sessionStorage so the browser sends the auth header,
 * unlike direct <a href> navigation which never sends Authorization headers.
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const res = await fetch(url, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const msg = json?.message ?? `Download failed (${res.status})`;
    throw new Error(msg);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  // Detect filename from Content-Disposition header if available
  const disposition = res.headers.get('content-disposition');
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)/i);
    if (match) filename = decodeURIComponent(match[1]);
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

/** Open an auth-protected file in a new browser tab (e.g. for printing). */
export async function openFile(url: string): Promise<void> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
  const res = await fetch(url, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? `Failed to open (${res.status})`);
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}
