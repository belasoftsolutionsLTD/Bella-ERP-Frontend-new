'use client';

import { AlertTriangle } from 'lucide-react';
import { useConfigSection } from '@/hooks/useConfigSection';
import { ConfigTable } from '@/components/custom-ui/ConfigTable';

// Moved from the old /config "HR Configuration" page. The leave request form's
// actual type dropdown is driven by the LEAVE_TYPE_LABELS constant (../constants)
// and each employee's leave_balances document — this collection is not read by
// live leave-request behavior, kept here for reference/legacy record-keeping only.
export function LeaveSettingsTab() {
  const leaveTypes = useConfigSection('leave-types');

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Legacy configuration — the actual leave request form and balances use a fixed set of leave types
          (see the &ldquo;Policies&rdquo; tab for real entitlement rules). Entries here do not affect live leave requests.
        </p>
      </div>
      <ConfigTable
        title="Leave Types"
        items={leaveTypes.items}
        loading={leaveTypes.loading}
        columns={[
          { key: 'name',        label: 'Leave Type Name' },
          { key: 'defaultDays', label: 'Default Days', type: 'integer' },
          { key: 'isEnabled',   label: 'Enabled', type: 'checkbox' },
          { key: 'description', label: 'Description' },
        ]}
        defaultForm={{ name: '', defaultDays: '', isEnabled: 'true', description: '' }}
        onCreate={(d) => leaveTypes.create(d)}
        onUpdate={(id, d) => leaveTypes.update(id, d)}
        onDelete={(id) => leaveTypes.remove(id)}
      />
    </div>
  );
}
