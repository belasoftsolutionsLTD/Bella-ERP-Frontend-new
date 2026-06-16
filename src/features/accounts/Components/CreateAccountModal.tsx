'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface Employee { _id: string; fullName: string; department: string; staffNumber: string }

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'department_head', label: 'Department Head' },
];

export function CreateAccountModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=200`,
      method: 'GET',
      thenFn: (res) => setEmployees(res.data?.data ?? []),
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role) return;
    setLoading(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/auth/accounts`,
      method: 'POST',
      data: { name: name.trim(), email: email.trim(), role, department: department || undefined, employeeId: employeeId || undefined },
      thenFn: () => {
        toast.success('Account created. Credentials sent to ' + email.trim());
        onCreated();
      },
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-base">Create User Account</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Wanjiku"
              required
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@school.ac.ke"
              required
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Department (dept_head only) */}
          {role === 'department_head' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Senior Secondary"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {/* Link to employee */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
              Link to Employee Record <span className="text-foreground/30 normal-case">(optional)</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">— Not linked —</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.staffNumber}) · {emp.department}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            A random password will be generated and emailed to the user. They will be prompted to change it on first login.
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
