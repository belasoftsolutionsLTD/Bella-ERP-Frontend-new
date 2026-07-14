export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'remote';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  mode?: 'onsite' | 'offsite';
  selfMarked?: boolean;
  checkInLocation?: string;
  checkOutLocation?: string;
  checkInLat?: number;
  checkInLng?: number;
}

export interface AttendanceGroup {
  employeeId: string;
  employeeName?: string;
  staffNumber?: string;
  department?: string;
  records: AttendanceRecord[];
}
