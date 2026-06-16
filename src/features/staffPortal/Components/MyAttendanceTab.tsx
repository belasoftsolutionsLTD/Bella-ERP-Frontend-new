'use client';
import { AttendanceGrid } from '../../attendance/Components/AttendanceGrid';
import type { AttendanceGroup } from '../../attendance/Hooks/useAttendance';

export function MyAttendanceTab({ data }: { data: AttendanceGroup[] }) {
  const now = new Date();
  return <AttendanceGrid data={data} month={now.getMonth() + 1} year={now.getFullYear()} />;
}
