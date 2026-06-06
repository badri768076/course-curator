'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/store/use-learning-store';
import { MindmapRenderer } from '@/components/features/topic/MindmapRenderer';
import { VideoPlayer } from '@/components/features/video/VideoPlayer';
import { AdaptivePanel } from '@/components/features/video/AdaptivePanel';
import { LearningStyleBadge } from '@/components/features/video/LearningStyleBadge';
import { StudyBuddy } from '@/components/features/video/StudyBuddy';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { useVideoSync } from '@/hooks/use-video-sync';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function TopicPage({ params }: { params: { topicSlug: string } }) {
  const router = useRouter();
  const {
    courses,
    activeCourseId,
    progress,
    markTopicCompleted,
    setActiveTopic,
    recordVideoEvent,
    recordPauseReason,
    updateTimeSpent,
  } = useLearningStore();

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;
  const currentSlug = params.topicSlug;

  // Seek state — driven by transcript timestamp clicks in AdaptivePanel
  const [seekTo, setSeekTo] = useState<number | null>(null);

  /* ── Find topic (computed, no early return) ─────────────────── */
  let activeTopic: any = null;
  if (activeCourse) {
    activeCourse.chapters.forEach((ch) => {
      const found = ch.topics.find((t) => t.slug === currentSlug);
      if (found) activeTopic = found;
    });
  }

  /* ── Progress helpers (always compute, even if guards fail) ── */
  const courseId = activeCourse?.id || '';
  const progressKey = `${courseId}:${currentSlug}`;
  const isCompleted = progress[progressKey]?.completed || false;
  const initialTime = progress[progressKey]?.videoTime || 0;

  // ALL hooks must be called unconditionally — before any return
  const syncVideoTime = useVideoSync(courseId, currentSlug);

  const handleToggleComplete = useCallback(() => {
    if (!courseId) return;
    markTopicCompleted(courseId, currentSlug, !isCompleted);
  }, [courseId, currentSlug, isCompleted, markTopicCompleted]);

  const handleNodeClick = useCallback((slug: string) => {
    setActiveTopic(slug);
    router.push(ROUTES.topic(slug));
  }, [router, setActiveTopic]);

  const handleSeekVideo = useCallback((seconds: number) => {
    setSeekTo(seconds);
    setTimeout(() => setSeekTo(null), 500);
  }, []);

  // Add this useEffect for time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTopic && !isCompleted) {
      interval = setInterval(() => {
        const currentTime = localStorage.getItem(`video-time-${courseId}-${currentSlug}`);
        if (currentTime) {
          updateTimeSpent(courseId, currentSlug, parseInt(currentTime, 10));
        }
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [activeTopic, isCompleted, courseId, currentSlug, updateTimeSpent]);

  const handleVideoEvent = useCallback((type: 'pause' | 'rewind' | 'skip') => {
    recordVideoEvent(type);
  }, [recordVideoEvent]);

  const handlePauseReason = useCallback((reason: 'notes' | 'confused' | 'bored') => {
    recordPauseReason(currentSlug, reason);
  }, [recordPauseReason, currentSlug]);

  /* ── Guard: no active course ─────────────────────────────────── */
  if (!activeCourse) {
    return (
      <Card style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <CardTitle>No Active Course</CardTitle>
        <CardDescription style={{ marginTop: '0.5rem' }}>
          Please return to the dashboard and select or generate a course first.
        </CardDescription>
        <Button onClick={() => router.push(ROUTES.dashboard)} style={{ marginTop: '1.5rem' }}>
          Go to Dashboard
        </Button>
      </Card>
    );
  }

  /* ── Guard: topic not found ──────────────────────────────────── */
  if (!activeTopic) {
    return (
      <Card style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <CardTitle>Topic Not Found</CardTitle>
        <CardDescription style={{ marginTop: '0.5rem' }}>
          This topic doesn't exist in the current course.
        </CardDescription>
        <Button onClick={() => router.push(ROUTES.dashboard)} style={{ marginTop: '1.5rem' }}>
          Back to Dashboard
        </Button>
      </Card>
    );
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">

      {/* Breadcrumb nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsla(var(--border-glass))', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          onClick={() => router.push(ROUTES.dashboard)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={15} /> Dashboard
        </button>
        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <BookOpen size={13} /> {activeCourse.title} / {activeTopic.title}
        </span>
      </div>

      {/* ── Three-column workspace ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1.65fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: Course navigation mindmap */}
        <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MindmapRenderer
            course={activeCourse}
            activeTopicSlug={currentSlug}
            onNodeClick={handleNodeClick}
          />

          {/* Chapter/topic list mini-nav */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>Course Outline</p>
            {activeCourse.chapters.map((ch) => (
              <div key={ch.slug}>
                <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.35rem' }}>{ch.title}</p>
                {ch.topics.map((t) => {
                  const done = progress[`${activeCourse.id}:${t.slug}`]?.completed;
                  const active = t.slug === currentSlug;
                  return (
                    <button
                      key={t.slug}
                      onClick={() => handleNodeClick(t.slug)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        width: '100%', textAlign: 'left', padding: '0.45rem 0.6rem',
                        borderRadius: '6px', border: 'none',
                        background: active ? 'hsla(var(--primary-violet) / 0.12)' : 'transparent',
                        color: active ? 'hsl(var(--primary-violet))' : done ? 'hsl(var(--primary-cyan))' : '#4b5563',
                        fontSize: '0.78rem', cursor: 'pointer',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: done ? 'hsl(var(--primary-cyan))' : active ? 'hsl(var(--primary-violet))' : 'rgba(148,163,184,0.3)', flexShrink: 0 }} />
                      {t.title}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* CENTRE: Video player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1.5rem', alignSelf: 'start' }}>
          {activeTopic.videoUrl ? (
            <VideoPlayer
              videoId={activeTopic.videoUrl}
              initialTime={initialTime}
              onTimeUpdate={syncVideoTime}
              onVideoEvent={handleVideoEvent}
              onPauseReasonSubmitted={handlePauseReason}
              seekTo={seekTo}
            />
          ) : (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              No video available for this topic.
            </div>
          )}

          {/* Behaviour hint strip */}
          <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            <span>⏸ Pause/rewind → we learn you prefer replaying</span>
            <span>📑 Switch tabs → we learn your format preference</span>
          </div>
        </div>

        {/* RIGHT: Adaptive 5-tab panel */}
        <div style={{ minWidth: 0 }}>
          {activeTopic.videoUrl ? (
            <AdaptivePanel
              courseId={courseId}
              topicSlug={currentSlug}
              topicTitle={activeTopic.title}
              videoId={activeTopic.videoUrl}
              isCompleted={isCompleted}
              onToggleComplete={handleToggleComplete}
              onSeekVideo={handleSeekVideo}
            />
          ) : (
            <div className="glass-card" style={{ padding: '2rem', color: 'hsl(var(--text-muted))' }}>
              Content panel available once a video is assigned.
            </div>
          )}
        </div>

      </div>

      {/* Floating widgets */}
      <StudyBuddy topicSlug={currentSlug} />
      <LearningStyleBadge />
    </div>
  );
}
