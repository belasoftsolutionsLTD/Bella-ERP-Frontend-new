'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  LayoutDashboard, Users, UserPlus, ClipboardList, Calendar,
  CheckSquare, DollarSign, TrendingUp, Menu, X, UserCircle,
  Settings, ShieldCheck, Megaphone, BarChart2, Award, ListTodo,
  Receipt, CalendarDays, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface NavItem { href: string; label: string; icon: React.ElementType; roles?: string[] }
interface NavGroup { label: string; icon: React.ElementType; color: string; items: NavItem[] }

export function HrSidebar() {
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [openGroups, setOpenGroups]     = useState<Record<string, boolean>>({});
  const [companyName, setCompanyName]   = useState('');
  const [hasLogo, setHasLogo]           = useState(false);
  const locale   = useLocale();
  const pathname = usePathname();
  const { userData } = useAuth();
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

  // ── Nav groups definition ─────────────────────────────────────────────────
  const allGroups: NavGroup[] = [
    {
      label: 'People',
      icon: Users,
      color: '#818cf8',
      items: [
        { href: `/${locale}/employees`,   label: 'Employees',   icon: Users,        roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/recruitment`, label: 'Recruitment', icon: UserPlus,     roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/onboarding`,  label: 'Onboarding',  icon: ClipboardList,roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/performance`, label: 'Performance', icon: TrendingUp,   roles: ['super_admin', 'hr_manager', 'department_head'] },
      ],
    },
    {
      label: 'Time & Attendance',
      icon: Calendar,
      color: '#fbbf24',
      items: [
        { href: `/${locale}/leave`,       label: 'Leave',       icon: Calendar,     roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/attendance`,  label: 'Attendance',  icon: CheckSquare,  roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/events`,      label: 'Events',      icon: CalendarDays, roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/tasks`,       label: 'Tasks',       icon: ListTodo,     roles: ['super_admin', 'hr_manager'] },
      ],
    },
    {
      label: 'Finance',
      icon: DollarSign,
      color: '#34d399',
      items: [
        { href: `/${locale}/payroll`,     label: 'Payroll',     icon: DollarSign,   roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/expenses`,    label: 'Expenses',    icon: Receipt,      roles: ['super_admin', 'hr_manager'] },
      ],
    },
    {
      label: 'Insights & Admin',
      icon: BarChart2,
      color: '#c084fc',
      items: [
        { href: `/${locale}/communications`, label: 'Communications', icon: Megaphone,  roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/reports`,        label: 'Reports',        icon: BarChart2,  roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/certifications`, label: 'Awards',         icon: Award,      roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/config`,         label: 'Configuration',  icon: Settings,   roles: ['super_admin', 'hr_manager'] },
        { href: `/${locale}/accounts`,       label: 'User Accounts',  icon: ShieldCheck,roles: ['super_admin', 'hr_manager'] },
      ],
    },
  ];

  // Standalone items (not inside any group)
  const standaloneTop: NavItem[] = [
    { href: `/${locale}/dashboard`, label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'hr_manager', 'department_head'] },
  ];
  const standaloneBottom: NavItem[] = [
    { href: `/${locale}/staff-portal`, label: 'Staff Portal', icon: UserCircle, roles: ['super_admin', 'hr_manager', 'staff', 'department_head'] },
  ];

  // Filter by role
  const visibleGroups = allGroups.map(g => ({
    ...g,
    items: g.items.filter(i => !i.roles || i.roles.includes(role)),
  })).filter(g => g.items.length > 0);

  const filterStandalone = (items: NavItem[]) => items.filter(i => !i.roles || i.roles.includes(role));

  // Auto-open the group that contains the active route
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    visibleGroups.forEach(g => {
      const hasActive = g.items.some(i => pathname.startsWith(i.href));
      initial[g.label] = hasActive;
    });
    setOpenGroups(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = (label: string) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  // ── Render helpers ────────────────────────────────────────────────────────
  const NavLink = ({ href, label, icon: Icon }: NavItem) => {
    const active = pathname.startsWith(href);
    return (
      <Link href={href} onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
          active ? 'bg-accent text-primary' : 'text-white/70 hover:bg-white/10 hover:text-white',
        )}>
        <Icon className="h-4.5 w-4.5 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  const SidebarContent = () => (
    <nav className="flex flex-col h-full">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0 overflow-hidden">
          {hasLogo
            ? <img src={`${API_BASE_URL}/public/company-logo`} alt="logo" className="h-full w-full object-contain" />
            : <span className="text-primary font-bold text-sm">{companyName ? companyName.slice(0, 2).toUpperCase() : 'SE'}</span>
          }
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-sm truncate">{companyName || 'School ERP'}</span>
        )}
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

        {/* Standalone: Dashboard */}
        {filterStandalone(standaloneTop).map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Grouped sections */}
        {visibleGroups.map(group => {
          const isOpen = !!openGroups[group.label];
          const hasActive = group.items.some(i => pathname.startsWith(i.href));

          if (collapsed) {
            // In collapsed mode just show icons — no group header
            return group.items.map(item => <NavLink key={item.href} {...item} />);
          }

          return (
            <div key={group.label} className="mt-1">
              {/* Group header button */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest',
                  hasActive ? 'text-white/90' : 'text-white/40 hover:text-white/70',
                )}
              >
                <group.icon className="h-3.5 w-3.5 shrink-0" style={{ color: group.color }} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown className={cn(
                  'h-3 w-3 transition-transform duration-200 shrink-0',
                  isOpen ? 'rotate-180' : '',
                  hasActive ? 'text-white/60' : 'text-white/25',
                )} />
              </button>

              {/* Items */}
              {isOpen && (
                <div className="ml-3 mt-0.5 pl-3 border-l border-white/10 space-y-0.5">
                  {group.items.map(item => <NavLink key={item.href} {...item} />)}
                </div>
              )}
            </div>
          );
        })}

        {/* Standalone: Staff Portal */}
        <div className="mt-1">
          {filterStandalone(standaloneBottom).map(item => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg">
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64 bg-primary h-full">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col bg-primary h-full transition-all duration-200 shrink-0 relative',
        collapsed ? 'w-16' : 'w-56',
      )}>
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-accent text-primary flex items-center justify-center shadow-md z-10 text-sm font-bold">
          {collapsed ? '›' : '‹'}
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
