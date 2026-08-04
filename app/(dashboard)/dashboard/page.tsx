'use client';

import React, { useState } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { generateCourseAction } from '@/actions/ai-generation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MindmapRenderer } from '@/components/features/topic/MindmapRenderer';
import { VideoChatbot } from '@/components/features/video/VideoChatbot';
import { FloatingChatbot } from '@/components/features/video/FloatingChatbot';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader, BookOpen, CheckCircle2, Circle, AlertCircle, RefreshCw, BarChart2, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { courses, activeCourseId, progress, addCourse, clearAll, setActiveTopic } = useLearningStore();
  
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const course = await generateCourseAction(topic);
      addCourse(course);
    } catch (err: any) {
      setError(err?.message || 'Failed to curate syllabus.');
    } finally {
      setLoading(false);
      setTopic('');
    }
  };

  const getCourseProgress = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return 0;
    
    let totalTopics = 0;
    let completedTopics = 0;

    course.chapters.forEach((ch) => {
      ch.topics.forEach((top) => {
        totalTopics++;
        const key = `${courseId}:${top.slug}`;
        if (progress[key]?.completed) {
          completedTopics++;
        }
      });
    });

    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  };

  const getTopicState = (topicSlug: string) => {
    const key = `${activeCourseId}:${topicSlug}`;
    return progress[key] || { completed: false, quizScore: -1 };
  };

  const handleNodeClick = (slug: string) => {
    setActiveTopic(slug);
    router.push(ROUTES.topic(slug));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '0' }} className="animate-fade-in">
      
      {/* Minimal Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
          {activeCourse ? activeCourse.title : 'Course Curator'}
        </h1>
        {courses.length > 0 && (
          <button
            onClick={clearAll}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '0.8rem', padding: '0.5rem 0.75rem', borderRadius: '6px' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Reset
          </button>
        )}
      </div>

      {/* Main Content */}
      {!activeCourse ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem' }}>
          <div style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Start Learning</h2>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Enter any topic to generate a complete learning path
              </p>
            </div>

            <form onSubmit={handleGenerate} style={{ width: '100%', position: 'relative' }}>
              <input
                type="text"
                placeholder="React, Machine Learning, Python..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '1rem 1.25rem', 
                  paddingRight: '120px',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '8px',
                  height: '40px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontWeight: 500,
                  padding: '0 1.25rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: (loading || !topic.trim()) ? 0.5 : 1,
                  fontSize: '0.85rem',
                }}
              >
                {loading ? <Loader className="animate-spin" size={14} /> : 'Generate'}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '0', flex: 1, overflow: 'hidden' }}>
          
          {/* Left: Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Progress</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>{getCourseProgress(activeCourse.id)}%</p>
              </div>
              <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Lessons</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>
                  {activeCourse.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)}
                </p>
              </div>
              <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Quizzes</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>
                  {activeCourse.chapters.reduce((acc, ch) => {
                    return acc + ch.topics.filter(t => getTopicState(t.slug).quizScore >= 0).length;
                  }, 0)}
                </p>
              </div>
            </div>

            {/* Mindmap */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <MindmapRenderer
                course={activeCourse}
                activeTopicSlug={null}
                onNodeClick={handleNodeClick}
              />
            </div>

            {/* Quick Generate */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Generate new course..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                style={{ 
                  flex: 1, 
                  padding: '0.75rem 1rem', 
                  fontSize: '0.9rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                style={{
                  padding: '0 1.25rem',
                  height: '44px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontWeight: 500,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: (loading || !topic.trim()) ? 0.5 : 1,
                  fontSize: '0.85rem',
                }}
              >
                {loading ? <Loader className="animate-spin" size={14} /> : 'Generate'}
              </button>
            </div>
          </div>

          {/* Right: Course Outline / Chatbot */}
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            {/* Toggle between Course Outline and Chatbot */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setShowChatbot(false)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: !showChatbot ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: !showChatbot ? 'white' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                Course Outline
              </button>
              <button
                onClick={() => setShowChatbot(true)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: showChatbot ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: showChatbot ? 'white' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                }}
              >
                <MessageSquare size={14} />
                AI Assistant
              </button>
            </div>
            
            {showChatbot ? (
              <VideoChatbot
                videoId={activeCourse.chapters[0]?.topics[0]?.videoId || ''}
                videoTitle={activeCourse.title}
                isOpen={showChatbot}
              />
            ) : (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Course Outline
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {activeCourse.chapters.map((chapter, chIdx) => (
                    <div key={chapter.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                        {chapter.title}
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {chapter.topics.map((topic) => {
                          const state = getTopicState(topic.slug);
                          return (
                            <button
                              key={topic.slug}
                              onClick={() => handleNodeClick(topic.slug)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.6rem 0.85rem',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {state.completed ? (
                                  <CheckCircle2 size={14} color="#22c55e" />
                                ) : (
                                  <Circle size={14} color="hsl(var(--text-muted))" />
                                )}
                                <span style={{ fontSize: '0.8rem', color: state.completed ? 'white' : 'hsl(var(--text-muted))' }}>
                                  {topic.title}
                                </span>
                              </div>

                              {state.quizScore >= 0 && (
                                <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600, padding: '0.15rem 0.4rem', background: 'rgba(34,197,94,0.1)', borderRadius: '4px' }}>
                                  {state.quizScore}%
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
            
        </div>
      )}

      {/* Floating Chatbot - Always visible */}
      {activeCourse && activeCourse.chapters[0]?.topics[0]?.videoId && (
        <FloatingChatbot
          videoId={activeCourse.chapters[0].topics[0].videoId}
          videoTitle={activeCourse.title}
        />
      )}
    </div>
  );
}
