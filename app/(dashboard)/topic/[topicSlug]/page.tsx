'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/store/use-learning-store';
import { MindmapRenderer } from '@/components/features/topic/MindmapRenderer';
import { VideoPlayer } from '@/components/features/video/VideoPlayer';
import { AdaptivePanel } from '@/components/features/video/AdaptivePanel';
import { LearningStyleBadge } from '@/components/features/video/LearningStyleBadge';
import { StudyBuddy } from '@/components/features/video/StudyBuddy';
import { FloatingChatbot } from '@/components/features/video/FloatingChatbot';
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '0' }} className="animate-fade-in">

      {/* Minimal Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
        <button
          onClick={() => router.push(ROUTES.dashboard)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '6px' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
          {activeTopic.title}
        </div>
      </div>

      {/* ── Main Layout: Video Centered, Concepts Right ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 380px', gap: '0', flex: 1, overflow: 'hidden' }}>

        {/* LEFT: Course navigation - Minimal */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem 1rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{activeCourse.title}</h2>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{activeCourse.chapters.length} chapters</p>
          </div>
          
          {activeCourse.chapters.map((ch) => (
            <div key={ch.id} style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {ch.title}
              </p>
              {ch.topics.map((t) => {
                const done = progress[`${activeCourse.id}:${t.slug}`]?.completed;
                const active = t.slug === currentSlug;
                return (
                  <button
                    key={t.slug}
                    onClick={() => handleNodeClick(t.slug)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem',
                      borderRadius: '6px', border: 'none',
                      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: active ? 'white' : done ? 'hsl(var(--text-muted))' : 'hsl(var(--text-muted))',
                      fontSize: '0.8rem', cursor: 'pointer',
                      marginBottom: '0.25rem',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseOut={(e) => !active && (e.currentTarget.style.background = 'transparent')}
                  >
                    {done && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* CENTER: Video player - Centered on screen */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'rgba(0,0,0,0.3)', overflow: 'auto' }}>
          {activeTopic.videoId ? (
            <div style={{ width: '100%', maxWidth: '900px' }}>
              <VideoPlayer
                videoId={activeTopic.videoId}
                initialTime={initialTime}
                onTimeUpdate={syncVideoTime}
                onVideoEvent={handleVideoEvent}
                onPauseReasonSubmitted={handlePauseReason}
                seekTo={seekTo}
              />
              <div style={{ marginTop: '1.5rem', padding: '0 1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>{activeTopic.title}</h2>
                <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', lineHeight: '1.6' }}>{activeTopic.description}</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>No video available</p>
            </div>
          )}
        </div>

        {/* RIGHT: Concepts & Learning Panel */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }}>
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
            <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', textAlign: 'center', marginTop: '4rem' }}>
              Learning content will appear once a video is assigned.
            </div>
          )}
        </div>

      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot
        videoId={activeTopic.videoId || 'default'}
        videoTitle={activeTopic.title}
      />
    </div>
  );
}
