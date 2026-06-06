'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { generateCourseAction } from '@/actions/ai-generation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MindmapRenderer } from '@/components/features/topic/MindmapRenderer';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader, BookOpen, CheckCircle2, Circle, AlertCircle, RefreshCw, BarChart2, Clock } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { courses, activeCourseId, progress, addCourse, clearAll, setActiveTopic, totalTimeSpent, fetchTotalTime } = useLearningStore();

  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;

  // Fetch total learning time on mount
  useEffect(() => {
    fetchTotalTime();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">

      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsla(var(--border-glass))', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Learning Workspace</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            {activeCourse ? `Actively studying: ${activeCourse.title}` : 'Select or curate a visual learning syllabus below'}
          </p>
        </div>
        {courses.length > 0 && (
          <Button variant="ghost" onClick={clearAll} style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            Reset Workspace
          </Button>
        )}
      </div>

      {/* Main Grid content */}
      {!activeCourse ? (
        <Card style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '14px', backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={28} color="hsl(var(--primary-violet))" />
            </div>
            <div>
              <CardTitle style={{ fontSize: '1.5rem', fontWeight: 800 }}>Ready to curate?</CardTitle>
              <CardDescription style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                Enter any skill, topic, or field of study. Our AI engine will structure a complete roadmap complete with video references and interactive MCQ tests.
              </CardDescription>
            </div>

            <form onSubmit={handleGenerate} style={{ width: '100%', position: 'relative', marginTop: '0.5rem' }}>
              <input
                type="text"
                placeholder="e.g. Machine Learning Essentials, Web Security..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="input-field"
                style={{ paddingRight: '120px' }}
              />
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '6px',
                  height: '38px',
                  border: 'none',
                  background: 'linear-gradient(135deg, hsl(var(--primary-violet)), hsl(var(--primary-cyan)))',
                  color: '#fff',
                  fontWeight: 'bold',
                  padding: '0 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: (loading || !topic.trim()) ? 0.6 : 1,
                }}
              >
                {loading ? <Loader className="animate-spin" size={14} /> : 'Generate'}
              </button>
            </form>

            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Quick Generator Box (Moved to Top) */}
          <Card className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Curate Another Subject</h3>
              <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>Generate a new interactive AI syllabus instantly.</p>
              <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. Advanced TypeScript, Cloud Architecture..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  className="input-field"
                  style={{ flex: 1, padding: '0.85rem 1.2rem', fontSize: '0.95rem' }}
                />
                <Button type="submit" disabled={loading || !topic.trim()} className="btn btn-primary" style={{ minWidth: '120px' }}>
                  {loading ? <Loader className="animate-spin" size={18} /> : 'Generate AI Course'}
                </Button>
              </form>
              {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
            </div>
          </Card>

          {/* Stats Cards Section – now 4 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Card style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', backgroundColor: 'rgba(0, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={20} color="hsl(var(--primary-cyan))" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Course Completion</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{getCourseProgress(activeCourse.id)}%</p>
              </div>
            </Card>

            <Card style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} color="hsl(var(--primary-violet))" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Modules & Lessons</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {activeCourse.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)} Units
                </p>
              </div>
            </Card>

            <Card style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} color="#22c55e" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Overall Quiz Badges</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {activeCourse.chapters.reduce((acc, ch) => {
                    return acc + ch.topics.filter(t => getTopicState(t.slug).quizScore >= 0).length;
                  }, 0)} Scored
                </p>
              </div>
            </Card>

            {/* NEW: Total Learning Time Card */}
            <Card style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#f59e0b" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Total Learning Time</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatTime(totalTimeSpent)}</p>
              </div>
            </Card>
          </div>

          {/* Map Layout: Left (Interactive map) Right (List Modules) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '2rem' }}>

            {/* Mindmap Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <MindmapRenderer
                course={activeCourse}
                activeTopicSlug={null}
                onNodeClick={handleNodeClick}
              />

            </div>

            {/* Syllabus Chapters List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
                <CardTitle style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>Syllabus Outline</CardTitle>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {activeCourse.chapters.map((chapter, chIdx) => (
                    <div key={chapter.slug} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                      {/* Chapter Header */}
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1f2937', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ 
                          background: 'linear-gradient(135deg, hsl(var(--primary-violet)), hsl(var(--primary-cyan)))',
                          color: 'white', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem' 
                        }}>
                          Part {chIdx + 1}
                        </span>
                        {chapter.title}
                      </h4>

                      {/* Topic Timeline */}
                      <div style={{ 
                        display: 'flex', flexDirection: 'column', gap: '0.75rem', 
                        paddingLeft: '1.25rem', position: 'relative'
                      }}>
                        {/* Vertical Path Line */}
                        <div style={{ position: 'absolute', left: '0.45rem', top: '0.5rem', bottom: '0.5rem', width: '2px', background: 'hsla(var(--border-glass))', borderRadius: '2px' }}></div>

                        {chapter.topics.map((topic, tIdx) => {
                          const state = getTopicState(topic.slug);
                          return (
                            <div
                              key={topic.slug}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.85rem 1.2rem', borderRadius: '12px',
                                background: state.completed ? 'hsla(var(--primary-cyan) / 0.15)' : 'white',
                                border: state.completed ? '2px solid hsl(var(--primary-cyan))' : '2px solid hsla(var(--primary-magenta) / 0.3)',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: state.completed ? '0 4px 15px hsla(var(--primary-violet) / 0.1)' : '0 4px 15px rgba(0,0,0,0.08)',
                                transform: 'translateX(0)',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(6px)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                              onClick={() => handleNodeClick(topic.slug)}
                            >
                              {/* Node Indicator */}
                              <div style={{
                                position: 'absolute', left: '-1.05rem', top: '50%', transform: 'translateY(-50%)',
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: state.completed ? 'hsl(var(--primary-violet))' : 'hsl(var(--bg-obsidian))',
                                border: `2px solid ${state.completed ? 'hsl(var(--primary-violet))' : 'hsla(var(--text-muted))'}`,
                                zIndex: 2
                              }}></div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                {state.completed ? (
                                  <CheckCircle2 size={18} color="hsl(var(--primary-violet))" />
                                ) : (
                                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px dashed hsla(var(--text-muted))' }}></div>
                                )}
                                <span style={{ 
                                  fontSize: '0.95rem', 
                                  color: state.completed ? 'hsl(var(--primary-violet))' : '#1f2937', 
                                  fontWeight: state.completed ? '800' : '600' 
                                }}>
                                  {topic.title}
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {state.quizScore >= 0 && (
                                  <span style={{ 
                                    fontSize: '0.75rem', color: 'hsl(var(--primary-cyan))', fontWeight: '800', 
                                    padding: '0.2rem 0.6rem', backgroundColor: 'hsla(var(--primary-cyan) / 0.1)', 
                                    border: '1px solid hsla(var(--primary-cyan) / 0.3)', borderRadius: '8px' 
                                  }}>
                                    ★ {state.quizScore}
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}
                                >
                                  Enter
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}