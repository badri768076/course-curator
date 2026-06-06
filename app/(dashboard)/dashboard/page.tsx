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
          
          {/* Stats Cards Section */}
          <div className="grid-3">
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
              
              {/* Quick Generator Box */}
              <Card style={{ padding: '1.5rem' }}>
                <CardHeader style={{ marginBottom: '0.75rem' }}>
                  <CardTitle style={{ fontSize: '1.1rem' }}>Curate Another Subject</CardTitle>
                </CardHeader>
                <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Enter new skill topic..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={loading}
                    className="input-field"
                    style={{ flex: 1, padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                  />
                  <Button type="submit" disabled={loading || !topic.trim()} size="sm">
                    {loading ? <Loader className="animate-spin" size={14} /> : 'Generate'}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Syllabus Chapters List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
                <CardTitle style={{ fontSize: '1.2rem', fontWeight: 700 }}>Syllabus Outline</CardTitle>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '480px', overflowY: 'auto' }}>
                  {activeCourse.chapters.map((chapter, chIdx) => (
                    <div key={chapter.slug} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ color: 'hsl(var(--primary-violet))' }}>0{chIdx + 1}.</span>
                        {chapter.title}
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem' }}>
                        {chapter.topics.map((topic) => {
                          const state = getTopicState(topic.slug);
                          return (
                            <div
                              key={topic.slug}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid hsla(var(--border-glass))',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {state.completed ? (
                                  <CheckCircle2 size={16} color="#22c55e" />
                                ) : (
                                  <Circle size={16} color="hsl(var(--text-muted))" />
                                )}
                                <span style={{ fontSize: '0.875rem', color: state.completed ? 'white' : 'hsl(var(--text-secondary))', fontWeight: state.completed ? '600' : 'normal' }}>
                                  {topic.title}
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleNodeClick(topic.slug)}
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  Study
                                </Button>
                                {state.quizScore >= 0 && (
                                  <span style={{ fontSize: '0.75rem', alignSelf: 'center', color: '#22c55e', fontWeight: 'bold', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '6px' }}>
                                    Score: {state.quizScore}
                                  </span>
                                )}
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
