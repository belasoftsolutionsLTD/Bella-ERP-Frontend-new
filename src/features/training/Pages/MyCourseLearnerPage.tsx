'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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

// Conservative average adult reading speed, used only to decide when the "Mark as
// Complete" button on a text module becomes clickable — never to auto-complete it.
const AVERAGE_READING_WPM = 200;

// Fallback minimum wait for an embedded (YouTube/Vimeo) video, used only if the
// platform's postMessage API never becomes available (see the *VideoContent safety-net
// timers) — real watch-progress tracking is the source of truth otherwise.
const DEFAULT_VIDEO_GATE_MINUTES = 3;

// Minimum time a PDF/document module must stay open before "Mark as Complete" unlocks.
// There's no reliable page count to time against generically, so this is a flat floor —
// weaker than the text module's word-count timer, but a large improvement over the
// single click that used to unlock it instantly.
const MIN_DOCUMENT_DWELL_MS = 20000;

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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
      <Link href={`/${locale}/my/training`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-text mb-4">
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
                        <a href={s.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"><Video className="h-3 w-3" /> Join Meeting</a>
                        <button onClick={() => unregister(s._id)} className="text-xs text-slate-400 hover:underline">Unregister</button>
                      </>
                    ) : (
                      <button
                        onClick={() => register(s._id)}
                        disabled={isFull}
                        className="text-xs font-medium text-brand-primary hover:underline disabled:text-brand-text-secondary disabled:no-underline"
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

// Fraction of real (not wall-clock) watch time required before an embedded video's
// gate opens — allows normal rounding/replay-skip near the very end without letting
// someone open the module and walk away for the fallback timer to do the work.
const EMBED_WATCH_THRESHOLD = 0.9;

function YoutubeVideoContent({ embedUrl, onGateOpen }: { embedUrl: string; onGateOpen: () => void }) {
  const playerRef = useRef<any>(null);
  const furthestRef = useRef(0);
  const openedRef = useRef(false);
  const elementId = useRef(`yt-player-${Math.random().toString(36).slice(2)}`).current;
  // Handing an already-built <iframe> to `new YT.Player(iframeEl, {...})` ("adopt an
  // existing element") turned out unreliable — the player never actually rendered/played
  // for some videos. Letting YT.Player own iframe creation entirely (the pattern
  // YouTube's own docs lead with) is the well-tested path, so this targets an empty
  // container div by id and passes videoId instead of a pre-built src.
  const videoId = embedUrl.match(/\/embed\/([\w-]+)/)?.[1] ?? '';

  useEffect(() => {
    openedRef.current = false;
    furthestRef.current = 0;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const open = () => { if (!openedRef.current) { openedRef.current = true; onGateOpen(); } };

    function attachPoll(player: any) {
      pollTimer = setInterval(() => {
        if (cancelled) return;
        try {
          const duration = player.getDuration?.();
          const current = player.getCurrentTime?.();
          if (typeof current === 'number' && current > furthestRef.current) furthestRef.current = current;
          if (duration > 0 && furthestRef.current >= duration * EMBED_WATCH_THRESHOLD) open();
        } catch { /* player not ready yet */ }
      }, 1000);
    }

    function createPlayer() {
      if (cancelled || !videoId || !document.getElementById(elementId)) return;
      const YT = (window as any).YT;
      playerRef.current = new YT.Player(elementId, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { enablejsapi: 1, rel: 0 },
        events: {
          onReady: (e: any) => attachPoll(e.target),
          onStateChange: (e: any) => { if (e.data === YT.PlayerState.ENDED) open(); },
        },
      });
    }

    // Real progress tracking is the source of truth; this is only a safety net in case
    // the IFrame API script never loads (blocked network, ad blocker) — generous enough
    // that genuine tracking always wins first, but the module still isn't permanently
    // stuck for a learner whose browser can't reach youtube.com's API script.
    const fallbackTimer = setTimeout(open, DEFAULT_VIDEO_GATE_MINUTES * 60 * 1000 * 3);

    if ((window as any).YT?.Player) {
      createPlayer();
    } else {
      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prevCb = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => { prevCb?.(); if (!cancelled) createPlayer(); };
    }

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      clearTimeout(fallbackTimer);
      try { playerRef.current?.destroy?.(); } catch { /* already gone */ }
    };
  }, [videoId, elementId, onGateOpen]);

  if (!videoId) return <p className="text-sm text-slate-400">Invalid YouTube URL.</p>;

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
      <div id={elementId} className="w-full h-full" />
    </div>
  );
}

