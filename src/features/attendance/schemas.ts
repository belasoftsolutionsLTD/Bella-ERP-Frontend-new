import { z } from 'zod';

// Client-only validation (no shared runtime between this CJS backend and TS frontend) —
// the backend independently validates via validateRequiredFields + explicit checks,
// matching every other module's convention in this codebase.

export const ClockInSchema = z.object({
  workLocation: z.enum(['office', 'home', 'remote', 'client_site']).default('office'),
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string().optional(),
});
export type ClockInFormValues = z.infer<typeof ClockInSchema>;

export const ClockOutSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string().optional(),
});
export type ClockOutFormValues = z.infer<typeof ClockOutSchema>;

export const BreakSchema = z.object({});
export type BreakFormValues = z.infer<typeof BreakSchema>;

export const ManualAttendanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'remote']),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
  overrideLeaveConflict: z.boolean().optional().default(false),
});
export type ManualAttendanceFormValues = z.infer<typeof ManualAttendanceSchema>;

export const CreateShiftSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  shiftType: z.string().optional().default('custom'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  breakMinutes: z.coerce.number().min(0).default(0),
  location: z.string().optional().default('office'),
  notes: z.string().optional().default(''),
});
export type CreateShiftFormValues = z.infer<typeof CreateShiftSchema>;

// Assigns a named work_schedules template to an employee (employeeShiftAssignments) —
// distinct from CreateShiftSchema, which is a single ad-hoc per-date shift.
export const AssignShiftSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  scheduleId: z.string().min(1, 'Schedule is required'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  effectiveTo: z.string().optional(),
});
export type AssignShiftFormValues = z.infer<typeof AssignShiftSchema>;

export const TimesheetSubmitSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  weekStart: z.string().min(1, 'Week is required'),
  entries: z.array(z.object({
    date: z.string(),
    projectId: z.string().nullable().optional(),
    projectName: z.string().optional().default('General'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    breakMinutes: z.coerce.number().min(0).default(0),
    totalMinutes: z.coerce.number().min(0).default(0),
    description: z.string().optional().default(''),
  })).default([]),
});
export type TimesheetSubmitFormValues = z.infer<typeof TimesheetSubmitSchema>;

export const ApproveTimesheetSchema = z.object({
  comment: z.string().optional().default(''),
});
export type ApproveTimesheetFormValues = z.infer<typeof ApproveTimesheetSchema>;

export const RejectTimesheetSchema = z.object({
  reason: z.string().min(2, 'Please provide a reason'),
});
export type RejectTimesheetFormValues = z.infer<typeof RejectTimesheetSchema>;
