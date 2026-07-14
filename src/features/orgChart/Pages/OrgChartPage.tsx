'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Search, Users, ChevronRight, ChevronDown, ZoomIn, ZoomOut, RotateCcw, Printer, X, Mail, Briefcase, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { useOrgChart, type OrgTreeNode } from '../Hooks/useOrgChart';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-brand-primary', 'bg-teal-500', 'bg-rose-500',
];
function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500', on_leave: 'bg-blue-400', suspended: 'bg-yellow-400', terminated: 'bg-red-400', inactive: 'bg-gray-400',
};

// Collects every node id on the path from root to `targetId`, so search can
// auto-expand exactly the branches needed to reveal a match.
function findAncestorPath(nodes: OrgTreeNode[], targetId: string, path: string[] = []): string[] | null {
  for (const n of nodes) {
    if (String(n._id) === targetId) return [...path, String(n._id)];
    const found = findAncestorPath(n.reports, targetId, [...path, String(n._id)]);
    if (found) return found;
  }
  return null;
}

function matchesQuery(n: OrgTreeNode, q: string) {
  return n.fullName.toLowerCase().includes(q) || (n.designation ?? '').toLowerCase().includes(q);
}

function nodeSubtreeMatches(n: OrgTreeNode, q: string): boolean {
  if (matchesQuery(n, q)) return true;
  return n.reports.some(r => nodeSubtreeMatches(r, q));
}

function TreeNode({ node, locale, expanded, onToggle, onSelect, selectedId, searchQuery, deptFilter, depth = 0 }: {
  node: OrgTreeNode; locale: string;
  expanded: Set<string>; onToggle: (id: string) => void;
  onSelect: (n: OrgTreeNode) => void; selectedId: string | null;
  searchQuery: string; deptFilter: string; depth?: number;
}) {
  const id = String(node._id);
  const isOpen = expanded.has(id);
  const hasChildren = node.reports.length > 0;
  const q = searchQuery.trim().toLowerCase();
  const isMatch = q ? matchesQuery(node, q) : false;
  const subtreeHasMatch = q ? nodeSubtreeMatches(node, q) : true;
  const deptDimmed = deptFilter && node.department !== deptFilter;

  if (q && !subtreeHasMatch) return null;

  return (
    <div className="relative">
      <div
        id={`org-node-${id}`}
        className={cn(
          'flex items-center gap-2 py-1.5 pr-2 rounded-lg group',
          depth > 0 && 'ml-5 border-l border-brand-border/60 pl-4',
        )}
      >
        {hasChildren ? (
          <button onClick={() => onToggle(id)} className="h-5 w-5 shrink-0 flex items-center justify-center text-brand-text-secondary hover:text-brand-text">
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        <button
          onClick={() => onSelect(node)}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border transition-all text-left',
            selectedId === id ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border/60 bg-brand-bg-soft hover:border-brand-border-strong',
            isMatch && 'ring-2 ring-amber-400/70',
            deptDimmed && 'opacity-30',
          )}
        >
          <div className="relative shrink-0">
            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-[11px]', avatarColor(node.fullName))}>
              {initials(node.fullName)}
            </div>
            <span className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1e293b]', STATUS_COLORS[node.status] ?? 'bg-gray-400')} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-text truncate">{node.fullName}</p>
            <p className="text-[11px] text-brand-text-secondary truncate">{node.designation || 'Staff'}</p>
          </div>
          {hasChildren && <span className="text-[10px] text-brand-text-muted ml-1 shrink-0">({node.reports.length})</span>}
        </button>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {node.reports.map(child => (
            <TreeNode
              key={String(child._id)} node={child} locale={locale}
              expanded={expanded} onToggle={onToggle} onSelect={onSelect} selectedId={selectedId}
              searchQuery={searchQuery} deptFilter={deptFilter} depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ node, locale, onClose }: { node: OrgTreeNode; locale: string; onClose: () => void }) {
  return (
    <div className="w-72 shrink-0 bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-4 h-fit sticky top-4">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('h-12 w-12 rounded-full flex items-center justify-center text-white font-bold', avatarColor(node.fullName))}>
          {initials(node.fullName)}
        </div>
        <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-4 w-4" /></button>
      </div>
      <p className="text-sm font-bold text-brand-text">{node.fullName}</p>
      <p className="text-xs text-brand-text-secondary mb-3">{node.designation || 'Staff'}</p>
      <div className="space-y-2 text-xs text-brand-text-secondary">
        <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-brand-text-muted" /> {node.department}</p>
        {node.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-brand-text-muted" /> {node.email}</p>}
        <p className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-brand-text-muted" /> {node.staffNumber}</p>
        <p className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[node.status] ?? 'bg-gray-400')} />
          <span className="capitalize">{node.status.replace(/_/g, ' ')}</span>
        </p>
        {node.reports.length > 0 && <p className="text-brand-text-secondary">{node.reports.length} direct report{node.reports.length !== 1 ? 's' : ''}</p>}
      </div>
      <Link href={`/${locale}/employees/${node._id}`} className="mt-4 flex items-center justify-center h-8 w-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-lg transition-colors">
        View full profile
      </Link>
    </div>
  );
}

