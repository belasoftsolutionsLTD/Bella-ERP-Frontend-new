'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  LayoutDashboard, Users, UserPlus, ClipboardList,
  DollarSign, TrendingUp, Menu, X, UserCircle,
  Settings, Megaphone, BarChart2, Award, ListTodo,
  Receipt, Search, LogOut, Clock, ChevronLeft, ChevronRight,
  GitBranch, FolderOpen, UserMinus, Building2, ShoppingCart,
  Briefcase, CalendarDays, Monitor, BookOpen, Bell, Inbox, Boxes, CreditCard, Kanban, Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

export function HrSidebar() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [hasLogo, setHasLogo]       = useState(false);
  const [search, setSearch]         = useState('');
  // Which nav groups are collapsed — same Set-based toggle pattern as the Staff
  // Portal's department groups. Defaults to all-open (empty set) so nothing changes
  // visually until a user actually collapses a group themselves.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (id: string) => setCollapsedGroups((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const locale   = useLocale();
  const pathname = usePathname();
  const router   = useRouter();
  const { userData, logout } = useAuth();
  const role = userData?.role ?? '';

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/config/company-settings`,
      showToast: false,
      thenFn: (r) => {
        if (r.data?.companyName) setCompanyName(r.data.companyName);
        if (r.data?.logoPath)    setHasLogo(true);
      },
      catchFn: () => {},
    });
  }, []);

  // Inventory/POS/CRM all resolve access per-request from role + explicit assignment
  // (isInventoryClerk, posLocationIds, or just being a manager) rather than a fixed
  // role list — admin/manager/dept_head always have SOME access so they always see the
  // nav item, but a plain "staff" account often has none at all. Showing the item
  // anyway and letting the page 403 was confusing ("why do I see a module I can't use
  // and that has nothing to do with me") — so for staff specifically, ask each module
  // directly and only show the ones they can actually get into.
  const [staffModuleAccess, setStaffModuleAccess] = useState<{ inventory: boolean; pos: boolean; crm: boolean; logistics: boolean }>({ inventory: true, pos: true, crm: true, logistics: true });
  useEffect(() => {
    if (role !== 'staff') return;
    const check = (path: string, key: 'inventory' | 'pos' | 'crm' | 'logistics') => apiCallFunction<any>({
      url: `${API_BASE_URL}/${path}/my-access`,
      showToast: false,
      thenFn: (r) => setStaffModuleAccess((prev) => ({ ...prev, [key]: !!r.data?.relevant })),
      catchFn: () => setStaffModuleAccess((prev) => ({ ...prev, [key]: false })),
    });
    setStaffModuleAccess({ inventory: false, pos: false, crm: false, logistics: false }); // hide until each check resolves, rather than flash-then-hide
    check('inventory', 'inventory');
    check('pos', 'pos');
    check('crm', 'crm');
    check('logistics', 'logistics');
  }, [role]);

  // ── Nav definitions ──────────────────────────────────────────────────────────
  // "My Work" is personal self-service (your own profile, leave, attendance, tasks) —
  // every role gets some slice of it. "My Team" is management tooling that only exists
  // for someone with people to manage. Kept as two separate sections (not one merged
  // list) so it's visually obvious which one you're in — the underlying pages
  // (e.g. Staff Portal's "My Leave" vs the org-wide "Leave" dashboard under Time &
  // Performance) are genuinely different views, not a UI duplication to collapse.
  const myWorkItems: NavItem[] = [
    { href: `/${locale}/staff-portal`,  label: 'Staff Portal',  icon: UserCircle, roles: ['super_admin', 'hr_manager', 'department_head', 'staff'] },
    { href: `/${locale}/tasks`,         label: 'Tasks',         icon: ListTodo,   roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/inbox`,         label: 'Inbox',         icon: Inbox,      roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/training`,      label: 'Training',      icon: BookOpen,   roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/my/training`,   label: 'My Training',   icon: BookOpen,   roles: ['super_admin', 'hr_manager', 'department_head'] },
  ];

  const myTeamItems: NavItem[] = [
    { href: `/${locale}/department-portal`, label: 'My Department', icon: Users, roles: ['department_head'] },
  ];

  const overviewItems: NavItem[] = [
    { href: `/${locale}/dashboard`, label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/reports`,   label: 'Reports',   icon: BarChart2,       roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/org-chart`, label: 'Org Chart', icon: GitBranch,       roles: ['super_admin', 'hr_manager', 'department_head'] },
  ];

  const hrPeopleItems: NavItem[] = [
    { href: `/${locale}/employees`,   label: 'Employees',    icon: Users,        roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/recruitment`, label: 'Recruitment',  icon: UserPlus,     roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/onboarding`,  label: 'Onboarding',   icon: ClipboardList,roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/offboarding`, label: 'Offboarding',  icon: UserMinus,    roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/documents`,   label: 'Documents',    icon: FolderOpen,   roles: ['super_admin', 'hr_manager'] },
  ];

  const timeWorkItems: NavItem[] = [
    { href: `/${locale}/leave`, label: 'Leave',          icon: CalendarDays, roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/attendance`,       label: 'Shift & Time', icon: Clock,     roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/performance`,      label: 'Performance',    icon: TrendingUp,   roles: ['super_admin', 'hr_manager', 'department_head'] },
  ];

  const financeItems: NavItem[] = [
    { href: `/${locale}/payroll`,          label: 'Payroll',            icon: DollarSign, roles: ['super_admin', 'hr_manager'] },
    // department_head gets 'viewer' access (department-scoped reports only) inside the
    // module itself — included here, unlike Payroll, since it's a real (if limited) use.
    { href: `/${locale}/accounting`,       label: 'Accounting',         icon: BookOpen,   roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/expenses`,         label: 'Expenses',           icon: Receipt,    roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/finance/workspace`,label: 'Financial Workspace',icon: Building2,  roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/projects`,         label: 'Projects',           icon: Briefcase,  roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/spending`,         label: 'Procurement',        icon: ShoppingCart, roles: ['super_admin', 'hr_manager', 'department_head'] },
    // super_admin/hr_manager/department_head always have SOME access level in these
    // three modules by role alone, so they always see the item. A plain "staff" account
    // usually doesn't (no isInventoryClerk flag, no posLocationIds, not a CRM-eligible
    // manager) — staffModuleAccess (checked above via each module's own /my-access) hides
    // the item entirely for a staff user who genuinely has nothing to do in that module,
    // rather than showing it and letting the page 403.
    ...(role !== 'staff' || staffModuleAccess.inventory
      ? [{ href: `/${locale}/inventory`, label: 'Inventory', icon: Boxes, roles: ['super_admin', 'hr_manager', 'department_head', 'staff'] }]
      : []),
    ...(role !== 'staff' || staffModuleAccess.pos
      ? [{ href: `/${locale}/pos`, label: 'Point of Sale', icon: CreditCard, roles: ['super_admin', 'hr_manager', 'department_head', 'staff'] }]
      : []),
    ...(role !== 'staff' || staffModuleAccess.crm
      ? [{ href: `/${locale}/crm`, label: 'CRM', icon: Kanban, roles: ['super_admin', 'hr_manager', 'department_head', 'staff'] }]
      : []),
    // Same posture as Inventory/POS/CRM above — department_head always has 'manager'
    // access (their own team's routes/shipments), a plain staff account only shows this
    // if they're actually assigned as a vehicle's driver.
    ...(role !== 'staff' || staffModuleAccess.logistics
      ? [{ href: `/${locale}/logistics`, label: 'Logistics', icon: Truck, roles: ['super_admin', 'hr_manager', 'department_head', 'staff'] }]
      : []),
  ];

  const companyItems: NavItem[] = [
    { href: `/${locale}/communications`, label: 'Communications',   icon: Megaphone,  roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/certifications`, label: 'Awards & Recognition', icon: Award, roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/assets-management`,  label: 'Asset Management',  icon: Monitor,    roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/settings`,       label: 'Settings',       icon: Settings,   roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/accounts`,       label: 'User Accounts',  icon: UserCircle, roles: ['super_admin', 'hr_manager'] },
  ];

  const filter = (items: NavItem[]) =>
    items.filter(i => !i.roles || i.roles.includes(role));

  const filterSearch = (items: NavItem[]) =>
    search.trim()
      ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
      : items;

  const visibleMyWork   = filterSearch(filter(myWorkItems));
  const visibleMyTeam   = filterSearch(filter(myTeamItems));
  const visibleOverview = filterSearch(filter(overviewItems));
  const visibleHrPeople = filterSearch(filter(hrPeopleItems));
  const visibleTimeWork = filterSearch(filter(timeWorkItems));
  const visibleFinance  = filterSearch(filter(financeItems));
  const visibleCompany  = filterSearch(filter(companyItems));

  const allSearchResults = search.trim()
    ? [...visibleOverview, ...visibleHrPeople, ...visibleTimeWork, ...visibleFinance, ...visibleCompany]
    : [];

  const initials  = userData?.name
    ? userData.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';
  const roleLabel = role.replace(/_/g, ' ');

  const handleLogout = () => { logout(); router.push(`/${locale}/login`); };

  // ── Sub-components ───────────────────────────────────────────────────────────
  const NavLink = ({ href, label, icon: Icon }: NavItem) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? label : undefined}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
          active
            ? 'bg-brand-primary text-white font-semibold'
            : 'text-brand-text-secondary hover:bg-brand-bg-muted hover:text-brand-text',
        )}
      >
        <Icon className={cn(
          'shrink-0 transition-colors',
          collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4',
          active ? 'text-white' : 'text-brand-text-secondary group-hover:text-brand-text',
        )} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (collapsed) return <div className="my-2 h-px bg-brand-border" />;
    return (
      <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-text-muted select-none">
        {label}
      </p>
    );
  };

  // Each group gets its own fixed, consistent color (never reassigned/cycled — same
  // identity every render) so the groups are distinguishable at a glance rather than
  // one uniform gray wall of text. Colors are the same colorblind-validated categorical
  // set used for charts elsewhere in the app, hand-matched to each group rather than
  // taken in raw palette order (e.g. amber for Time, emerald for Finance).
  const GROUP_COLORS: Record<string, string> = {
    overview: '#6366f1',
    myTeam: '#0ea5e9',
    myWork: '#ec4899',
    hrPeople: '#8b5cf6',
    timeWork: '#f59e0b',
    finance: '#10b981',
    company: '#ef4444',
  };
  // Three of the colors above (sky/amber/emerald) don't hit 3:1 contrast against a
  // white sidebar at small text sizes — fine for a decorative dot/chevron, not fine as
  // the label's actual reading color. Darker text-safe variants of the same hue for
  // those three only; the rest of GROUP_COLORS already reads fine as text.
  const GROUP_TEXT_COLORS: Record<string, string> = {
    myTeam: '#0369a1',
    timeWork: '#b45309',
    finance: '#047857',
  };

  // A named group of nav items with a clickable, collapsible header — same interaction
  // as the Staff Portal's department groups (chevron rotates 90° when open, click the
  // header to toggle). When the whole sidebar is icon-only-collapsed, group toggling
  // doesn't make sense, so it falls back to a plain divider + icons instead.
  const CollapsibleSection = ({ id, label, items }: { id: string; label: string; items: NavItem[] }) => {
    if (!items.length) return null;
    if (collapsed) {
      return (
        <>
          <div className="my-2 h-px bg-brand-border" />
          {items.map(item => <NavLink key={item.href} {...item} />)}
        </>
      );
    }
    const isOpen = !collapsedGroups.has(id);
    const color = GROUP_COLORS[id] ?? '#64748B';
    const textColor = GROUP_TEXT_COLORS[id] ?? color;
    return (
      <div>
        <button
          type="button"
          onClick={() => toggleGroup(id)}
          className="w-full flex items-center gap-1.5 px-3 pt-5 pb-1.5 select-none group"
        >
          <ChevronRight className="h-2.5 w-2.5 shrink-0 transition-transform" style={{ color: textColor, transform: isOpen ? 'rotate(90deg)' : undefined }} />
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] transition-colors" style={{ color: textColor }}>
            {label}
          </span>
        </button>
        {isOpen && items.map(item => <NavLink key={item.href} {...item} />)}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Brand header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-brand-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          {hasLogo
            ? <img src={`${API_BASE_URL}/public/company-logo`} alt="logo" className="h-full w-full object-contain" />
            : <span className="text-white font-bold text-xs leading-none">{companyName ? companyName.slice(0, 2).toUpperCase() : 'HR'}</span>
          }
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-text text-sm leading-tight truncate">{companyName || 'Bela ERP'}</p>
            <p className="text-[10px] text-brand-text-muted mt-0.5">HR Management</p>
          </div>
        )}
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b border-brand-border shrink-0">
          <div className="flex items-center gap-2 bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-1.5 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary/30 transition-all">
            <Search className="h-3.5 w-3.5 text-brand-text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-sm bg-transparent outline-none text-brand-text placeholder:text-brand-text-muted min-w-0"
            />
          </div>
        </div>
      )}

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300">

        {/* Overview — always first */}
        <CollapsibleSection id="overview" label="Overview" items={visibleOverview} />

        {/* My Team — management tooling, shown above My Work so it isn't mistaken for
            "more personal stuff" when both sections are visible */}
        <CollapsibleSection id="myTeam" label="My Team" items={visibleMyTeam} />

        {/* My Work — personal self-service, distinct from My Team above */}
        <CollapsibleSection id="myWork" label="My Work" items={visibleMyWork} />

        {/* Search mode: flat list across all categories */}
        {search.trim() ? (
          <>
            {allSearchResults.length > 0
              ? (<>
                  <SectionLabel label="Results" />
                  {allSearchResults.map(item => <NavLink key={item.href} {...item} />)}
                </>)
              : visibleMyWork.length === 0 && visibleMyTeam.length === 0 && visibleOverview.length === 0 && (
                  <p className="text-xs text-brand-text-muted text-center py-6">No results for &ldquo;{search}&rdquo;</p>
                )
            }
          </>
        ) : (
          <>
            <CollapsibleSection id="hrPeople" label="HR & People" items={visibleHrPeople} />
            <CollapsibleSection id="timeWork" label="Time & Performance" items={visibleTimeWork} />
            <CollapsibleSection id="finance" label="Finance" items={visibleFinance} />
            <CollapsibleSection id="company" label="Company" items={visibleCompany} />
          </>
        )}
      </nav>

      {/* ── Bottom: user + logout ─────────────────────────────────────────── */}
      <div className="border-t border-brand-border bg-brand-bg-soft px-3 py-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold tracking-wide">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-text truncate leading-tight">{userData?.name}</p>
              <p className="text-[10px] text-brand-text-muted capitalize truncate">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Log out"
            className="w-full flex justify-center p-1.5 rounded-lg text-brand-text-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile toggle ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 h-10 w-10 rounded-lg bg-brand-sidebar border border-brand-border text-brand-text-secondary flex items-center justify-center shadow-sm hover:bg-brand-bg-muted transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64 bg-brand-sidebar h-full shadow-2xl border-r border-brand-border">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-brand-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className={cn(
        'hidden md:flex flex-col bg-brand-sidebar border-r border-brand-border h-full transition-all duration-200 shrink-0 relative',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[22px] h-6 w-6 rounded-full bg-brand-sidebar border border-brand-border text-brand-text-muted hover:text-brand-text hover:border-brand-border-strong flex items-center justify-center shadow-sm z-10 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
