// A curated, generic skills catalog used to back the "Add a skill" dropdown across the
// app (employee profile — HR-side and staff self-service). Not backend-driven by design;
// this mirrors DEPARTMENTS/DESIGNATIONS in EmployeeSchema.tsx — a static list is enough
// here, with an "Other" escape hatch for anything not covered.
export const SKILLS_CATALOG = [
  // Technical / IT
  'Microsoft Excel', 'Microsoft Word', 'Microsoft PowerPoint', 'Data Analysis',
  'Data Entry', 'SQL', 'Python', 'JavaScript', 'Web Development', 'Networking',
  'IT Support', 'Cybersecurity', 'Cloud Computing', 'ERP Systems', 'Database Management',
  // Finance / Accounting
  'Financial Reporting', 'Bookkeeping', 'Budgeting', 'Payroll Processing', 'Auditing',
  'Tax Compliance', 'Accounts Payable', 'Accounts Receivable', 'Financial Modeling',
  // HR / People
  'Recruitment', 'Employee Relations', 'Performance Management', 'Training & Development',
  'HR Policy', 'Onboarding', 'Compensation & Benefits', 'Labor Law Compliance',
  // Sales / Marketing
  'Sales', 'Business Development', 'Digital Marketing', 'Social Media Management',
  'Content Writing', 'SEO', 'Customer Relationship Management', 'Market Research',
  'Negotiation',
  // Operations / Logistics
  'Project Management', 'Supply Chain Management', 'Inventory Management', 'Procurement',
  'Quality Assurance', 'Logistics Coordination', 'Vendor Management',
  // Customer Service
  'Customer Service', 'Client Relationship Management', 'Complaint Resolution',
  // Soft skills
  'Communication', 'Leadership', 'Team Management', 'Problem Solving', 'Time Management',
  'Public Speaking', 'Critical Thinking', 'Conflict Resolution', 'Adaptability',
  // Legal / Compliance
  'Contract Management', 'Regulatory Compliance', 'Risk Management', 'Legal Research',
  // Other professional
  'Report Writing', 'Strategic Planning', 'Change Management', 'Event Planning',
  'Driving License', 'First Aid',
].sort();
