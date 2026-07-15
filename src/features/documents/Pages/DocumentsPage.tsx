'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Search, FileText, Upload, Download, X, FolderOpen, ExternalLink,
  FileImage, FileSpreadsheet, File, Eye,
} from 'lucide-react';
import { DocViewerModal } from '@/components/custom-ui/DocViewerModal';
import { cn } from '@/lib/utils';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { useDocuments } from '../Hooks/useDocuments';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { downloadFile } from '@/functions/downloadFile';

const DOC_TYPES = [
  { value: '',            label: 'All Documents',      icon: FolderOpen },
  { value: 'contract',    label: 'Contracts',          icon: FileText },
  { value: 'payslip',     label: 'Payslips',           icon: FileSpreadsheet },
  { value: 'policy',      label: 'Company Policies',   icon: FileText },
  { value: 'id',          label: 'ID & Identification',icon: FileText },
  { value: 'certificate', label: 'Certificates',       icon: FileText },
  { value: 'other',       label: 'Other',              icon: File },
];

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-brand-primary', 'bg-teal-500', 'bg-rose-500',
];
function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function fileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext))
    return <FileImage className="h-8 w-8 text-purple-500" />;
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
  if (['pdf'].includes(ext))
    return <FileText className="h-8 w-8 text-red-500" />;
  if (['doc', 'docx'].includes(ext))
    return <FileText className="h-8 w-8 text-blue-500" />;
  return <File className="h-8 w-8 text-slate-400" />;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function UploadDrawer({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [docType, setDocType] = useState('other');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useState(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=500`,
      showToast: false,
      thenFn: (r) => setEmployees(r.data?.data ?? r.data ?? []),
    });
  });

  const filtered = useMemo(() =>
    employees.filter(e => e.fullName.toLowerCase().includes(search.toLowerCase()) || (e.staffNumber ?? '').includes(search)),
    [employees, search],
  );

  const handleUpload = () => {
    if (!selectedEmp || !file) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append('document', file);
    fd.append('docType', docType);
    apiCallFunction({
      url: `${API_BASE_URL}/employees/${selectedEmp._id}/documents`,
      method: 'POST',
      data: fd,
      thenFn: () => { onUploaded(); onClose(); },
      finallyFn: () => setSubmitting(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md max-h-[90vh] bg-white shadow-2xl rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-bold text-slate-800">Upload Document</p>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Employee search */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
            {selectedEmp ? (
              <div className="flex items-center gap-3 bg-brand-primary/10 border border-brand-primary/20 rounded-lg px-3 py-2.5">
                <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(selectedEmp.fullName))}>
                  {selectedEmp.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-primary truncate">{selectedEmp.fullName}</p>
                  <p className="text-xs text-brand-primary">{selectedEmp.staffNumber}</p>
                </div>
                <button onClick={() => setSelectedEmp(null)} className="text-brand-primary/60 hover:text-brand-primary-hover">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search employee…"
                    className="w-full pl-9 pr-3 h-9 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
                {search && (
                  <div className="border border-brand-border rounded-lg max-h-40 overflow-y-auto">
                    {filtered.slice(0, 8).map(e => (
                      <button key={e._id} onClick={() => { setSelectedEmp(e); setSearch(''); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 text-sm border-b border-brand-border last:border-0">
                        <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(e.fullName))}>
                          {e.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{e.fullName}</p>
                          <p className="text-[11px] text-slate-400">{e.staffNumber} · {e.department}</p>
                        </div>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-3">No employees found</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document type */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Document Type *</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full h-9 border border-brand-border rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              {DOC_TYPES.filter(t => t.value).map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* File upload */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label>
            <label className={cn(
              'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors',
              file ? 'border-emerald-400 bg-emerald-50' : 'border-brand-border hover:border-indigo-300 hover:bg-indigo-50',
            )}>
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <>
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 text-center">{file.name}</p>
                  <p className="text-xs text-emerald-500">{formatBytes(file.size)}</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-brand-text-secondary" />
                  <p className="text-sm text-slate-500">Click to browse or drag & drop</p>
                  <p className="text-xs text-slate-400">PDF, DOC, XLS, PNG, JPG · max 25 MB</p>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 h-9 border border-brand-border rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedEmp || !file || submitting}
            className="flex-1 h-9 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload className="h-3.5 w-3.5" />
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const locale = useLocale();
  const [activeFolder, setActiveFolder] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; fileName: string; downloadUrl: string } | null>(null);

  function docViewUrl(employeeId: string, docId: string) {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') ?? '') : '';
    return `${API_BASE_URL}/employees/${employeeId}/documents/${docId}/download?token=${token}`;
  }
  function docDownloadUrl(employeeId: string, docId: string) {
    return `${API_BASE_URL}/employees/${employeeId}/documents/${docId}/download`;
  }

  const { documents: rawDocuments, total, loading, error, refetch } = useDocuments(activeFolder, search);

  const departments = useMemo(() => [...new Set(rawDocuments.map(d => d.department).filter(Boolean))].sort(), [rawDocuments]);
  const documents = useMemo(() => deptFilter ? rawDocuments.filter(d => d.department === deptFilter) : rawDocuments, [rawDocuments, deptFilter]);

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-brand-text">Document Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} document{total !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      <div className="flex gap-5">

        {/* Folder sidebar */}
        <div className="w-52 shrink-0">
          <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
            {DOC_TYPES.map(({ value, label, icon: Icon }) => {
              const active = activeFolder === value;
              return (
                <button
                  key={value}
                  onClick={() => setActiveFolder(value)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors border-l-2',
                    active
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold'
                      : 'border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-800',
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-brand-primary' : 'text-slate-400')} />
                  <span className="flex-1 truncate">{label}</span>
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', active ? 'bg-indigo-100 text-brand-primary' : 'bg-gray-100 text-slate-500')}>
                    {activeFolder === value || value === '' ? total : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document list */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search + department filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by file name or employee…"
                className="w-full pl-9 pr-4 h-9 border border-brand-border bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {departments.length > 0 && (
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="h-9 border border-brand-border bg-white rounded-lg px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>

          <Wrapper loading={loading} error={error} onRetry={refetch}>
            {documents.length === 0 ? (
              <div className="bg-white rounded-xl border border-brand-border shadow-sm py-20 flex flex-col items-center gap-3 text-center">
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <FolderOpen className="h-7 w-7 text-gray-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">No documents found</p>
                  <p className="text-sm text-slate-400 mt-0.5">Upload documents to see them here.</p>
                </div>
                <button
                  onClick={() => setShowUpload(true)}
                  className="mt-2 flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50/70 border-b border-brand-border text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Document</span>
                  <span>Employee</span>
                  <span>Type</span>
                  <span>Uploaded</span>
                  <span />
                </div>

                <div className="divide-y divide-gray-50">
                  {documents.map(doc => (
                    <div key={String(doc._id)} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-gray-50/60 transition-colors group">
                      {/* File */}
                      <div className="flex items-center gap-3 min-w-0">
                        {fileIcon(doc.fileName)}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{doc.fileName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{doc.department}</p>
                        </div>
                      </div>

                      {/* Employee */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0', avatarColor(doc.employeeName))}>
                          {doc.employeeName.charAt(0)}
                        </div>
                        <Link href={`/${locale}/employees/${doc.employeeId}`} className="text-xs font-medium text-slate-700 hover:text-brand-primary truncate transition-colors">
                          {doc.employeeName}
                        </Link>
                      </div>

                      {/* Type */}
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium capitalize">
                          {doc.docType || 'other'}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="text-xs text-slate-400">{formatDate(doc.uploadedAt)}</div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewingDoc({ url: docViewUrl(doc.employeeId, String(doc._id)), fileName: doc.fileName ?? 'document', downloadUrl: docDownloadUrl(doc.employeeId, String(doc._id)) })}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                          title="View document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => downloadFile(docDownloadUrl(doc.employeeId, String(doc._id)), doc.fileName ?? 'document').catch(err => alert(err.message))}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/${locale}/employees/${doc.employeeId}`}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="View employee"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Wrapper>
        </div>
      </div>

      {showUpload && (
        <UploadDrawer
          onClose={() => setShowUpload(false)}
          onUploaded={refetch}
        />
      )}

      {viewingDoc && (
        <DocViewerModal
          url={viewingDoc.url}
          fileName={viewingDoc.fileName}
          downloadUrl={viewingDoc.downloadUrl}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}
