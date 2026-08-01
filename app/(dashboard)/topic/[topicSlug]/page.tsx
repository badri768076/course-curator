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

      {/* ── Main Layout: Video Centered, Concepts Right ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(500px, 1fr) 400px', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: Course navigation */}
        <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>Course Navigation</p>
            {activeCourse.chapters.map((ch) => (
              <div key={ch.id}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem', marginTop: '0.75rem' }}>{ch.title}</p>
                {ch.topics.map((t) => {
                  const done = progress[`${activeCourse.id}:${t.slug}`]?.completed;
                  const active = t.slug === currentSlug;
                  return (
                    <button
                      key={t.slug}
                      onClick={() => handleNodeClick(t.slug)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
                        borderRadius: '8px', border: 'none',
                        background: active ? 'linear-gradient(135deg, hsla(var(--primary-violet) / 0.2), hsla(var(--primary-cyan) / 0.1))' : 'transparent',
                        color: active ? 'white' : done ? 'hsl(var(--primary-cyan))' : 'hsl(var(--text-secondary))',
                        fontSize: '0.8rem', cursor: 'pointer',
                        fontWeight: active ? 600 : 400,
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseOut={(e) => !active && (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: done ? 'hsl(var(--primary-cyan))' : active ? 'hsl(var(--primary-violet))' : 'rgba(148,163,184,0.3)', flexShrink: 0 }} />
                      {t.title}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Video player - Main focus */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1.5rem', alignSelf: 'start' }}>
          {activeTopic.videoId ? (
            <VideoPlayer
              videoId={activeTopic.videoId}
              initialTime={initialTime}
              onTimeUpdate={syncVideoTime}
              onVideoEvent={handleVideoEvent}
              onPauseReasonSubmitted={handlePauseReason}
              seekTo={seekTo}
            />
          ) : (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>No video available for this topic.</p>
            </div>
          )}

          {/* Topic info card */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{activeTopic.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.5' }}>{activeTopic.description}</p>
          </div>
        </div>

        {/* RIGHT: Concepts & Learning Panel */}
        <div style={{ minWidth: 0, position: 'sticky', top: '1.5rem' }}>
          {activeTopic.videoId ? (
            <AdaptivePanel
              courseId={courseId}
              topicSlug={currentSlug}
              topicTitle={activeTopic.title}
              videoId={activeTopic.videoId}
              isCompleted={isCompleted}
              onToggleComplete={handleToggleComplete}
              onSeekVideo={handleSeekVideo}
            />
          ) : (
            <div className="glass-card" style={{ padding: '2rem', color: 'hsl(var(--text-muted))' }}>
              Learning content will appear once a video is assigned.
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
