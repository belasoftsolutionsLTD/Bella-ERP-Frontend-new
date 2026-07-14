import { z } from 'zod';

export const employeeSchema = z.object({
  firstName:            z.string().min(1, 'First name is required'),
  lastName:             z.string().min(1, 'Last name is required'),
  // Derived client-side from firstName + lastName before submit — not directly
  // user-entered, kept as the canonical display name every other module reads.
  fullName:             z.string().optional(),
  nationalId:           z.string().min(1, 'National ID is required'),
  designation:          z.string().min(1, 'Designation is required'),
  employmentType:       z.enum(['permanent', 'contract', 'part-time', 'intern']),
  department:           z.string().min(1, 'Department is required'),
  dateOfHire:           z.string().min(1, 'Date of hire is required'),
  dateOfBirth:          z.string().optional(),
  contractEndDate:      z.string().optional(),
  probationEndDate:     z.string().optional(),
  confirmationDate:     z.string().optional(),
  preferredName:        z.string().optional(),
  gender:               z.enum(['male', 'female', 'preferNotToSay']).optional(),
  maritalStatus:        z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  nationality:          z.string().optional(),
  passportNumber:       z.string().optional(),
  passportExpiryDate:   z.string().optional(),
  addressStreet:        z.string().optional(),
  addressCity:          z.string().optional(),
  addressState:         z.string().optional(),
  addressCountry:       z.string().optional(),
  addressPostalCode:    z.string().optional(),
  jobGroupId:           z.string().min(1, 'Job group is required'),
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

// CBK-licensed commercial banks operating in Kenya. 'Other' lets a bank not in
// this list be captured as free text instead of being blocked entirely.
export const KENYA_BANKS = [
  'KCB Bank Kenya', 'Equity Bank Kenya', 'Co-operative Bank of Kenya', 'Absa Bank Kenya',
  'Standard Chartered Bank Kenya', 'Diamond Trust Bank (DTB)', 'I&M Bank', 'NCBA Bank Kenya',
  'Stanbic Bank Kenya', 'Family Bank', 'Bank of Africa Kenya', 'Bank of Baroda Kenya',
  'Bank of India', 'Citibank N.A. Kenya', 'Consolidated Bank of Kenya', 'Credit Bank',
  'Development Bank of Kenya', 'Ecobank Kenya', 'Access Bank Kenya', 'Guaranty Trust Bank (GTBank) Kenya',
  'Guardian Bank', 'Gulf African Bank', 'Habib Bank A.G. Zurich', 'HFC Limited (HF Group)',
  'Kingdom Bank', 'Middle East Bank Kenya', 'M Oriental Bank', 'National Bank of Kenya',
  'Paramount Bank', 'Premier Bank Kenya', 'Prime Bank', 'SBM Bank Kenya', 'Sidian Bank',
  'Spire Bank', 'UBA Kenya', 'Victoria Commercial Bank', 'First Community Bank',
  'Other',
];

// Kenyan mobile format: 254 followed by 9 digits, Safaricom/Airtel/Telkom ranges start with 7 or 1.
export const MPESA_NUMBER_REGEX = /^254(7|1)\d{8}$/;
export const MPESA_NUMBER_ERROR = 'M-Pesa number must start with 254 and be a valid Kenyan mobile number (e.g. 254712345678).';
