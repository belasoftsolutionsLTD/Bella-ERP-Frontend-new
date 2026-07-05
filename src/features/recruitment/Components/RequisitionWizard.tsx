'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { DEPARTMENTS } from '@/features/employees/Components/EmployeeSchema';
import { useRequisitions } from '../Hooks/useRequisitions';
import { useUserAccounts } from '../Hooks/useUserAccounts';
import { CreateRequisitionSchema, type CreateRequisitionFormValues } from '../schemas';
import { STAGE_TYPE_OPTIONS, uid } from '../constants';

const STEPS = ['Basic Details', 'Competencies', 'Pipeline Stages', 'Approval Chain', 'Review'];

export function RequisitionWizard({ locale }: { locale: string }) {
  const router = useRouter();
  const { createRequisition } = useRequisitions();
  const { accounts } = useUserAccounts();
  const [step, setStep] = useState(0);

  const { control, register, handleSubmit, watch, trigger, setValue, formState: { errors, isSubmitting } } = useForm<CreateRequisitionFormValues>({
    resolver: zodResolver(CreateRequisitionSchema),
    defaultValues: {
      title: '', department: '', location: '', employmentType: 'fullTime', headcount: 1,
      salaryRange: { min: 0, max: 0, currency: 'KES' },
      description: '', competencies: [], pipelineStages: [], approvalChain: [], hiringManagerId: '',
    },
  });

  const competencies = useFieldArray({ control, name: 'competencies' });
  const pipelineStages = useFieldArray({ control, name: 'pipelineStages' });
  const approvalChain = useFieldArray({ control, name: 'approvalChain' });

  const managerOptions = accounts
    .filter((a) => ['hr_manager', 'department_head', 'super_admin'].includes(a.role))
    .map((a) => ({ value: a._id, label: `${a.name} (${a.role.replace('_', ' ')})` }));

  const stepFields: (keyof CreateRequisitionFormValues)[][] = [
    ['title', 'department', 'location', 'employmentType', 'headcount', 'salaryRange', 'description', 'hiringManagerId'],
    ['competencies'],
    ['pipelineStages'],
    ['approvalChain'],
    [],
  ];

  const next = async () => {
    const valid = await trigger(stepFields[step] as any);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: CreateRequisitionFormValues) => {
    const result = await createRequisition(values) as any;
    if (result?.data?._id) router.push(`/${locale}/recruitment/requisitions/${result.data._id}`);
  };

  const values = watch();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${i === step ? 'bg-primary text-white' : i < step ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-400'}`}>
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-slate-100' : 'text-slate-500'} hidden sm:block`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-700" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Basic Details</h2>
            <CustomInput component="text" name="title" control={control} label="Job Title" placeholder="e.g. Senior Accountant" />
            <div className="grid grid-cols-2 gap-4">
              <CustomInput component="select" name="department" control={control} label="Department" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
              <CustomInput component="text" name="location" control={control} label="Location" placeholder="e.g. Nairobi or Remote" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CustomInput component="select" name="employmentType" control={control} label="Employment Type" options={[
                { value: 'fullTime', label: 'Full-Time' }, { value: 'partTime', label: 'Part-Time' },
                { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
              ]} />
              <CustomInput component="number" name="headcount" control={control} label="Headcount" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <CustomInput component="number" name="salaryRange.min" control={control} label="Salary Min" />
              <CustomInput component="number" name="salaryRange.max" control={control} label="Salary Max" />
              <CustomInput component="text" name="salaryRange.currency" control={control} label="Currency" placeholder="KES" />
            </div>
            <CustomInput component="textarea" name="description" control={control} label="Job Description" />
            <CustomInput component="select" name="hiringManagerId" control={control} label="Hiring Manager" options={managerOptions} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Competencies</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => competencies.append({ id: uid(), name: '', description: '', weight: 3 })}>
                <Plus className="h-4 w-4 mr-1" /> Add Competency
              </Button>
            </div>
            {competencies.fields.length === 0 && <p className="text-sm text-slate-500">No competencies added yet. These become the scorecard categories interviewers rate.</p>}
            {competencies.fields.map((field, i) => (
              <div key={field.id} className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input {...register(`competencies.${i}.name`)} placeholder="Competency name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <textarea {...register(`competencies.${i}.description`)} placeholder="Description / evaluation guidance" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500">Weight (1-5)</label>
                      <input type="number" min={1} max={5} {...register(`competencies.${i}.weight`, { valueAsNumber: true })} className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    </div>
                  </div>
                  <button type="button" onClick={() => competencies.remove(i)} className="text-red-500 hover:text-red-700 p-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Pipeline Stages</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => pipelineStages.append({ id: uid(), name: '', type: 'screening', requiresScorecard: false, autoActions: [] })}>
                <Plus className="h-4 w-4 mr-1" /> Add Stage
              </Button>
            </div>
            {errors.pipelineStages && <p className="text-xs text-danger">{errors.pipelineStages.message as string}</p>}
            {pipelineStages.fields.map((field, i) => (
              <div key={field.id} className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input {...register(`pipelineStages.${i}.name`)} placeholder="Stage name (e.g. Phone Screen)" className="rounded-md border border-slate-300 px-3 py-2 text-sm col-span-2" />
                    <Controller
                      control={control}
                      name={`pipelineStages.${i}.type`}
                      render={({ field: f }) => (
                        <select {...f} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                          {STAGE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      )}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" {...register(`pipelineStages.${i}.requiresScorecard`)} /> Requires scorecard
                    </label>
                  </div>
                  <button type="button" onClick={() => pipelineStages.remove(i)} className="text-red-500 hover:text-red-700 p-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Controller
                  control={control}
                  name={`pipelineStages.${i}.autoActions`}
                  render={({ field: f }) => {
                    const actions = f.value || [];
                    const has = (action: 'emailCandidate' | 'notifyHiringManager') =>
                      actions.some((a) => a.trigger === 'onEnter' && a.action === action);
                    const toggle = (action: 'emailCandidate' | 'notifyHiringManager') => {
                      if (has(action)) {
                        f.onChange(actions.filter((a) => !(a.trigger === 'onEnter' && a.action === action)));
                      } else {
                        f.onChange([...actions, { trigger: 'onEnter' as const, action }]);
                      }
                    };
                    return (
                      <div className="flex flex-wrap gap-4 pt-1 border-t border-slate-100 mt-2">
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" checked={has('emailCandidate')} onChange={() => toggle('emailCandidate')} />
                          Email the candidate when they enter this stage
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" checked={has('notifyHiringManager')} onChange={() => toggle('notifyHiringManager')} />
                          Notify hiring manager when they enter this stage
                        </label>
                      </div>
                    );
                  }}
                />
              </div>
            ))}
            <p className="text-xs text-slate-500">Order matters — candidates move through these stages left to right. Include a final stage of type &quot;Hired&quot; to trigger onboarding automatically. Candidate emails use a standard &quot;your application has moved to X&quot; message.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Approval Chain</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => approvalChain.append({ approverId: '', approverName: '', status: 'pending' })}>
                <Plus className="h-4 w-4 mr-1" /> Add Approver
              </Button>
            </div>
            {approvalChain.fields.length === 0 && <p className="text-sm text-slate-500">Add at least one approver before this requisition can be submitted.</p>}
            {approvalChain.fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`approvalChain.${i}.approverId`}
                  render={({ field: f }) => (
                    <select
                      {...f}
                      onChange={(e) => {
                        f.onChange(e.target.value);
                        const name = accounts.find((a) => a._id === e.target.value)?.name || '';
                        setValue(`approvalChain.${i}.approverName`, name);
                      }}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select approver</option>
                      {managerOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                />
                <button type="button" onClick={() => approvalChain.remove(i)} className="text-red-500 hover:text-red-700 p-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Review</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-slate-500">Title</dt><dd className="font-medium">{values.title}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Department</dt><dd className="font-medium">{values.department}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="font-medium">{values.location}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Headcount</dt><dd className="font-medium">{values.headcount}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Competencies</dt><dd className="font-medium">{values.competencies?.length || 0}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Pipeline Stages</dt><dd className="font-medium">{values.pipelineStages?.length || 0}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Approvers</dt><dd className="font-medium">{values.approvalChain?.length || 0}</dd></div>
            </dl>
            <p className="text-xs text-slate-500">This requisition will be created as a Draft. You can submit it for approval from the requisition detail page once ready.</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} className="bg-primary text-white">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting ? 'Creating...' : 'Create Requisition'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
