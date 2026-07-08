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
  Briefcase, CalendarDays, Monitor, BookOpen, Bell, Inbox,
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

  // ── Nav definitions ──────────────────────────────────────────────────────────
  const youItems: NavItem[] = [
    { href: `/${locale}/staff-portal`,  label: 'Staff Portal',  icon: UserCircle, roles: ['super_admin', 'hr_manager', 'department_head', 'staff'] },
    { href: `/${locale}/tasks`,         label: 'Tasks',         icon: ListTodo,   roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/inbox`,         label: 'Inbox',         icon: Inbox,      roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/training`,      label: 'Training',      icon: BookOpen,   roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/my/training`,   label: 'My Training',   icon: BookOpen,   roles: ['super_admin', 'hr_manager', 'department_head'] },
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
    { href: `/${locale}/leave-management`, label: 'Leave',          icon: CalendarDays, roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/attendance`,       label: 'Shift & Time', icon: Clock,     roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/performance`,      label: 'Performance',    icon: TrendingUp,   roles: ['super_admin', 'hr_manager', 'department_head'] },
  ];

  const financeItems: NavItem[] = [
    { href: `/${locale}/payroll`,          label: 'Payroll',            icon: DollarSign, roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/expenses`,         label: 'Expenses',           icon: Receipt,    roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/finance/workspace`,label: 'Financial Workspace',icon: Building2,  roles: ['super_admin', 'hr_manager'] },
    { href: `/${locale}/projects`,         label: 'Projects',           icon: Briefcase,  roles: ['super_admin', 'hr_manager', 'department_head'] },
    { href: `/${locale}/spending`,         label: 'Procurement',        icon: ShoppingCart, roles: ['super_admin', 'hr_manager', 'department_head'] },
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

  const visibleYou      = filterSearch(filter(youItems));
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
            ? 'bg-indigo-950/60 text-indigo-300 font-semibold'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
        )}
      >
        {active && (
          <span className="absolute left-0 inset-y-1.5 w-[3px] bg-indigo-500 rounded-r-full" />
        )}
        <Icon className={cn(
          'shrink-0 transition-colors',
          collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4',
          active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300',
        )} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (collapsed) return <div className="my-2 h-px bg-slate-800" />;
    return (
      <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 select-none">
        {label}
      </p>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Brand header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          {hasLogo
            ? <img src={`${API_BASE_URL}/public/company-logo`} alt="logo" className="h-full w-full object-contain" />
            : <span className="text-white font-bold text-xs leading-none">{companyName ? companyName.slice(0, 2).toUpperCase() : 'HR'}</span>
          }
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-100 text-sm leading-tight truncate">{companyName || 'Bela ERP'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">HR Management</p>
          </div>
        )}
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
            <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-sm bg-transparent outline-none text-slate-300 placeholder:text-slate-600 min-w-0"
            />
          </div>
        </div>
      )}

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">

        {/* Overview — always first */}
        {visibleOverview.length > 0 && (
          <>
            <SectionLabel label="Overview" />
            {visibleOverview.map(item => <NavLink key={item.href} {...item} />)}
          </>
        )}

        {/* You */}
        {visibleYou.length > 0 && (
          <>
            <SectionLabel label="You" />
            {visibleYou.map(item => <NavLink key={item.href} {...item} />)}
          </>
        )}

        {/* Search mode: flat list across all categories */}
        {search.trim() ? (
          <>
            {allSearchResults.length > 0
              ? (<>
                  <SectionLabel label="Results" />
                  {allSearchResults.map(item => <NavLink key={item.href} {...item} />)}
                </>)
              : visibleYou.length === 0 && visibleOverview.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No results for &ldquo;{search}&rdquo;</p>
                )
            }
          </>
        ) : (
          <>
            {/* HR & People */}
            {visibleHrPeople.length > 0 && (
              <>
                <SectionLabel label="HR & People" />
                {visibleHrPeople.map(item => <NavLink key={item.href} {...item} />)}
              </>
            )}

            {/* Time & Performance */}
            {visibleTimeWork.length > 0 && (
              <>
                <SectionLabel label="Time & Performance" />
                {visibleTimeWork.map(item => <NavLink key={item.href} {...item} />)}
              </>
            )}

            {/* Finance */}
            {visibleFinance.length > 0 && (
              <>
                <SectionLabel label="Finance" />
                {visibleFinance.map(item => <NavLink key={item.href} {...item} />)}
              </>
            )}

            {/* Company */}
            {visibleCompany.length > 0 && (
              <>
                <SectionLabel label="Company" />
                {visibleCompany.map(item => <NavLink key={item.href} {...item} />)}
              </>
            )}
          </>
        )}
      </nav>

      {/* ── Bottom: user + logout ─────────────────────────────────────────── */}
      <div className="border-t border-slate-800 px-3 py-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-indigo-700 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold tracking-wide">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{userData?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize truncate">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Log out"
            className="w-full flex justify-center p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
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
        className="md:hidden fixed top-4 left-4 z-40 h-10 w-10 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center shadow-sm hover:bg-slate-800 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64 bg-[#0f172a] h-full shadow-2xl border-r border-slate-800">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className={cn(
        'hidden md:flex flex-col bg-[#0f172a] border-r border-slate-800 h-full transition-all duration-200 shrink-0 relative',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[22px] h-6 w-6 rounded-full bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-200 hover:border-slate-500 flex items-center justify-center shadow-sm z-10 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
