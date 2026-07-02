'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Shield, Building2, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface Employee {
  _id: string;
  fullName: string;
  email: string;
  department: string;
  staffNumber: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ROLE_OPTIONS = [
  { value: 'staff',           label: 'Staff',           desc: 'Access to personal portal only' },
  { value: 'department_head', label: 'Department Head',  desc: 'Manages their department and team tasks' },
  { value: 'hr_manager',      label: 'HR Manager',       desc: 'Full HR system access' },
];

export function CreateAccountModal({ onClose, onCreated }: Props) {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [role, setRole]           = useState('staff');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [empSearch, setEmpSearch]     = useState('');
  const [showDrop, setShowDrop]       = useState(false);
  const [linkedEmp, setLinkedEmp]     = useState<Employee | null>(null);
  const [loading, setLoading]         = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=500`,
      method: 'GET',
      showToast: false,
      thenFn: (res) => setEmployees(res.data?.data ?? []),
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = empSearch.trim()
    ? employees.filter(emp =>
        emp.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
        emp.staffNumber?.toLowerCase().includes(empSearch.toLowerCase()) ||
        emp.department?.toLowerCase().includes(empSearch.toLowerCase()))
    : employees.slice(0, 10);

  const selectEmployee = (emp: Employee) => {
    setLinkedEmp(emp);
    setEmployeeId(emp._id);
    setName(emp.fullName);
    setEmail(emp.email || '');
    setDepartment(emp.department || '');
    setEmpSearch('');
    setShowDrop(false);
  };

  const clearEmployee = () => {
    setLinkedEmp(null);
    setEmployeeId('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role) return;
    setLoading(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/auth/accounts`,
      method: 'POST',
      data: {
        name: name.trim(),
        email: email.trim(),
        role,
        department: department || undefined,
        employeeId: employeeId || undefined,
      },
      thenFn: () => {
        toast.success('Account created. Credentials sent to ' + email.trim());
        onCreated();
      },
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-base">Create User Account</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">

          {/* ── Fill from existing employee ── */}
          <div className="space-y-1.5" ref={dropRef}>
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> Fill from existing employee
              <span className="text-foreground/30 normal-case font-normal">(optional)</span>
            </label>

            {linkedEmp ? (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  {linkedEmp.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{linkedEmp.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{linkedEmp.staffNumber} · {linkedEmp.department}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <button type="button" onClick={clearEmployee} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={empSearch}
                    onChange={e => { setEmpSearch(e.target.value); setShowDrop(true); }}
                    onFocus={() => setShowDrop(true)}
                    placeholder="Search by name, staff number or department…"
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                {showDrop && filtered.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filtered.map(emp => (
                      <button
                        key={emp._id}
                        type="button"
                        onMouseDown={() => selectEmployee(emp)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 text-left transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {emp.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{emp.fullName}</p>
                          <p className="text-xs text-slate-500 truncate">{emp.staffNumber} · {emp.department}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDrop && empSearch.trim() && filtered.length === 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl px-3 py-3 text-xs text-slate-500">
                    No employees match "{empSearch}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative flex items-center gap-2">
            <div className="flex-1 border-t border-dashed border-slate-200" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wide shrink-0">or type manually</span>
            <div className="flex-1 border-t border-dashed border-slate-200" />
          </div>

          {/* ── Name ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Wanjiku"
              required
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* ── Email ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@school.ac.ke"
              required
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* ── Role ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Role
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(r => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    role === r.value
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                    <p className="text-xs text-slate-500">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Department (dept_head only) ── */}
          {role === 'department_head' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Department
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Senior Secondary"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            A random password will be generated and emailed to the user. They will be prompted to change it on first login.
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
              {loading ? 'Creating…' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