function collectAllIds(nodes: OrgTreeNode[], acc: Set<string> = new Set()): Set<string> {
  for (const n of nodes) { acc.add(String(n._id)); collectAllIds(n.reports, acc); }
  return acc;
}
function findNode(nodes: OrgTreeNode[], id: string): OrgTreeNode | null {
  for (const n of nodes) {
    if (String(n._id) === id) return n;
    const found = findNode(n.reports, id);
    if (found) return found;
  }
  return null;
}

export default function OrgChartPage() {
  const locale = useLocale();
  const { data, loading, error, refetch } = useOrgChart();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<OrgTreeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const allIds = useMemo(() => data ? collectAllIds(data.tree) : new Set<string>(), [data]);

  // Auto-expand ancestor chains of every match while searching.
  const effectiveExpanded = useMemo(() => {
    if (!data || !search.trim()) return expanded;
    const q = search.trim().toLowerCase();
    const toExpand = new Set(expanded);
    const walk = (nodes: OrgTreeNode[], path: string[]) => {
      for (const n of nodes) {
        const newPath = [...path, String(n._id)];
        if (matchesQuery(n, q)) newPath.forEach(id => toExpand.add(id));
        walk(n.reports, newPath);
      }
    };
    walk(data.tree, []);
    return toExpand;
  }, [data, search, expanded]);

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const expandAll = () => setExpanded(new Set(allIds));
  const collapseAll = () => setExpanded(new Set());

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5 pb-6">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #org-chart-print, #org-chart-print * { visibility: visible; }
          #org-chart-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-brand-text">Org Chart</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">
            {data ? `${data.total} people, built from reporting lines` : 'Visual company hierarchy'}
          </p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
          <Printer className="h-4 w-4" /> Print / Export PDF
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or title…"
            className="h-9 pl-9 pr-4 rounded-full border border-brand-border bg-brand-bg-soft text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 w-56"
          />
        </div>

        {data && (
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-full border border-brand-border bg-brand-bg-soft text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/40 appearance-none"
          >
            <option value="">All Departments</option>
            {data.departments.map(d => (
              <option key={d.name} value={d.name}>{d.name} ({d.employees.length})</option>
            ))}
          </select>
        )}

        <button onClick={expandAll} className="text-xs text-brand-text-secondary hover:text-brand-text px-3 h-9 border border-brand-border rounded-full bg-brand-bg-soft transition-colors">Expand all</button>
        <button onClick={collapseAll} className="text-xs text-brand-text-secondary hover:text-brand-text px-3 h-9 border border-brand-border rounded-full bg-brand-bg-soft transition-colors">Collapse all</button>

        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="h-9 w-9 flex items-center justify-center border border-brand-border bg-brand-bg-soft rounded-lg text-brand-text-secondary hover:text-brand-text transition-colors"><ZoomOut className="h-4 w-4" /></button>
          <span className="text-xs text-brand-text-secondary w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-9 w-9 flex items-center justify-center border border-brand-border bg-brand-bg-soft rounded-lg text-brand-text-secondary hover:text-brand-text transition-colors"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={() => setZoom(1)} className="h-9 w-9 flex items-center justify-center border border-brand-border bg-brand-bg-soft rounded-lg text-brand-text-secondary hover:text-brand-text transition-colors"><RotateCcw className="h-4 w-4" /></button>
        </div>
      </div>

      <Wrapper loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.tree.length === 0 ? (
              <div className="bg-brand-bg-soft rounded-xl border border-brand-border/60 py-20 flex flex-col items-center gap-3">
                <Users className="h-10 w-10 text-brand-text-muted" />
                <p className="font-semibold text-brand-text-secondary">No employees found</p>
              </div>
            ) : (
              <div className="flex gap-4 items-start">
                <div ref={containerRef} className="flex-1 bg-brand-bg-soft rounded-xl border border-brand-border/60 p-5 overflow-auto max-h-[70vh]">
                  <div id="org-chart-print" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.15s' }}>
                    {data.tree.map(root => (
                      <TreeNode
                        key={String(root._id)} node={root} locale={locale}
                        expanded={effectiveExpanded} onToggle={toggle}
                        onSelect={setSelected} selectedId={selected ? String(selected._id) : null}
                        searchQuery={search} deptFilter={deptFilter}
                      />
                    ))}
                  </div>
                </div>
                {selected && (() => {
                  const fresh = findNode(data.tree, String(selected._id));
                  return fresh ? <DetailPanel node={fresh} locale={locale} onClose={() => setSelected(null)} /> : null;
                })()}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Employees', value: data.total, color: 'text-brand-text' },
                { label: 'Departments', value: data.departments.length, color: 'text-violet-400' },
                { label: 'Active', value: data.departments.flatMap(d => d.employees).filter(e => e.status === 'active').length, color: 'text-emerald-400' },
                { label: 'On Leave', value: data.departments.flatMap(d => d.employees).filter(e => e.status === 'on_leave').length, color: 'text-blue-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-brand-bg-soft rounded-xl border border-brand-border/60 p-4 text-center">
                  <p className={cn('text-2xl font-black leading-none', stat.color)}>{stat.value}</p>
                  <p className="text-[11px] text-brand-text-muted font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Wrapper>
    </div>
  );
}
