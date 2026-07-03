import { z } from 'zod';

export const employeeSchema = z.object({
  fullName:             z.string().min(2, 'Full name is required'),
  nationalId:           z.string().min(1, 'National ID is required'),
  designation:          z.string().min(1, 'Designation is required'),
  employmentType:       z.enum(['permanent', 'contract', 'part-time', 'intern']),
  department:           z.string().min(1, 'Department is required'),
  dateOfHire:           z.string().min(1, 'Date of hire is required'),
  dateOfBirth:          z.string().optional(),
  contractEndDate:      z.string().optional(),
  salaryGrade:          z.string().min(1, 'Job group / salary grade is required'),
  grossPay:             z.string().min(1, 'Gross monthly pay is required — needed for payroll'),
  taxId:                z.string().optional(),
  paymentMethod:        z.enum(['bank_transfer', 'mpesa', 'cash', 'paypal', 'crypto']).default('bank_transfer'),
  bankName:             z.string().optional(),
  bankAccountNumber:    z.string().optional(),
  mpesaNumber:          z.string().optional(),
  paypalEmail:          z.string().optional(),
  cryptoWalletAddress:  z.string().optional(),
  cryptoNetwork:        z.string().optional(),
  email:                z.string().email('Invalid email address'),
  phone:                z.string().optional(),
  staffCategory:        z.string().optional(),
  location:             z.string().optional(),
  costCenter:           z.string().optional(),
  nokName:              z.string().optional(),
  nokRelationship:      z.string().optional(),
  nokPhone:             z.string().optional(),
  nokNationalId:        z.string().optional(),
  nokEmail:             z.string().email('Invalid email').optional().or(z.literal('')),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const DEPARTMENTS = [
  'Administration', 'Human Resources', 'Finance & Accounts', 'Information Technology',
  'Operations', 'Sales & Marketing', 'Customer Service', 'Legal & Compliance',
  'Procurement', 'Logistics & Supply Chain', 'Research & Development', 'Communications',
  'Health & Safety', 'Facilities Management', 'Executive',
];

export const DESIGNATIONS = [
  'Chief Executive Officer', 'Chief Operations Officer', 'Chief Finance Officer',
  'General Manager', 'Department Manager', 'Head of Department', 'Team Lead',
  'Senior Officer', 'Officer', 'Junior Officer', 'Coordinator', 'Administrator',
  'Analyst', 'Specialist', 'Technician', 'Assistant', 'Intern', 'Support Staff',
];
