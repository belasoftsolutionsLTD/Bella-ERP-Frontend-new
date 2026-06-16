import { z } from 'zod';

export const employeeSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  nationalId: z.string().min(1, 'National ID is required'),
  designation: z.string().min(1, 'Designation is required'),
  employmentType: z.enum(['permanent', 'contract', 'part-time', 'intern']),
  department: z.string().min(1, 'Department is required'),
  dateOfHire: z.string().min(1, 'Date of hire is required'),
  contractEndDate: z.string().optional(),
  salaryGrade: z.string().min(1, 'Salary grade is required'),
  grossPay: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'mpesa', 'cash', 'paypal', 'crypto']).default('bank_transfer'),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  mpesaNumber: z.string().optional(),
  paypalEmail: z.string().optional(),
  cryptoWalletAddress: z.string().optional(),
  cryptoNetwork: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  staffCategory: z.enum(['teaching', 'non-teaching']),
  nokName: z.string().optional(),
  nokRelationship: z.string().optional(),
  nokPhone: z.string().optional(),
  nokNationalId: z.string().optional(),
  nokEmail: z.string().email('Invalid email').optional().or(z.literal('')),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const DEPARTMENTS = [
  'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Senior Secondary',
  'Administration', 'Finance', 'ICT', 'Library', 'Games and Sports', 'Guidance and Counselling',
];

export const DESIGNATIONS = [
  'Class Teacher', 'Subject Teacher', 'Head of Department', 'Deputy Principal', 'Principal',
  'Bursar', 'Accounts Clerk', 'School Nurse', 'IT Technician', 'Librarian',
  'Games Teacher', 'Counsellor', 'Support Staff',
];
