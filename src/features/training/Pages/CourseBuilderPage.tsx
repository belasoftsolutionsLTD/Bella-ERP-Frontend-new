'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConfigSection } from '@/hooks/useConfigSection';
import { DEPARTMENTS } from '@/features/employees/Components/EmployeeSchema';
import { useCourse, useCourses } from '../Hooks/useCourses';
import { useUserAccounts } from '../Hooks/useUserAccounts';
import { useCourseSessions } from '../Hooks/useSessions';
import { CreateCourseSchema, type CreateCourseFormValues } from '../schemas';
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS, MODULE_TYPE_OPTIONS } from '../constants';
import { AddModuleForm, QuizBuilder } from '../Components/ModuleEditor';
import { SessionsManager } from '../Components/SessionsManager';

const TARGET_ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'department_head', label: 'Department Head' },
  { value: 'staff', label: 'Staff' },
];

function ChipMultiSelect({ label, options, value, onChange }: {
  label: string; options: { value: string; label: string }[]; value: string[]; onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div>
      <label className="text-sm text-brand-text-muted block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-md border border-slate-300 p-2 min-h-[42px]">
        {options.length === 0 && <span className="text-xs text-brand-text-muted">No options available.</span>}
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              value.includes(opt.value)
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-brand-text-secondary border-slate-300 hover:border-brand-primary/50',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-brand-text-muted mt-1">{value.length === 0 ? 'All roles/departments eligible if none selected.' : `${value.length} selected.`}</p>
    </div>
  );
}

