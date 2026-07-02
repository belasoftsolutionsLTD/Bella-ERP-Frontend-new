export const STAGE_CONFIG = {
  applied:             { label: 'Applied',     bgCls: 'bg-blue-500/10',    textCls: 'text-blue-400',    borderCls: 'border-blue-500/30',    dotCls: 'bg-blue-400'    },
  shortlisted:         { label: 'Shortlisted', bgCls: 'bg-amber-500/10',   textCls: 'text-amber-400',   borderCls: 'border-amber-500/30',   dotCls: 'bg-amber-400'   },
  interview_scheduled: { label: 'Interview',   bgCls: 'bg-violet-500/10',  textCls: 'text-violet-400',  borderCls: 'border-violet-500/30',  dotCls: 'bg-violet-400'  },
  offer_sent:          { label: 'Offer Sent',  bgCls: 'bg-emerald-500/10', textCls: 'text-emerald-400', borderCls: 'border-emerald-500/30', dotCls: 'bg-emerald-400' },
  hired:               { label: 'Hired',       bgCls: 'bg-emerald-500/10', textCls: 'text-emerald-400', borderCls: 'border-emerald-500/30', dotCls: 'bg-emerald-500' },
  rejected:            { label: 'Rejected',    bgCls: 'bg-red-500/10',     textCls: 'text-red-400',     borderCls: 'border-red-500/30',     dotCls: 'bg-red-400'     },
} as const;

export type StageKey = keyof typeof STAGE_CONFIG;
export const STAGES = Object.keys(STAGE_CONFIG) as StageKey[];

export function stageCfg(stage: string) {
  return STAGE_CONFIG[stage as StageKey] ?? {
    label: stage.replace(/_/g, ' '),
    bgCls: 'bg-gray-100', textCls: 'text-gray-600', borderCls: 'border-gray-200', dotCls: 'bg-gray-400',
  };
}

export const SOURCE_CONFIG: Record<string, { label: string; cls: string }> = {
  internal:  { label: 'Internal', cls: 'bg-slate-500/15 text-slate-400'   },
  linkedin:  { label: 'LinkedIn', cls: 'bg-blue-500/15 text-blue-400'     },
  indeed:    { label: 'Indeed',   cls: 'bg-red-500/15 text-red-400'       },
  referral:  { label: 'Referral', cls: 'bg-violet-500/15 text-violet-400' },
  website:   { label: 'Website',  cls: 'bg-teal-500/15 text-teal-400'     },
  hr_manual: { label: 'Manual',   cls: 'bg-orange-500/15 text-orange-400' },
  other:     { label: 'Other',    cls: 'bg-gray-500/15 text-gray-400'     },
};

export const KANBAN_COLUMN_COLORS: Record<string, { topBorder: string; badgeCls: string }> = {
  applied:             { topBorder: 'border-t-blue-500',    badgeCls: 'bg-blue-500/15 text-blue-400'    },
  shortlisted:         { topBorder: 'border-t-amber-500',   badgeCls: 'bg-amber-500/15 text-amber-400'  },
  interview_scheduled: { topBorder: 'border-t-violet-500',  badgeCls: 'bg-violet-500/15 text-violet-400'},
  offer_sent:          { topBorder: 'border-t-emerald-500', badgeCls: 'bg-emerald-500/15 text-emerald-400'},
  hired:               { topBorder: 'border-t-emerald-500', badgeCls: 'bg-emerald-500/15 text-emerald-400'},
  rejected:            { topBorder: 'border-t-red-500',     badgeCls: 'bg-red-500/15 text-red-400'      },
};
