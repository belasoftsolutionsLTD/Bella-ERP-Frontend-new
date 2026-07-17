'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';
import { BracketEditor } from './BracketEditor';

interface Bracket  { limit: number | null; rate: number }
interface Tier     { limit: number; rate: number }
interface StatDed  {
  key: string; name: string; enabled: boolean;
  type: 'flat_rate' | 'tiered_cap' | 'fixed_amount';
  rate?: number; tiers?: Tier[]; amount?: number; cap?: number | null;
}
interface TaxCfg {
  currency: string; currencySymbol: string;
  incomeTax: { name: string; enabled: boolean; deductPensionFirst: boolean; personalRelief: number; brackets: Bracket[] };
  statutoryDeductions: StatDed[];
}

const CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'AFN', symbol: '؋',   name: 'Afghan Afghani' },
  { code: 'ALL', symbol: 'L',   name: 'Albanian Lek' },
  { code: 'AMD', symbol: '֏',   name: 'Armenian Dram' },
  { code: 'AOA', symbol: 'Kz',  name: 'Angolan Kwanza' },
  { code: 'ARS', symbol: '$',   name: 'Argentine Peso' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'AZN', symbol: '₼',   name: 'Azerbaijani Manat' },
  { code: 'BAM', symbol: 'KM',  name: 'Bosnia-Herzegovina Convertible Mark' },
  { code: 'BDT', symbol: '৳',   name: 'Bangladeshi Taka' },
  { code: 'BGN', symbol: 'лв',  name: 'Bulgarian Lev' },
  { code: 'BHD', symbol: 'BD',  name: 'Bahraini Dinar' },
  { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
  { code: 'BMD', symbol: '$',   name: 'Bermudian Dollar' },
  { code: 'BND', symbol: 'B$',  name: 'Brunei Dollar' },
  { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano' },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real' },
  { code: 'BSD', symbol: '$',   name: 'Bahamian Dollar' },
  { code: 'BTN', symbol: 'Nu',  name: 'Bhutanese Ngultrum' },
  { code: 'BWP', symbol: 'P',   name: 'Botswanan Pula' },
  { code: 'BYN', symbol: 'Br',  name: 'Belarusian Ruble' },
  { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'CDF', symbol: 'FC',  name: 'Congolese Franc' },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc' },
  { code: 'CLP', symbol: '$',   name: 'Chilean Peso' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan' },
  { code: 'COP', symbol: '$',   name: 'Colombian Peso' },
  { code: 'CRC', symbol: '₡',   name: 'Costa Rican Colón' },
  { code: 'CVE', symbol: '$',   name: 'Cape Verdean Escudo' },
  { code: 'CZK', symbol: 'Kč',  name: 'Czech Koruna' },
  { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' },
  { code: 'DKK', symbol: 'kr',  name: 'Danish Krone' },
  { code: 'DOP', symbol: '$',   name: 'Dominican Peso' },
  { code: 'DZD', symbol: 'دج',  name: 'Algerian Dinar' },
  { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound' },
  { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa' },
  { code: 'ETB', symbol: 'Br',  name: 'Ethiopian Birr' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' },
  { code: 'GBP', symbol: '£',   name: 'British Pound Sterling' },
  { code: 'GEL', symbol: '₾',   name: 'Georgian Lari' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'GMD', symbol: 'D',   name: 'Gambian Dalasi' },
  { code: 'GNF', symbol: 'FG',  name: 'Guinean Franc' },
  { code: 'GTQ', symbol: 'Q',   name: 'Guatemalan Quetzal' },
  { code: 'GYD', symbol: 'G$',  name: 'Guyanese Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'HNL', symbol: 'L',   name: 'Honduran Lempira' },
  { code: 'HRK', symbol: 'kn',  name: 'Croatian Kuna' },
  { code: 'HTG', symbol: 'G',   name: 'Haitian Gourde' },
  { code: 'HUF', symbol: 'Ft',  name: 'Hungarian Forint' },
  { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah' },
  { code: 'ILS', symbol: '₪',   name: 'Israeli New Shekel' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar' },
  { code: 'IRR', symbol: '﷼',   name: 'Iranian Rial' },
  { code: 'ISK', symbol: 'kr',  name: 'Icelandic Króna' },
  { code: 'JMD', symbol: 'J$',  name: 'Jamaican Dollar' },
  { code: 'JOD', symbol: 'JD',  name: 'Jordanian Dinar' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'KGS', symbol: 'лв',  name: 'Kyrgystani Som' },
  { code: 'KHR', symbol: '៛',   name: 'Cambodian Riel' },
  { code: 'KMF', symbol: 'CF',  name: 'Comorian Franc' },
  { code: 'KRW', symbol: '₩',   name: 'South Korean Won' },
  { code: 'KWD', symbol: 'KD',  name: 'Kuwaiti Dinar' },
  { code: 'KYD', symbol: 'CI$', name: 'Cayman Islands Dollar' },
  { code: 'KZT', symbol: '₸',   name: 'Kazakhstani Tenge' },
  { code: 'LAK', symbol: '₭',   name: 'Laotian Kip' },
  { code: 'LBP', symbol: 'L£',  name: 'Lebanese Pound' },
  { code: 'LKR', symbol: '₨',   name: 'Sri Lankan Rupee' },
  { code: 'LRD', symbol: 'L$',  name: 'Liberian Dollar' },
  { code: 'LSL', symbol: 'L',   name: 'Lesotho Loti' },
  { code: 'LYD', symbol: 'LD',  name: 'Libyan Dinar' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
  { code: 'MDL', symbol: 'L',   name: 'Moldovan Leu' },
  { code: 'MGA', symbol: 'Ar',  name: 'Malagasy Ariary' },
  { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar' },
  { code: 'MMK', symbol: 'K',   name: 'Myanmar Kyat' },
  { code: 'MNT', symbol: '₮',   name: 'Mongolian Tugrik' },
  { code: 'MOP', symbol: 'P',   name: 'Macanese Pataca' },
  { code: 'MRU', symbol: 'UM',  name: 'Mauritanian Ouguiya' },
  { code: 'MUR', symbol: '₨',   name: 'Mauritian Rupee' },
  { code: 'MVR', symbol: 'Rf',  name: 'Maldivian Rufiyaa' },
  { code: 'MWK', symbol: 'MK',  name: 'Malawian Kwacha' },
  { code: 'MXN', symbol: '$',   name: 'Mexican Peso' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit' },
  { code: 'MZN', symbol: 'MT',  name: 'Mozambican Metical' },
  { code: 'NAD', symbol: 'N$',  name: 'Namibian Dollar' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },
  { code: 'NIO', symbol: 'C$',  name: 'Nicaraguan Córdoba' },
  { code: 'NOK', symbol: 'kr',  name: 'Norwegian Krone' },
  { code: 'NPR', symbol: '₨',   name: 'Nepalese Rupee' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial' },
  { code: 'PAB', symbol: 'B/.',  name: 'Panamanian Balboa' },
  { code: 'PEN', symbol: 'S/',  name: 'Peruvian Sol' },
  { code: 'PGK', symbol: 'K',   name: 'Papua New Guinean Kina' },
  { code: 'PHP', symbol: '₱',   name: 'Philippine Peso' },
  { code: 'PKR', symbol: '₨',   name: 'Pakistani Rupee' },
  { code: 'PLN', symbol: 'zł',  name: 'Polish Zloty' },
  { code: 'PYG', symbol: '₲',   name: 'Paraguayan Guarani' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'RSD', symbol: 'din', name: 'Serbian Dinar' },
  { code: 'RUB', symbol: '₽',   name: 'Russian Ruble' },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar' },
  { code: 'SCR', symbol: '₨',   name: 'Seychellois Rupee' },
  { code: 'SDG', symbol: '£',   name: 'Sudanese Pound' },
  { code: 'SEK', symbol: 'kr',  name: 'Swedish Krona' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'SLL', symbol: 'Le',  name: 'Sierra Leonean Leone' },
  { code: 'SOS', symbol: 'Sh',  name: 'Somali Shilling' },
  { code: 'SRD', symbol: '$',   name: 'Surinamese Dollar' },
  { code: 'STN', symbol: 'Db',  name: 'São Tomé & Príncipe Dobra' },
  { code: 'SVC', symbol: '₡',   name: 'Salvadoran Colón' },
  { code: 'SYP', symbol: '£',   name: 'Syrian Pound' },
  { code: 'SZL', symbol: 'L',   name: 'Swazi Lilangeni' },
  { code: 'THB', symbol: '฿',   name: 'Thai Baht' },
  { code: 'TJS', symbol: 'SM',  name: 'Tajikistani Somoni' },
  { code: 'TMT', symbol: 'T',   name: 'Turkmenistani Manat' },
  { code: 'TND', symbol: 'DT',  name: 'Tunisian Dinar' },
  { code: 'TOP', symbol: 'T$',  name: 'Tongan Paʻanga' },
  { code: 'TRY', symbol: '₺',   name: 'Turkish Lira' },
  { code: 'TTD', symbol: 'TT$', name: 'Trinidad & Tobago Dollar' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'UAH', symbol: '₴',   name: 'Ukrainian Hryvnia' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'UYU', symbol: '$U',  name: 'Uruguayan Peso' },
  { code: 'UZS', symbol: 'лв',  name: 'Uzbekistan Som' },
  { code: 'VES', symbol: 'Bs.S', name: 'Venezuelan Bolívar' },
  { code: 'VND', symbol: '₫',   name: 'Vietnamese Dong' },
  { code: 'VUV', symbol: 'VT',  name: 'Vanuatu Vatu' },
  { code: 'WST', symbol: 'WS$', name: 'Samoan Tala' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
  { code: 'XCD', symbol: 'EC$', name: 'East Caribbean Dollar' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  { code: 'XPF', symbol: 'Fr',  name: 'CFP Franc' },
  { code: 'YER', symbol: '﷼',   name: 'Yemeni Rial' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
  { code: 'ZMW', symbol: 'ZK',  name: 'Zambian Kwacha' },
  { code: 'ZWL', symbol: 'Z$',  name: 'Zimbabwean Dollar' },
];

const EMPTY_STATUTORY: StatDed = {
  key: '', name: '', enabled: true, type: 'flat_rate', rate: 0, cap: null,
};
const DEDUCTION_TYPES = [
  { value: 'flat_rate',     label: '% of gross pay' },
  { value: 'tiered_cap',   label: 'Tiered (like NSSF)' },
  { value: 'fixed_amount', label: 'Fixed monthly amount' },
];

const Input = ({ label, value, onChange, type = 'text', placeholder = '', className = '' }: any) => (
  <div className={cn('space-y-1', className)}>
    <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
    />
  </div>
);

const Toggle = ({ label, checked, onChange, description = '' }: any) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-foreground/40">{description}</p>}
    </div>
    <button onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', checked ? 'bg-primary' : 'bg-gray-200')}>
      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-1')} />
    </button>
  </div>
);

export function TaxConfigPanel() {
  const [cfg, setCfg]             = useState<TaxCfg | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/config/tax-config`,
      showToast: false,
      thenFn: r => setCfg(r.data),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    if (!cfg) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/config/tax-config`,
      method: 'PUT',
      data: cfg,
      finallyFn: () => setSaving(false),
    });
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const patch = (partial: Partial<TaxCfg>) => setCfg(prev => prev ? { ...prev, ...partial } : prev);

  const patchIT = (partial: Partial<TaxCfg['incomeTax']>) =>
    setCfg(prev => prev ? { ...prev, incomeTax: { ...prev.incomeTax, ...partial } } : prev);

  const setBrackets = (brackets: Bracket[]) => patchIT({ brackets });

  const updateDed = (i: number, partial: Partial<StatDed>) =>
    setCfg(prev => {
      if (!prev) return prev;
      const next = prev.statutoryDeductions.map((d, idx) => idx === i ? { ...d, ...partial } : d);
      return { ...prev, statutoryDeductions: next };
    });

  const addDed = () => setCfg(prev => prev
    ? { ...prev, statutoryDeductions: [...prev.statutoryDeductions, { ...EMPTY_STATUTORY, key: `custom_${Date.now()}` }] }
    : prev);

  const removeDed = (i: number) => setCfg(prev => prev
    ? { ...prev, statutoryDeductions: prev.statutoryDeductions.filter((_, idx) => idx !== i) }
    : prev);

  const updateTier = (dedIdx: number, tierIdx: number, key: keyof Tier, val: string) =>
    setCfg(prev => {
      if (!prev) return prev;
      const next = prev.statutoryDeductions.map((d, di) => {
        if (di !== dedIdx) return d;
        const tiers = (d.tiers ?? []).map((t, ti) =>
          ti === tierIdx ? { ...t, [key]: parseFloat(val) || 0 } : t
        );
        return { ...d, tiers };
      });
      return { ...prev, statutoryDeductions: next };
    });

  const addTier = (dedIdx: number) => setCfg(prev => {
    if (!prev) return prev;
    const next = prev.statutoryDeductions.map((d, di) =>
      di === dedIdx ? { ...d, tiers: [...(d.tiers ?? []), { limit: 0, rate: 0 }] } : d
    );
    return { ...prev, statutoryDeductions: next };
  });

  const removeTier = (dedIdx: number, tierIdx: number) => setCfg(prev => {
    if (!prev) return prev;
    const next = prev.statutoryDeductions.map((d, di) =>
      di === dedIdx ? { ...d, tiers: (d.tiers ?? []).filter((_, ti) => ti !== tierIdx) } : d
    );
    return { ...prev, statutoryDeductions: next };
  });

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) return <div className="py-16 text-center text-foreground/30 text-sm">Loading tax configuration…</div>;
  if (!cfg)    return <div className="py-16 text-center text-foreground/30 text-sm">Could not load configuration.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Tax & Payroll Configuration</h2>
          <p className="text-xs text-foreground/50 mt-0.5">
            Configure tax brackets, statutory deductions, and currency for your country.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-muted transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── 1. Currency ─────────────────────────────────────────────────── */}
      <Section title="Currency">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Select Currency</label>
            <input
              type="text"
              placeholder="Search by code or name… (e.g. KES, Dollar, Naira)"
              value={currencySearch}
              onChange={e => setCurrencySearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            <select
              size={6}
              className="w-full text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 overflow-y-auto"
              value={cfg.currency}
              onChange={e => {
                const found = CURRENCIES.find(c => c.code === e.target.value);
                if (found) patch({ currency: found.code, currencySymbol: found.symbol });
              }}
            >
              {CURRENCIES
                .filter(c => {
                  const q = currencySearch.toLowerCase();
                  return !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
                })
                .map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </option>
                ))
              }
            </select>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm">
            <span className="text-foreground/50">Selected:</span>
            <span className="font-bold text-primary">{cfg.currency}</span>
            <span className="text-foreground/40">·</span>
            <span className="font-mono">{cfg.currencySymbol}</span>
          </div>
          <Input label="Symbol Override (optional)" value={cfg.currencySymbol}
            onChange={(v: string) => patch({ currencySymbol: v })}
            placeholder="Override symbol if needed" />
        </div>
      </Section>

      {/* ── 2. Income Tax ───────────────────────────────────────────────── */}
      <Section title="Income Tax">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Input label="Tax Name (displayed on payslip)" value={cfg.incomeTax.name}
            onChange={(v: string) => patchIT({ name: v })} placeholder="e.g. PAYE, Income Tax" />
          <Input label="Personal Relief (monthly)" type="number" value={cfg.incomeTax.personalRelief}
            onChange={(v: string) => patchIT({ personalRelief: parseFloat(v) || 0 })} placeholder="e.g. 2400" />
        </div>
        <Toggle label="Income Tax Enabled" checked={cfg.incomeTax.enabled} onChange={(v: boolean) => patchIT({ enabled: v })} />
        <Toggle
          label="Deduct pension before calculating income tax"
          description="If on, pension is subtracted from gross before applying tax brackets."
          checked={cfg.incomeTax.deductPensionFirst}
          onChange={(v: boolean) => patchIT({ deductPensionFirst: v })}
        />

        <div className="mt-4">
          <BracketEditor
            brackets={cfg.incomeTax.brackets}
            onChange={setBrackets}
            title="Tax Brackets"
            widthLabel="Taxable width of this band"
            addLabel="Add bracket"
            emptyLabel="No brackets — add one above."
          />
          <p className="text-xs text-foreground/40 mt-1.5">Each band's number is <em>how much income</em> is taxed at that rate, not a cumulative ceiling — e.g. the first band taxes the first 24,000 at 10%, the next band taxes the next 8,333 at 25%, and so on. The &quot;Applies to&quot; column shows the actual income range so this is easier to read at a glance. The bracket with no limit catches the remainder.</p>
        </div>
      </Section>

      {/* ── 3. Statutory Deductions ─────────────────────────────────────── */}
      <Section title="Statutory Deductions"
        action={<button onClick={addDed} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"><Plus className="h-3 w-3" /> Add deduction</button>}>
        <div className="space-y-4">
          {cfg.statutoryDeductions.map((d, i) => (
            <div key={d.key} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <Input label="Name" value={d.name} onChange={(v: string) => updateDed(i, { name: v })} placeholder="e.g. NSSF, Pension" />
                  <Input label="Internal Key (no spaces)" value={d.key} onChange={(v: string) => updateDed(i, { key: v.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g. pension, health" />
                </div>
                <button onClick={() => removeDed(i)} className="mt-6 text-red-400 hover:text-red-600 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <Toggle label="Enabled" checked={d.enabled} onChange={(v: boolean) => updateDed(i, { enabled: v })} />

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Calculation Type</label>
                <select value={d.type} onChange={e => updateDed(i, { type: e.target.value as StatDed['type'] })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                  {DEDUCTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {d.type === 'flat_rate' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Rate (%)" type="number" value={d.rate ?? ''} onChange={(v: string) => updateDed(i, { rate: parseFloat(v) || 0 })} placeholder="e.g. 2.75" />
                  <Input label="Cap (leave blank for none)" type="number" value={d.cap ?? ''} onChange={(v: string) => updateDed(i, { cap: v === '' ? null : parseFloat(v) })} placeholder="Max amount" />
                </div>
              )}

              {d.type === 'fixed_amount' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Fixed Amount per month" type="number" value={d.amount ?? ''} onChange={(v: string) => updateDed(i, { amount: parseFloat(v) || 0 })} placeholder="e.g. 1500" />
                </div>
              )}

              {d.type === 'tiered_cap' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Tiers</p>
                    <button onClick={() => addTier(i)} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      <Plus className="h-3 w-3" /> Add tier
                    </button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60">Band size (amount)</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60">Rate (%)</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(d.tiers ?? []).map((t, ti) => (
                          <tr key={ti}>
                            <td className="px-3 py-2">
                              <input type="number" value={t.limit} onChange={e => updateTier(i, ti, 'limit', e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" value={t.rate} onChange={e => updateTier(i, ti, 'rate', e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                            </td>
                            <td className="px-3 py-2">
                              <button onClick={() => removeTier(i, ti)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Input label="Overall Cap (leave blank for none)" type="number"
                    value={d.cap ?? ''} onChange={(v: string) => updateDed(i, { cap: v === '' ? null : parseFloat(v) })}
                    placeholder="e.g. 2160 (max total NSSF)" className="max-w-xs" />
                </div>
              )}
            </div>
          ))}

          {cfg.statutoryDeductions.length === 0 && (
            <div className="py-8 text-center text-foreground/30 text-sm border rounded-xl">
              No statutory deductions configured. Add one above.
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