// Dropdown-to-add picker — the select starts empty (no options pre-shown as chips);
// picking one adds it below as a removable chip, then the select resets to empty.
function DropdownAddChips({ label, options, value, onChange }: {
  label: string; options: { value: string; label: string }[]; value: string[]; onChange: (next: string[]) => void;
}) {
  const remaining = options.filter((o) => !value.includes(o.value));
  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const add = (v: string) => { if (v) onChange([...value, v]); };
  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  return (
    <div>
      <label className="text-sm text-brand-text-muted block mb-1">{label}</label>
      <select
        value=""
        onChange={(e) => add(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Select a department to add…</option>
        {remaining.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((v) => (
            <span key={v} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary text-white">
              {labelFor(v)}
              <button type="button" onClick={() => remove(v)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-brand-text-muted mt-1">{value.length === 0 ? 'All departments eligible if none selected.' : `${value.length} selected.`}</p>
    </div>
  );
}

export function CourseBuilderPage({ locale, courseId }: { locale: string; courseId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = !!courseId;
  const { createCourse } = useCourses();
  const { course, updateCourse, publishCourse, addAuthor, addModule, deleteModule, createQuiz } = useCourse(courseId);
  const { accounts } = useUserAccounts();
  const departmentsConfig = useConfigSection('departments');
  const departmentOptions = (departmentsConfig.items.length > 0 ? departmentsConfig.items.map((d) => d.name) : DEPARTMENTS)
    .map((d) => ({ value: d, label: d }));
  const { sessions } = useCourseSessions(courseId);
  const [step, setStep] = useState(() => Number(searchParams.get('step')) || 0);
  const [quizModuleId, setQuizModuleId] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<CreateCourseFormValues>({
    resolver: zodResolver(CreateCourseSchema),
    defaultValues: {
      title: '', description: '', category: 'Technical', tags: [], skillsTaught: [],
      estimatedDurationMinutes: 30, difficultyLevel: 'beginner', isMandatory: false,
      targetRoles: [], targetDepartments: [], hasCertificate: false, certificateValidityDays: null,
      deliveryMethod: 'self_paced',
    },
  });
  const isInstructorLed = (course?.deliveryMethod ?? watch('deliveryMethod')) === 'instructor_led';
  const STEPS = ['Details', isInstructorLed ? 'Sessions' : 'Modules', 'Co-Authors', 'Review'];

  useEffect(() => {
    if (course) {
      reset({
        title: course.title, description: course.description, category: course.category,
        tags: course.tags, skillsTaught: course.skillsTaught,
        estimatedDurationMinutes: course.estimatedDurationMinutes, difficultyLevel: course.difficultyLevel,
        isMandatory: course.isMandatory, targetRoles: course.targetRoles, targetDepartments: course.targetDepartments,
        hasCertificate: course.hasCertificate, certificateValidityDays: course.certificateValidityDays,
        deliveryMethod: course.deliveryMethod ?? 'self_paced',
      });
    }
  }, [course?._id]);

  const onSubmitDetails = async (values: CreateCourseFormValues) => {
    if (isEditMode) {
      await updateCourse(values);
      setStep(1);
    } else {
      const result = await createCourse(values) as any;
      if (result?.data?._id) router.push(`/${locale}/training/courses/${result.data._id}/edit?step=1`);
    }
  };

  const modules = (course as any)?.modules || [];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button type="button" onClick={() => setStep(i)} className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${i === step ? 'bg-brand-primary text-white' : i < step ? 'bg-brand-primary/20 text-brand-primary' : 'bg-slate-100 text-brand-text-secondary'}`}>
              {i + 1}
            </button>
            <span className={`text-xs font-medium ${i === step ? 'text-brand-text' : 'text-brand-text-muted'} hidden sm:block`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-brand-bg-muted" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <form onSubmit={handleSubmit(onSubmitDetails)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Course Details</h2>
          <CustomInput component="text" name="title" control={control} label="Title" placeholder="e.g. Workplace Safety Fundamentals" required />
          <CustomInput component="textarea" name="description" control={control} label="Description" required />
          <CustomInput component="text" name="coverImageUrl" control={control} label="Cover Image URL (optional)" />
          <div className="grid grid-cols-2 gap-4">
            <CustomInput component="select" name="category" control={control} label="Category" options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))} required />
            <CustomInput component="select" name="difficultyLevel" control={control} label="Difficulty" options={DIFFICULTY_OPTIONS.map((d) => ({ value: d, label: d }))} required />
          </div>
          <CustomInput component="number" name="estimatedDurationMinutes" control={control} label="Estimated Duration (minutes)" required />
          <Controller
            control={control}
            name="deliveryMethod"
            render={({ field }) => (
              <div>
                <label className="text-sm text-brand-text-muted block mb-1">Delivery Method</label>
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={isEditMode}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-brand-text-secondary"
                >
                  <option value="self_paced">Self-Paced (video/document/quiz modules)</option>
                  <option value="instructor_led">Instructor-Led (scheduled live sessions)</option>
                </select>
                {isEditMode && <p className="text-xs text-brand-text-secondary mt-1">Delivery method can't be changed after a course is created.</p>}
              </div>
            )}
          />
          <Controller
            control={control}
            name="targetRoles"
            render={({ field }) => (
              <ChipMultiSelect label="Target Users" options={TARGET_ROLE_OPTIONS} value={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="targetDepartments"
            render={({ field }) => (
              <DropdownAddChips label="Target Departments" options={departmentOptions} value={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="skillsTaught"
            render={({ field }) => (
              <div>
                <label className="text-sm text-brand-text-muted block mb-1">Skills Taught (comma separated)</label>
                <input
                  defaultValue={field.value.join(', ')}
                  onBlur={(e) => field.onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}
          />
          <div className="flex gap-6">
            <Controller control={control} name="isMandatory" render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-brand-text-muted"><input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} /> Mandatory</label>
            )} />
            <Controller control={control} name="hasCertificate" render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-brand-text-muted"><input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} /> Awards certificate</label>
            )} />
          </div>
          <CustomInput component="number" name="certificateValidityDays" control={control} label="Certificate Validity (days, blank = never expires)" />

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white">
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </form>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {!isEditMode && <p className="text-sm text-amber-400">Save the course details first.</p>}
          {isEditMode && isInstructorLed && courseId && (
            <>
              <SessionsManager courseId={courseId} />
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button className="bg-brand-primary text-white" onClick={() => setStep(2)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </>
          )}
          {isEditMode && !isInstructorLed && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {modules.map((m: any) => (
                  <div key={m._id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.order + 1}. {m.title}</p>
                      <p className="text-xs text-brand-text-muted">{MODULE_TYPE_OPTIONS.find((o) => o.value === m.type)?.label}{m.isRequired ? ' · Required' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.type === 'quiz' && (
                        <button onClick={() => setQuizModuleId(quizModuleId === m._id ? null : m._id)} className="text-xs text-brand-primary hover:underline">
                          {quizModuleId === m._id ? 'Close' : 'Configure Quiz'}
                        </button>
                      )}
                      <button onClick={() => deleteModule(m._id)} className="text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
                {modules.length === 0 && <p className="p-6 text-sm text-brand-text-secondary text-center">No modules yet.</p>}
              </div>

              {quizModuleId && (
                <QuizBuilder onSave={(payload) => { createQuiz(quizModuleId, payload); setQuizModuleId(null); }} />
              )}

              <AddModuleForm onAdd={(payload) => addModule(payload)} />

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button className="bg-brand-primary text-white" onClick={() => setStep(2)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && isEditMode && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Co-Authors</h2>
            <div className="flex flex-wrap gap-2">
              {(course?.authors || []).map((a) => {
                const acc = accounts.find((x) => x._id === a);
                return <span key={a} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{acc?.name || a}</span>;
              })}
            </div>
            <select onChange={(e) => e.target.value && addAuthor(e.target.value)} value="" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Add a co-author...</option>
              {accounts.filter((a) => !(course?.authors || []).includes(a._id)).map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button className="bg-brand-primary text-white" onClick={() => setStep(3)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {step === 3 && isEditMode && course && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Review</h2>
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="text-brand-text-muted">Title</dt><dd className="font-medium">{course.title}</dd></div>
              <div className="flex justify-between"><dt className="text-brand-text-muted">Delivery</dt><dd className="font-medium">{isInstructorLed ? 'Instructor-Led' : 'Self-Paced'}</dd></div>
              {isInstructorLed ? (
                <div className="flex justify-between"><dt className="text-brand-text-muted">Sessions</dt><dd className="font-medium">{sessions.filter((s) => s.status !== 'cancelled').length}</dd></div>
              ) : (
                <div className="flex justify-between"><dt className="text-brand-text-muted">Modules</dt><dd className="font-medium">{modules.length}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-brand-text-muted">Status</dt><dd className="font-medium capitalize">{course.status}</dd></div>
            </dl>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
            {course.status !== 'published' ? (
              <Button className="bg-brand-primary text-white" onClick={() => publishCourse().then(() => router.push(`/${locale}/training/courses/${courseId}`))}>Publish Course</Button>
            ) : (
              <Button variant="outline" onClick={() => router.push(`/${locale}/training/courses/${courseId}`)}>Done</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
