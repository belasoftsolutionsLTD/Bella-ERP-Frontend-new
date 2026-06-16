'use client';
import { useTranslations } from 'next-intl';
import type { Employee } from '../Hooks/useEmployees';

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-foreground/50 mb-0.5">{label}</p>
    <p className="text-sm font-medium">{value || '—'}</p>
  </div>
);

export function ProfileTab({ employee }: { employee: Employee }) {
  const t = useTranslations('Employees');
  const tc = useTranslations('Common');
  const hireDate = employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString('en-KE') : '—';
  const contractEnd = employee.contractEndDate ? new Date(employee.contractEndDate).toLocaleDateString('en-KE') : '—';
  const nok = (employee as any).nextOfKin;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-xl border bg-white p-5">
        <Field label={t('fullName')} value={employee.fullName} />
        <Field label={t('staffNumber')} value={employee.staffNumber} />
        <Field label={t('nationalId')} value={employee.nationalId} />
        <Field label={tc('email')} value={employee.email} />
        <Field label={tc('phone')} value={employee.phone} />
        <Field label={tc('department')} value={employee.department} />
        <Field label={tc('designation')} value={employee.designation} />
        <Field label={t('employmentType')} value={employee.employmentType} />
        <Field label={t('staffCategory')} value={employee.staffCategory} />
        <Field label={t('salaryGrade')} value={employee.salaryGrade} />
        <Field label={t('dateOfHire')} value={hireDate} />
        <Field label={t('contractEndDate')} value={contractEnd} />
      </div>
      {nok && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold mb-3">{t('nextOfKin')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label={t('nokName')} value={nok.name} />
            <Field label={t('nokRelationship')} value={nok.relationship} />
            <Field label={t('nokPhone')} value={nok.phone} />
            <Field label="NOK National ID" value={nok.nationalId} />
            <Field label="NOK Email" value={nok.email} />
          </div>
        </div>
      )}
    </div>
  );
}
