import { z } from 'zod';

export const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  leaveType: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Please provide a reason'),
});

export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;