function VimeoVideoContent({ embedUrl, onGateOpen }: { embedUrl: string; onGateOpen: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const furthestRef = useRef(0);
  const openedRef = useRef(false);

  useEffect(() => {
    openedRef.current = false;
    furthestRef.current = 0;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const open = () => { if (!openedRef.current) { openedRef.current = true; onGateOpen(); } };
    const post = (method: string, value?: unknown) =>
      iframe.contentWindow?.postMessage(JSON.stringify({ method, value }), 'https://player.vimeo.com');

    function onMessage(e: MessageEvent) {
      if (e.origin !== 'https://player.vimeo.com') return;
      let data: any;
      try { data = JSON.parse(e.data); } catch { return; }
      if (data.event === 'ready') {
        post('addEventListener', 'timeupdate');
        post('addEventListener', 'ended');
      } else if (data.event === 'timeupdate' && data.data) {
        const { seconds, duration } = data.data;
        if (typeof seconds === 'number' && seconds > furthestRef.current) furthestRef.current = seconds;
        if (duration > 0 && furthestRef.current >= duration * EMBED_WATCH_THRESHOLD) open();
      } else if (data.event === 'ended') {
        open();
      }
    }

    window.addEventListener('message', onMessage);
    // Nudge in case the player's own 'ready' postMessage fired before this listener
    // attached (Vimeo's protocol doesn't replay it on request otherwise).
    post('addEventListener', 'ready');

    // Same safety-net rationale as the YouTube branch — real tracking wins first.
    const fallbackTimer = setTimeout(open, DEFAULT_VIDEO_GATE_MINUTES * 60 * 1000 * 3);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(fallbackTimer);
    };
  }, [embedUrl, onGateOpen]);

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
      <iframe
        ref={iframeRef}
        src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}api=1`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function VideoContent({ url, onGateOpen }: { url: string; onGateOpen: () => void }) {
  const embed = resolveVideoEmbed(url);
  // Furthest point actually watched — a ref, not state, since timeupdate fires many
  // times a second and shouldn't trigger re-renders.
  const furthestTimeRef = useRef(0);

  if (!embed) return <p className="text-sm text-slate-400">No video URL configured.</p>;
  if (embed.kind === 'youtube') return <YoutubeVideoContent embedUrl={embed.embedUrl} onGateOpen={onGateOpen} />;
  if (embed.kind === 'vimeo') return <VimeoVideoContent embedUrl={embed.embedUrl} onGateOpen={onGateOpen} />;

  // Direct file upload — real control over playback. Seeking past the furthest point
  // already watched snaps back (a small grace window absorbs normal buffering jitter
  // without allowing an actual skip-ahead), and onEnded only fires when the video
  // genuinely finishes — the learner still has to click "Mark as Complete" themselves.
  return (
    <video
      controls
      src={resolveMediaUrl(embed.url)}
      className="w-full rounded-lg bg-black max-h-[420px]"
      onTimeUpdate={(e) => {
        const t = e.currentTarget.currentTime;
        if (t > furthestTimeRef.current) furthestTimeRef.current = t;
      }}
      onSeeking={(e) => {
        const v = e.currentTarget;
        if (v.currentTime > furthestTimeRef.current + 1.5) v.currentTime = furthestTimeRef.current;
      }}
      onEnded={onGateOpen}
    />
  );
}

function DocumentContent({ url, fileName, onOpened }: { url: string; fileName?: string; onOpened: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => { setExpanded(true); onOpened(); }}
        className="inline-flex items-center gap-2 text-brand-primary hover:underline text-sm"
      >
        <FileText className="h-4 w-4" /> Open {fileName || 'document'}
      </button>
      {expanded && (
        <iframe
          src={resolveMediaUrl(url)}
          title={fileName || 'Document'}
          className="w-full h-[560px] rounded-lg border border-slate-200"
        />
      )}
    </div>
  );
}

function ModuleContentView({ module_, onVideoGateOpen, onDocumentOpened }: { module_: CourseModule; onVideoGateOpen: () => void; onDocumentOpened: () => void }) {
  const c = module_.content || {};
  if (module_.type === 'video') {
    return c.url ? <VideoContent url={c.url} onGateOpen={onVideoGateOpen} /> : <p className="text-sm text-slate-400">No video URL configured.</p>;
  }
  if (module_.type === 'document') {
    return c.fileUrl ? (
      <DocumentContent url={c.fileUrl} fileName={c.fileName} onOpened={onDocumentOpened} />
    ) : <p className="text-sm text-slate-400">No document uploaded.</p>;
  }
  if (module_.type === 'text') {
    return <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">{c.markdown || 'No content.'}</div>;
  }
  if (module_.type === 'link') {
    return c.linkUrl ? (
      <div className="space-y-1">
        <a href={c.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-brand-primary hover:underline text-sm"><Link2 className="h-4 w-4" /> {c.linkUrl}</a>
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
  const { generateCertificate, certificates } = useMyCertificates();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  // pdfOpened drives whether the document viewer itself is shown; pdfGateOpen only
  // flips true after MIN_DOCUMENT_DWELL_MS of it staying open — a single click used to
  // be enough to unlock "Mark as Complete" with zero actual reading time.
  const [pdfOpened, setPdfOpened] = useState<Record<string, boolean>>({});
  const [pdfGateOpen, setPdfGateOpen] = useState<Record<string, boolean>>({});
  const pdfDwellTimerStarted = useRef<Set<string>>(new Set());

  const modules = useMemo(() => (course?.modules ?? []).slice().sort((a, b) => a.order - b.order), [course]);
  const enrollment = course?.myEnrollment;

  useEffect(() => {
    if (!activeModuleId && modules.length) setActiveModuleId(modules[0]._id);
  }, [modules, activeModuleId]);

  // Gates on whether "Mark as Complete" is clickable — never on whether it's actually
  // clicked, that always stays a manual action. Video: the real onEnded/watched-threshold
  // event, reported by VideoContent for both direct uploads and YouTube/Vimeo embeds
  // (see YoutubeVideoContent/VimeoVideoContent — real playback progress via each
  // platform's postMessage API, not a wall-clock guess). Text: a timer based on word
  // count at an average reading speed. Resets whenever the learner switches modules.
  const [videoGateOpen, setVideoGateOpen] = useState(false);
  const [readGateOpen, setReadGateOpen] = useState(false);
  const activeModuleForGating = modules.find((m) => m._id === activeModuleId);

  useEffect(() => {
    setVideoGateOpen(false);
    setReadGateOpen(false);
    if (!activeModuleForGating) return;

    if (activeModuleForGating.type === 'text') {
      const words = countWords(activeModuleForGating.content?.markdown || '');
      const minMs = Math.ceil((words / AVERAGE_READING_WPM) * 60) * 1000;
      if (minMs <= 0) { setReadGateOpen(true); return; }
      const timer = setTimeout(() => setReadGateOpen(true), minMs);
      return () => clearTimeout(timer);
    }
  }, [activeModuleForGating]);

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
        <Link href={`/${locale}/my/training/catalog`} className="text-brand-primary text-sm hover:underline">Back to catalog</Link>
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

  const existingCert = certificates.find((c) => String(c.enrollmentId) === String(enrollment._id));
  const certPdfUrl = existingCert?.pdfUrl || generatedPdfUrl;

  const handleGenerateCertificate = async () => {
    const res: any = await generateCertificate(enrollment._id);
    if (res?.data?.pdfUrl) setGeneratedPdfUrl(res.data.pdfUrl);
  };

  return (
    <div className="p-6">
      <Link href={`/${locale}/my/training`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-text mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to My Training
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3 h-fit lg:sticky lg:top-4">
          <h2 className="font-semibold text-slate-900 px-2 mb-2">{course.title}</h2>
          <div className="px-2 mb-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-primary rounded-full" style={{ width: `${enrollment.progressPercentage}%` }} /></div>
            <p className="text-xs text-slate-500 mt-1">{enrollment.progressPercentage}% complete</p>
          </div>
          <div className="space-y-1">
            {modules.map((m) => {
              const Icon = MODULE_ICONS[m.type] || FileText;
              const done = isComplete(m._id);
              return (
                <button key={m._id} onClick={() => setActiveModuleId(m._id)} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition ${activeModuleId === m._id ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <Circle className="h-4 w-4 text-brand-text-secondary shrink-0" />}
                  <Icon className="h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate flex-1">{m.title}</span>
                  {!m.isRequired && <span className="text-[10px] text-slate-400">optional</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
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
                  <ModuleContentView
                    module_={activeModule}
                    onVideoGateOpen={() => setVideoGateOpen(true)}
                    onDocumentOpened={() => {
                      const id = activeModule._id;
                      setPdfOpened((prev) => ({ ...prev, [id]: true }));
                      if (pdfDwellTimerStarted.current.has(id)) return;
                      pdfDwellTimerStarted.current.add(id);
                      setTimeout(() => setPdfGateOpen((p) => ({ ...p, [id]: true })), MIN_DOCUMENT_DWELL_MS);
                    }}
                  />
                  <div className="pt-4 border-t border-slate-100">
                    {isComplete(activeModule._id) ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium"><CheckCircle2 className="h-4 w-4" /> Completed</span>
                    ) : (
                      <>
                        <button
                          onClick={markComplete}
                          disabled={
                            activeModule.type === 'video' ? !videoGateOpen
                            : activeModule.type === 'text' ? !readGateOpen
                            : activeModule.type === 'document' ? !pdfGateOpen[activeModule._id]
                            : false
                          }
                          className="px-3 py-2 rounded-md bg-brand-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Mark as Complete
                        </button>
                        {activeModule.type === 'video' && !videoGateOpen && (
                          <p className="text-xs text-slate-400 mt-1.5">Finish watching the video to enable this.</p>
                        )}
                        {activeModule.type === 'text' && !readGateOpen && (
                          <p className="text-xs text-slate-400 mt-1.5">Keep reading — this unlocks once enough time has passed.</p>
                        )}
                        {activeModule.type === 'document' && !pdfGateOpen[activeModule._id] && (
                          <p className="text-xs text-slate-400 mt-1.5">
                            {pdfOpened[activeModule._id] ? 'Keep the document open — this unlocks shortly.' : 'Open the document to enable this.'}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {enrollment.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-green-800">You've completed this course!</p>
              {course.hasCertificate && (
                certPdfUrl ? (
                  <a
                    href={resolveMediaUrl(certPdfUrl.replace(/^\/?uploads\//, ''))}
                    target="_blank" rel="noreferrer"
                    className="text-sm text-brand-primary font-medium hover:underline"
                  >
                    Certificate ready — view it →
                  </a>
                ) : (
                  <button onClick={handleGenerateCertificate} className="text-sm text-brand-primary font-medium hover:underline">
                    Get Certificate
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
