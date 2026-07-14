'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, PlayCircle, FileText, Link2, Box, Award, ArrowLeft, Calendar, Users, Video } from 'lucide-react';
import { useCatalogCourse, useModuleQuiz } from '../Hooks/useCatalog';
import { useMyEnrollments } from '../Hooks/useEnrollments';
import { useMyCertificates } from '../Hooks/useCertificates';
import { useCourseSessionsForLearner, useMySessions } from '../Hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import { QuizPlayer } from '../Components/QuizPlayer';
import { resolveVideoEmbed } from '../videoEmbed';
import { resolveMediaUrl } from '../mediaUrl';
import type { CourseModule, Enrollment } from '../types';

const MODULE_ICONS: Record<string, any> = { video: PlayCircle, document: FileText, text: FileText, link: Link2, scorm: Box, quiz: Award };

function LiveSessionsCourseView({ locale, courseId, courseTitle, enrollment }: {
  locale: string; courseId: string; courseTitle: string; enrollment?: Enrollment | null;
}) {
  const { sessions, isLoading } = useCourseSessionsForLearner(courseId);
  const { register, unregister } = useMySessions();
  const { userData } = useAuth();
  // Not enrollment.employeeId — right after registering for the first session, the
  // enrollment prop (sourced from useCatalogCourse) can still be stale until that query
  // revalidates, but the logged-in user's own id never is.
  const myId = userData?._id;

  return (
    <div className="p-6">
      <Link href={`/${locale}/my/training`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to My Training
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">{courseTitle}</h2>
        <p className="text-sm text-slate-500 mb-4">Instructor-led — register for an upcoming session below.</p>

        {enrollment?.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-green-800">You've completed this course.</p>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-400">Loading sessions...</p>
        ) : sessions.filter((s) => s.status !== 'cancelled').length === 0 ? (
          <p className="text-sm text-slate-400">No sessions scheduled yet — check back later.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.filter((s) => s.status !== 'cancelled').map((s) => {
              const isRegistered = !!myId && s.attendeeIds.includes(myId);
              const isFull = !!s.capacity && s.attendeeIds.length >= s.capacity && !isRegistered;
              const attendedThis = s.attendance.find((a) => a.employeeId === myId)?.attended;
              return (
                <div key={s._id} className="py-4 space-y-1.5">
                  <p className="text-sm font-medium text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(s.scheduledAt).toLocaleString()} · {s.durationMinutes}min</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.attendeeIds.length}{s.capacity ? `/${s.capacity}` : ''} registered</span>
                    {s.facilitatorName && <span>· facilitated by {s.facilitatorName}</span>}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    {s.status === 'completed' ? (
                      <span className={`text-xs font-medium ${attendedThis ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {attendedThis ? '✓ Attended' : isRegistered ? 'Registered — attendance not yet marked' : 'Session ended'}
                      </span>
                    ) : isRegistered ? (
                      <>
                        <a href={s.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Video className="h-3 w-3" /> Join Meeting</a>
                        <button onClick={() => unregister(s._id)} className="text-xs text-slate-400 hover:underline">Unregister</button>
                      </>
                    ) : (
                      <button
                        onClick={() => register(s._id)}
                        disabled={isFull}
                        className="text-xs font-medium text-primary hover:underline disabled:text-slate-300 disabled:no-underline"
                      >
                        {isFull ? 'Session full' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoContent({ url }: { url: string }) {
  const embed = resolveVideoEmbed(url);
  if (!embed) return <p className="text-sm text-slate-400">No video URL configured.</p>;
  if (embed.kind === 'youtube' || embed.kind === 'vimeo') {
    return (
      <div className="w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
        <iframe src={embed.embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return <video controls src={resolveMediaUrl(embed.url)} className="w-full rounded-lg bg-black max-h-[420px]" />;
}

function ModuleContentView({ module_ }: { module_: CourseModule }) {
  const c = module_.content || {};
  if (module_.type === 'video') {
    return c.url ? <VideoContent url={c.url} /> : <p className="text-sm text-slate-400">No video URL configured.</p>;
  }
  if (module_.type === 'document') {
    return c.fileUrl ? (
      <a href={resolveMediaUrl(c.fileUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline text-sm">
        <FileText className="h-4 w-4" /> Open {c.fileName || 'document'}
      </a>
    ) : <p className="text-sm text-slate-400">No document uploaded.</p>;
  }
  if (module_.type === 'text') {
    return <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">{c.markdown || 'No content.'}</div>;
  }
  if (module_.type === 'link') {
    return c.linkUrl ? (
      <div className="space-y-1">
        <a href={c.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline text-sm"><Link2 className="h-4 w-4" /> {c.linkUrl}</a>
        {c.linkDescription && <p className="text-sm text-slate-500">{c.linkDescription}</p>}
      </div>
    ) : <p className="text-sm text-slate-400">No link configured.</p>;
  }
  if (module_.type === 'scorm') {
    return c.packageUrl ? <iframe src={c.packageUrl} className="w-full h-[480px] rounded-lg border border-slate-200" /> : <p className="text-sm text-slate-400">No SCORM package configured.</p>;
  }
  return null;
}

function QuizModule({ moduleId, enrollmentId, existingProgress, onSubmitted }: {
  moduleId: string; enrollmentId: string; existingProgress?: { attempts: number };
  onSubmitted: () => void;
}) {
  const { quiz, isLoading } = useModuleQuiz(moduleId);
  const { submitQuizAttempt } = useMyEnrollments();

  if (isLoading) return <p className="text-sm text-slate-400">Loading quiz...</p>;
  if (!quiz) return <p className="text-sm text-slate-400">Quiz not available.</p>;

  const attemptsUsed = existingProgress?.attempts || 0;
  const attemptsRemaining = Math.max(0, quiz.maxAttempts - attemptsUsed);

  return (
    <QuizPlayer
      quiz={quiz}
      attemptsRemaining={attemptsRemaining}
      onSubmit={async (answers) => {
        const res = await submitQuizAttempt(enrollmentId, moduleId, answers);
        onSubmitted();
        return (res as any)?.data;
      }}
    />
  );
}

export function MyCourseLearnerPage({ locale, courseId }: { locale: string; courseId: string }) {
  const { course, isLoading, mutate } = useCatalogCourse(courseId);
  const { updateProgress } = useMyEnrollments();
  const { generateCertificate } = useMyCertificates();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [certGenerated, setCertGenerated] = useState(false);

  const modules = useMemo(() => (course?.modules ?? []).slice().sort((a, b) => a.order - b.order), [course]);
  const enrollment = course?.myEnrollment;

  useEffect(() => {
    if (!activeModuleId && modules.length) setActiveModuleId(modules[0]._id);
  }, [modules, activeModuleId]);

  if (isLoading) return <div className="p-6 text-sm text-slate-400">Loading course...</div>;
  if (!course) return <div className="p-6 text-sm text-slate-400">Course not found.</div>;

  // Instructor-led courses have no async modules to work through — registering for a
  // session is what creates the enrollment, so this branches before the "not enrolled,
  // contact HR" gate below (which only applies to self-paced courses HR assigns directly).
  if (course.deliveryMethod === 'instructor_led') {
    return <LiveSessionsCourseView locale={locale} courseId={courseId} courseTitle={course.title} enrollment={enrollment} />;
  }

  if (!enrollment) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-400">You are not enrolled in this course. Contact HR to be assigned.</p>
        <Link href={`/${locale}/my/training/catalog`} className="text-primary text-sm hover:underline">Back to catalog</Link>
      </div>
    );
  }

  const activeModule = modules.find((m) => m._id === activeModuleId);
  const progressFor = (moduleId: string) => enrollment.moduleProgress.find((p) => String(p.moduleId) === String(moduleId));
  const isComplete = (moduleId: string) => progressFor(moduleId)?.status === 'completed';

  const markComplete = async () => {
    if (!activeModule) return;
    await updateProgress(enrollment._id, activeModule._id, 'completed');
    mutate();
  };

  const handleGenerateCertificate = async () => {
    const res = await generateCertificate(enrollment._id);
    if (res) setCertGenerated(true);
  };

  return (
    <div className="p-6">
      <Link href={`/${locale}/my/training`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to My Training
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3 h-fit lg:sticky lg:top-4">
          <h2 className="font-semibold text-slate-900 px-2 mb-2">{course.title}</h2>
          <div className="px-2 mb-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${enrollment.progressPercentage}%` }} /></div>
            <p className="text-xs text-slate-500 mt-1">{enrollment.progressPercentage}% complete</p>
          </div>
          <div className="space-y-1">
            {modules.map((m) => {
              const Icon = MODULE_ICONS[m.type] || FileText;
              const done = isComplete(m._id);
              return (
                <button key={m._id} onClick={() => setActiveModuleId(m._id)} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition ${activeModuleId === m._id ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <Circle className="h-4 w-4 text-slate-300 shrink-0" />}
                  <Icon className="h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate flex-1">{m.title}</span>
                  {!m.isRequired && <span className="text-[10px] text-slate-400">optional</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {enrollment.status === 'completed' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <p className="text-sm font-medium text-green-800">You've completed this course!</p>
              {course.hasCertificate && (
                <button onClick={handleGenerateCertificate} disabled={certGenerated} className="text-sm text-primary font-medium hover:underline disabled:opacity-50">
                  {certGenerated ? 'Certificate ready — see My Certificates' : 'Get Certificate'}
                </button>
              )}
            </div>
          ) : null}

          {activeModule && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">{activeModule.title}</h3>
              {activeModule.type === 'quiz' ? (
                <QuizModule
                  moduleId={activeModule._id}
                  enrollmentId={enrollment._id}
                  existingProgress={progressFor(activeModule._id)}
                  onSubmitted={mutate}
                />
              ) : (
                <>
                  <ModuleContentView module_={activeModule} />
                  <div className="pt-4 border-t border-slate-100">
                    {isComplete(activeModule._id) ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium"><CheckCircle2 className="h-4 w-4" /> Completed</span>
                    ) : (
                      <button onClick={markComplete} className="px-3 py-2 rounded-md bg-primary text-white text-sm font-medium">Mark as Complete</button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
