// Single source of truth for all colors and design values.
// Import from here instead of hardcoding hex values in components.

export const colors = {
  bg: {
    base:     '#0f172a',  // page background — darkest
    surface:  '#1e293b',  // cards, drawers, modals
    elevated: '#263344',  // hover states, dropdown items
    sunken:   '#0a1120',  // inputs inside cards
  },
  border: {
    default:  '#334155',
    subtle:   '#1e293b',
    strong:   '#475569',
    focus:    '#6366f1',
  },
  text: {
    primary:   '#f1f5f9',
    secondary: '#cbd5e1',
    muted:     '#94a3b8',
    disabled:  '#475569',
  },
  brand: {
    DEFAULT: '#6366f1',
    hover:   '#5558e8',
    light:   '#818cf8',
    subtle:  '#1e1b4b',
  },
  status: {
    active:   '#22c55e',
    inactive: '#64748b',
    pending:  '#f59e0b',
    approved: '#22c55e',
    declined: '#ef4444',
    draft:    '#64748b',
    locked:   '#8b5cf6',
    closed:   '#10b981',
  },
  module: {
    hr:      '#6366f1',
    recruit: '#f97316',
    leave:   '#22c55e',
    time:    '#06b6d4',
    perf:    '#8b5cf6',
    payroll: '#10b981',
    expense: '#f59e0b',
    tasks:   '#6366f1',
    comm:    '#ec4899',
    awards:  '#f59e0b',
    reports: '#3b82f6',
    it:      '#64748b',
    finance: '#10b981',
    settings:'#64748b',
  },
  stage: {
    applied:    '#3b82f6',
    screening:  '#f59e0b',
    interview:  '#8b5cf6',
    assessment: '#ec4899',
    offer:      '#22c55e',
    hired:      '#10b981',
    rejected:   '#ef4444',
  },
  leave: {
    annual:        '#6366f1',
    sick:          '#3b82f6',
    maternity:     '#8b5cf6',
    paternity:     '#06b6d4',
    unpaid:        '#64748b',
    compassionate: '#f59e0b',
    study:         '#10b981',
  },
  attendance: {
    present:  '#22c55e',
    late:     '#f59e0b',
    absent:   '#ef4444',
    leave:    '#3b82f6',
    holiday:  '#8b5cf6',
    weekend:  '#334155',
    break:    '#f97316',
    missing:  '#f97316',
  },
  priority: {
    high:   '#ef4444',
    medium: '#f59e0b',
    low:    '#64748b',
  },
} as const;

// Badge variant → Tailwind class string
export const badgeVariants = {
  // Status
  active:   'bg-green-900/40 text-green-400 border border-green-800',
  inactive: 'bg-slate-800 text-slate-400 border border-slate-700',
  pending:  'bg-amber-900/40 text-amber-400 border border-amber-800',
  approved: 'bg-green-900/40 text-green-400 border border-green-800',
  declined: 'bg-red-900/40 text-red-400 border border-red-800',
  rejected: 'bg-red-900/40 text-red-400 border border-red-800',
  draft:    'bg-slate-800 text-slate-400 border border-slate-700',
  locked:   'bg-purple-900/40 text-purple-400 border border-purple-800',
  closed:   'bg-emerald-900/40 text-emerald-400 border border-emerald-800',
  cancelled:'bg-slate-800 text-slate-400 border border-slate-700',
  // Priority
  high:     'bg-red-900/40 text-red-400 border border-red-800',
  medium:   'bg-amber-900/40 text-amber-400 border border-amber-800',
  low:      'bg-slate-800 text-slate-400 border border-slate-700',
  // Recruitment stages
  applied:    'bg-blue-900/40 text-blue-400 border border-blue-800',
  screening:  'bg-amber-900/40 text-amber-400 border border-amber-800',
  interview:  'bg-purple-900/40 text-purple-400 border border-purple-800',
  assessment: 'bg-pink-900/40 text-pink-400 border border-pink-800',
  offer:      'bg-green-900/40 text-green-400 border border-green-800',
  hired:      'bg-emerald-900/40 text-emerald-400 border border-emerald-800',
  // Employment type
  'full-time': 'bg-indigo-900/40 text-indigo-400 border border-indigo-800',
  'part-time': 'bg-cyan-900/40 text-cyan-400 border border-cyan-800',
  contract:    'bg-orange-900/40 text-orange-400 border border-orange-800',
  intern:      'bg-pink-900/40 text-pink-400 border border-pink-800',
  // Payroll cycle
  open:   'bg-blue-900/40 text-blue-400 border border-blue-800',
  review: 'bg-amber-900/40 text-amber-400 border border-amber-800',
  // Goal status
  'on-track': 'bg-green-900/40 text-green-400 border border-green-800',
  'at-risk':  'bg-amber-900/40 text-amber-400 border border-amber-800',
  behind:     'bg-red-900/40 text-red-400 border border-red-800',
  completed:  'bg-emerald-900/40 text-emerald-400 border border-emerald-800',
  // Generic
  default:  'bg-slate-800 text-slate-300 border border-slate-700',
  brand:    'bg-indigo-900/40 text-indigo-400 border border-indigo-800',
  info:     'bg-blue-900/40 text-blue-400 border border-blue-800',
  success:  'bg-green-900/40 text-green-400 border border-green-800',
  warning:  'bg-amber-900/40 text-amber-400 border border-amber-800',
  danger:   'bg-red-900/40 text-red-400 border border-red-800',
} as const;

export type BadgeVariantKey = keyof typeof badgeVariants;

export const spacing = {
  cardPadding:   '20px',
  cardPaddingLg: '24px',
  drawerWidth:   '480px',
  drawerWidthLg: '640px',
  sidebarWidth:  '240px',
  headerHeight:  '56px',
} as const;

export const radius = {
  card:   '12px',
  input:  '8px',
  button: '8px',
  badge:  '9999px',
} as const;
