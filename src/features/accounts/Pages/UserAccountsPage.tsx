'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, ShieldCheck, UserX, UserCheck, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { CreateAccountModal } from '../Components/CreateAccountModal';

interface UserAccount {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustResetPassword: boolean;
  department?: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  department_head: 'Dept. Head',
  staff: 'Staff',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500/20 text-red-400',
  hr_manager: 'bg-violet-500/20 text-violet-400',
  department_head: 'bg-blue-500/20 text-blue-400',
  staff: 'bg-emerald-500/20 text-emerald-400',
};

export default function UserAccountsPage() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<string | null>(null);

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/auth/accounts`,
      method: 'GET',
      thenFn: (res) => setAccounts((res.data as any) ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleResetPassword = (id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/auth/accounts/${id}/reset-password`,
      method: 'PATCH',
      thenFn: () => {
        toast.success('Password reset. New credentials sent via email.');
        setConfirmReset(null);
        fetchAccounts();
      },
    });
  };

  const handleToggleActive = (account: UserAccount) => {
    apiCallFunction({
      url: `${API_BASE_URL}/auth/accounts/${account._id}`,
      method: 'PATCH',
      data: { isActive: !account.isActive },
      thenFn: () => {
        toast.success(account.isActive ? 'Account deactivated.' : 'Account reactivated.');
        setConfirmToggle(null);
        fetchAccounts();
      },
    });
  };

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateAccountModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAccounts(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-400" />
            User Accounts
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage system access for staff and department heads</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Create Account
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <ShieldCheck className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No user accounts yet. Create one to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-left font-medium">Email</th>
                <th className="px-5 py-3 text-left font-medium">Role</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc._id} className="border-b border-slate-700/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-100">{acc.name}</div>
                    {acc.department && <div className="text-xs text-slate-500">{acc.department}</div>}
                    {acc.mustResetPassword && (
                      <span className="text-xs text-amber-400 font-medium">Password reset required</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{acc.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[acc.role] ?? 'bg-slate-700 text-slate-400'}`}>
                      {ROLE_LABELS[acc.role] ?? acc.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {acc.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {confirmReset === acc._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Send new password?</span>
                        <button onClick={() => handleResetPassword(acc._id)}
                          className="text-xs text-indigo-400 font-semibold hover:underline">Yes</button>
                        <button onClick={() => setConfirmReset(null)}
                          className="text-xs text-slate-500 hover:text-slate-200">Cancel</button>
                      </div>
                    ) : confirmToggle === acc._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{acc.isActive ? 'Deactivate?' : 'Reactivate?'}</span>
                        <button onClick={() => handleToggleActive(acc)}
                          className="text-xs text-indigo-400 font-semibold hover:underline">Yes</button>
                        <button onClick={() => setConfirmToggle(null)}
                          className="text-xs text-slate-500 hover:text-slate-200">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setConfirmReset(acc._id)}
                          title="Reset password"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmToggle(acc._id)}
                          title={acc.isActive ? 'Deactivate' : 'Reactivate'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors">
                          {acc.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={fetchAccounts} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors">
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </button>
    </div>
  );
}
