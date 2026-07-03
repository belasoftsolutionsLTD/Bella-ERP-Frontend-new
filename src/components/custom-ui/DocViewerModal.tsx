'use client';

import { X, Download, ExternalLink, FileX } from 'lucide-react';

interface Props {
  /** Full URL to the document (include auth token as query param if needed) */
  url: string;
  /** Original file name — used to decide how to render it */
  fileName: string;
  /** Optional download URL if different from the viewer URL */
  downloadUrl?: string;
  onClose: () => void;
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const PDF_EXTS   = ['pdf'];

function ext(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function DocViewerModal({ url, fileName, downloadUrl, onClose }: Props) {
  const fileExt   = ext(fileName);
  const isImage   = IMAGE_EXTS.includes(fileExt);
  const isPDF     = PDF_EXTS.includes(fileExt);
  const canPreview = isImage || isPDF;
  const dl        = downloadUrl ?? url;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/80 backdrop-blur-sm" onClick={onClose}>
      {/* Header bar */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-slate-200 truncate max-w-md">{fileName}</p>
        <div className="flex items-center gap-2">
          <a
            href={dl}
            download={fileName}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open tab
          </a>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto p-4"
        onClick={e => e.stopPropagation()}
      >
        {isImage ? (
          <img
            src={url}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        ) : isPDF ? (
          <iframe
            src={url}
            title={fileName}
            className="w-full h-full rounded-lg border-0"
            style={{ minHeight: '80vh' }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <FileX className="h-16 w-16 opacity-30" />
            <p className="text-sm font-semibold">Preview not available for .{fileExt} files</p>
            <a
              href={dl}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              <Download className="h-4 w-4" /> Download to view
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
