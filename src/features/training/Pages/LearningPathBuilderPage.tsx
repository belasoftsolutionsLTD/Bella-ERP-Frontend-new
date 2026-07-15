'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { useLearningPaths, useLearningPath } from '../Hooks/useLearningPaths';
import { useCourses } from '../Hooks/useCourses';
import { CreateLearningPathSchema, type CreateLearningPathFormValues } from '../schemas';

export function LearningPathBuilderPage({ locale, pathId }: { locale: string; pathId?: string }) {
  const router = useRouter();
  const isEditMode = !!pathId;
  const { createPath } = useLearningPaths();
  const { path, updatePath } = useLearningPath(pathId);
  const { courses } = useCourses({ status: 'published' });

  const { control, register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateLearningPathFormValues>({
    resolver: zodResolver(CreateLearningPathSchema),
    defaultValues: { name: '', description: '', courses: [], targetRoles: [], targetDepartments: [], enrollmentTrigger: 'manual' },
  });
  const coursesField = useFieldArray({ control, name: 'courses' });

  useEffect(() => {
    if (path) {
      reset({
        name: path.name, description: path.description,
        courses: path.courses.map((c) => ({ courseId: c.courseId, order: c.order, isRequired: c.isRequired, unlockAfterCourseId: c.unlockAfterCourseId })),
        targetRoles: path.targetRoles, targetDepartments: path.targetDepartments,
        enrollmentTrigger: path.enrollmentTrigger, dueDateOffsetDays: path.dueDateOffsetDays,
      });
    }
  }, [path?._id]);

  const onSubmit = async (values: CreateLearningPathFormValues) => {
    if (isEditMode) {
      const result = await updatePath(values);
      if (result !== undefined) router.push(`/${locale}/training/learning-paths`);
    } else {
      const result = await createPath(values) as any;
      if (result?.data?._id) router.push(`/${locale}/training/learning-paths`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">{isEditMode ? 'Edit Learning Path' : 'New Learning Path'}</h1>
        <CustomInput component="text" name="name" control={control} label="Name" placeholder="e.g. Onboarding Path" />
        <CustomInput component="textarea" name="description" control={control} label="Description" />
        <CustomInput component="select" name="enrollmentTrigger" control={control} label="Enrollment Trigger" options={[
          { value: 'manual', label: 'Manual' }, { value: 'onHire', label: 'On Hire' },
          { value: 'onRoleChange', label: 'On Role Change' }, { value: 'onPerformanceReview', label: 'On Performance Review' },
          { value: 'scheduled', label: 'Scheduled' },
        ]} />
        <CustomInput component="number" name="dueDateOffsetDays" control={control} label="Due Date Offset (days from enrollment)" />

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Courses</p>
            <Button type="button" size="sm" variant="outline" onClick={() => coursesField.append({ courseId: '', order: coursesField.fields.length, isRequired: true })}>
              <Plus className="h-4 w-4 mr-1" /> Add Course
            </Button>
          </div>
          {coursesField.fields.map((field, i) => (
            <div key={field.id} className="flex items-center gap-2">
              <Controller
                control={control}
                name={`courses.${i}.courseId`}
                render={({ field: f }) => (
                  <select {...f} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Select course...</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                )}
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                <input type="checkbox" {...register(`courses.${i}.isRequired`)} /> Required
              </label>
              <button type="button" onClick={() => coursesField.remove(i)} className="text-red-500 p-1.5"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {coursesField.fields.length === 0 && <p className="text-xs text-slate-400">Add at least one course.</p>}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white">{isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Path'}</Button>
        </div>
      </form>
    </div>
  );
}
