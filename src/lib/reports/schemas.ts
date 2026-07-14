import { z } from 'zod';

export const REPORT_DATA_SOURCES = ['employees', 'attendance', 'leave', 'payroll', 'performance', 'expenses'] as const;

export const FilterOperatorSchema = z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']);

export const ReportFilterSchema = z.object({
  field: z.string().min(1),
  operator: FilterOperatorSchema,
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
});

export const CustomReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  dataSources: z.array(z.enum(REPORT_DATA_SOURCES)).min(1, 'Select at least one data source'),
  fields: z.array(z.string()).min(1, 'Select at least one field'),
  filters: z.array(ReportFilterSchema).default([]),
  groupBy: z.string().optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  format: z.enum(['json', 'csv']).default('json'),
  save: z.boolean().optional(),
});

export type CustomReport = z.infer<typeof CustomReportSchema>;

export const ExportRequestSchema = z.object({
  reportType: z.string().min(1),
  format: z.enum(['csv', 'pdf']),
  params: z.record(z.any()).optional(),
});

export type ExportRequest = z.infer<typeof ExportRequestSchema>;

export const ScheduleReportSchema = z.object({
  frequency: z.enum(['weekly', 'monthly']),
  recipients: z.array(z.string().email('Must be a valid email')).min(1, 'At least one recipient is required'),
});

export type ScheduleReport = z.infer<typeof ScheduleReportSchema>;
