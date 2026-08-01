'use client';

import React, { useState } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { generateCourseAction } from '@/actions/ai-generation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MindmapRenderer } from '@/components/features/topic/MindmapRenderer';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader, BookOpen, CheckCircle2, Circle, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { courses, activeCourseId, progress, addCourse, clearAll, setActiveTopic } = useLearningStore();
  
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Clean Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid hsla(var(--border-glass))', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, hsl(var(--primary-violet)), hsl(var(--primary-cyan)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {activeCourse ? activeCourse.title : 'Course Curator'}
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {activeCourse ? `${activeCourse.chapters.length} chapters • ${activeCourse.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)} lessons` : 'Generate personalized learning paths with AI'}
          </p>
        </div>
        {courses.length > 0 && (
          <Button variant="ghost" onClick={clearAll} style={{ color: 'hsl(var(--text-muted))', border: '1px solid hsla(var(--border-glass))', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <RefreshCw size={14} style={{ marginRight: '0.5rem' }} /> Reset
          </Button>
        )}
      </div>

      {/* Main Content */}
      {!activeCourse ? (
        <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, hsla(var(--primary-violet) / 0.15), hsla(var(--primary-cyan) / 0.15))', border: '1px solid hsla(var(--border-glass))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={36} color="hsl(var(--primary-violet))" />
            </div>
            
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Start Learning</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Enter any topic to generate a complete learning path with videos, quizzes, and interactive content.
              </p>
            </div>

            <form onSubmit={handleGenerate} style={{ width: '100%', position: 'relative' }}>
              <input
                type="text"
                placeholder="React, Machine Learning, Python..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="input-field"
                style={{ 
                  width: '100%', 
                  padding: '1rem 1.25rem', 
                  paddingRight: '140px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                }}
              />
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '8px',
                  height: '44px',
                  border: 'none',
                  background: 'linear-gradient(135deg, hsl(var(--primary-violet)), hsl(var(--primary-cyan)))',
                  color: '#fff',
                  fontWeight: 600,
                  padding: '0 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: (loading || !topic.trim()) ? 0.5 : 1,
                  fontSize: '0.9rem',
                }}
              >
                {loading ? <Loader className="animate-spin" size={16} /> : 'Generate'}
              </button>
            </form>

            {error && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Compact Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, hsla(var(--primary-cyan) / 0.15), hsla(var(--primary-cyan) / 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={18} color="hsl(var(--primary-cyan))" />
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Progress</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{getCourseProgress(activeCourse.id)}%</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, hsla(var(--primary-violet) / 0.15), hsla(var(--primary-violet) / 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} color="hsl(var(--primary-violet))" />
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Lessons</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                  {activeCourse.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)}
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, hsla(142, 76%, 36%, 0.15), hsla(142, 76%, 36%, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} color="#22c55e" />
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Quizzes</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                  {activeCourse.chapters.reduce((acc, ch) => {
                    return acc + ch.topics.filter(t => getTopicState(t.slug).quizScore >= 0).length;
                  }, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
            
            {/* Left: Mindmap + Quick Generate */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                <MindmapRenderer
                  course={activeCourse}
                  activeTopicSlug={null}
                  onNodeClick={handleNodeClick}
                />
              </div>
              
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: '0.75rem' }}>Generate New Course</p>
                <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="New topic..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={loading}
                    className="input-field"
                    style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                  />
                  <Button type="submit" disabled={loading || !topic.trim()} size="sm" style={{ borderRadius: '8px' }}>
                    {loading ? <Loader className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right: Course Outline */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Outline</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {activeCourse.chapters.map((chapter, chIdx) => (
                  <div key={chapter.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        width: '24px', height: '24px', borderRadius: '6px', 
                        background: 'linear-gradient(135deg, hsl(var(--primary-violet)), hsl(var(--primary-cyan)))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: 'white'
                      }}>
                        {chIdx + 1}
                      </span>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{chapter.title}</h4>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '2rem' }}>
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
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid hsla(var(--border-glass))',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {state.completed ? (
                                <CheckCircle2 size={14} color="#22c55e" />
                              ) : (
                                <Circle size={14} color="hsl(var(--text-muted))" />
                              )}
                              <span style={{ fontSize: '0.8rem', color: state.completed ? 'white' : 'hsl(var(--text-secondary))' }}>
                                {topic.title}
                              </span>
                            </div>

                            {state.quizScore >= 0 && (
                              <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600, padding: '0.2rem 0.5rem', background: 'rgba(34,197,94,0.1)', borderRadius: '6px' }}>
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
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
