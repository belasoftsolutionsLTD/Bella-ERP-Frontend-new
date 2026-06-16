'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { AttendanceGrid } from '../Components/AttendanceGrid';
import { AttendanceFilters } from '../Components/AttendanceFilters';
import { CsvImportButton } from '../Components/CsvImportButton';
import { AbsenceAlertList } from '../Components/AbsenceAlertList';
import { MarkAttendanceModal } from '../Components/MarkAttendanceModal';
import { useAttendance } from '../Hooks/useAttendance';

export default function AttendancePage() {
  const t = useTranslations('Attendance');
  const now = new Date();
  const [filters, setFilters] = useState<{ month?: number; year?: number; department?: string }>({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [showMark, setShowMark] = useState(false);
  const { data, alerts, loading, error, refetch } = useAttendance(filters);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="accent" className="gap-2" onClick={() => setShowMark(true)}>
            <UserCheck className="h-4 w-4" /> Mark Attendance
          </Button>
          <CsvImportButton onSuccess={refetch} />
        </div>
      </div>

      <AttendanceFilters filters={filters} onChange={(f) => setFilters(f)} />

      <Wrapper loading={loading} error={error} onRetry={refetch}>
        <AttendanceGrid data={data} month={filters.month ?? now.getMonth() + 1} year={filters.year ?? now.getFullYear()} />
      </Wrapper>

      {alerts.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold mb-3">{t('alerts')}</h3>
          <AbsenceAlertList alerts={alerts} />
        </div>
      )}

      {showMark && (
        <MarkAttendanceModal
          onClose={() => setShowMark(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
