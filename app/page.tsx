// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { generateCourseAction, analyzeVideoAction } from '@/actions/ai-generation';
import { VideoPlayer } from '@/components/features/video/VideoPlayer';
import { AnalyticsDashboard } from '@/components/features/analytics/AnalyticsDashboard';
import { VideoAnalysisResult } from '@/types/video-analysis';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'summary' | 'quiz' | 'mindmap'>('video');
  const [videoAnalysis, setVideoAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const { 
    courses, 
    activeCourseId, 
    addCourse, 
    setActiveCourse,
    removeCourse,
    progress,
    totalTimeSpent,
    fetchTotalTime,
    updateVideoTime,
    saveQuizScore,
    recordVideoEvent,
    recordPauseReason,
    videoAnalyses,
    cacheVideoAnalysis
  } = useLearningStore();

  const activeCourse = courses.find(c => c.id === activeCourseId);

  useEffect(() => {
    fetchTotalTime();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');

    try {
      const course = await generateCourseAction(topic);
      addCourse(course);
      setTopic('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate course');
    } finally {
      setLoading(false);
    }
  };

  // Handle topic click - load video and analysis
  const handleTopicClick = async (topic: any, courseId: string) => {
    setSelectedTopic(topic);
    setActiveTab('video');
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizAnswers([]);
    
    // Check if we have cached analysis
    if (videoAnalyses[topic.slug]) {
      setVideoAnalysis(videoAnalyses[topic.slug]);
      return;
    }

    // If topic has videoId, analyze it
    if (topic.videoId) {
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeVideoAction(
          topic.slug,
          topic.title,
          topic.videoId
        );
        
        // Convert to the expected VideoAnalysisResult format
        const analysisData: VideoAnalysisResult = {
          topicSlug: topic.slug,
          videoId: topic.videoId,
          generatedAt: new Date().toISOString(),
          summary: analysis.summary || [],
          transcript: typeof analysis.transcript === 'string' 
            ? [{ text: analysis.transcript, startTime: 0, endTime: 0 }]
            : analysis.transcript || [],
          chapters: (analysis.chapters || []).map((ch: any) => ({
            title: ch.title || '',
            startTime: ch.startTime || 0,
            endTime: ch.endTime || 0,
            summary: ch.summary || '',
            keyPoints: ch.keyPoints || [],
          })),
          quiz: (analysis.quiz || []).map((q: any) => ({
            question: q.question || '',
            options: q.options || [],
            correctAnswerIndex: q.correctAnswerIndex || 0,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            topic: q.topic || '',
          })),
          mindmap: analysis.mindmap || { nodes: [], edges: [] },
          flowchart: analysis.flowchart || { nodes: [], edges: [] },
          eli5: analysis.eli5 || '',
          keyConcepts: analysis.keyConcepts || [],
          vocabulary: (analysis.vocabulary || []).map((v: any) => ({
            term: v.term || '',
            definition: v.definition || '',
            context: v.context || '',
            example: v.example || '',
          })),
        };
        
        setVideoAnalysis(analysisData);
        cacheVideoAnalysis(topic.slug, analysisData);
        
      } catch (err: any) {
        console.error('Failed to analyze video:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // Handle course removal
  const handleRemoveCourse = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this course? All progress will be lost.')) {
      removeCourse(courseId);
      // If we're removing the active course, clear selection
      if (activeCourseId === courseId) {
        setSelectedTopic(null);
        setVideoAnalysis(null);
      }
    }
  };

  const getProgress = () => {
    if (!activeCourse) return 0;
    const total = activeCourse.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
    const completed = activeCourse.chapters.reduce((acc, ch) => {
      return acc + ch.topics.filter(t => {
        const key = `${activeCourse.id}:${t.slug}`;
        return progress[key]?.completed;
      }).length;
    }, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getTotalTopics = () => {
    if (!activeCourse) return 0;
    return activeCourse.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
  };

  const getCompletedTopics = () => {
    if (!activeCourse) return 0;
    return activeCourse.chapters.reduce((acc, ch) => {
      return acc + ch.topics.filter(t => {
        const key = `${activeCourse.id}:${t.slug}`;
        return progress[key]?.completed;
      }).length;
    }, 0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Handle quiz submission
  const handleQuizSubmit = () => {
    if (!videoAnalysis?.quiz) return;
    
    let correct = 0;
    videoAnalysis.quiz.forEach((q: any, index: number) => {
      if (quizAnswers[index] === q.correctAnswerIndex) {
        correct++;
      }
    });
    
    const score = Math.round((correct / videoAnalysis.quiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    
    if (selectedTopic && activeCourse) {
      saveQuizScore(activeCourse.id, selectedTopic.slug, score);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">✨</span>
            <span className="sidebar-logo-text">Course Curator</span>
            <span className="sidebar-logo-badge">AI</span>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>🎓 Your Courses</span>
              <span className="sidebar-count">{courses.length}</span>
              {courses.length > 0 && (
                <button 
                  className="sidebar-clear-all"
                  onClick={() => {
                    if (confirm('Remove all courses?')) {
                      removeAllCourses();
                      setSelectedTopic(null);
                      setVideoAnalysis(null);
                    }
                  }}
                  title="Remove all courses"
                >
                  🗑️
                </button>
              )}
            </div>

            {courses.length === 0 ? (
              <div className="sidebar-empty">
                <div className="sidebar-empty-icon">📚</div>
                <p>No courses yet</p>
                <p className="sidebar-empty-sub">Generate your first course</p>
              </div>
            ) : (
              <div className="sidebar-course-list">
                {courses.map((course) => {
                  const total = course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
                  const completed = course.chapters.reduce((acc, ch) => {
                    return acc + ch.topics.filter(t => {
                      const key = `${course.id}:${t.slug}`;
                      return progress[key]?.completed;
                    }).length;
                  }, 0);
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div key={course.id} className="sidebar-course-item-wrapper">
                      <button
                        onClick={() => setActiveCourse(course.id)}
                        className={`sidebar-course-item ${activeCourseId === course.id ? 'active' : ''}`}
                      >
                        <div className="sidebar-course-info">
                          <p className="sidebar-course-title">{course.title}</p>
                          <p className="sidebar-course-meta">{course.chapters.length} chapters</p>
                        </div>
                        <div className="sidebar-course-progress">
                          <span className="sidebar-course-percent">{pct}%</span>
                          <div className="sidebar-progress-bar">
                            <div className="sidebar-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </button>
                      <button 
                        className="sidebar-course-remove"
                        onClick={(e) => handleRemoveCourse(course.id, e)}
                        title="Remove course"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-badge">
            <span>⚡</span>
            <span>AI-Powered Learning</span>
          </div>
          <div className="hero-actions">
            <h1 className="hero-title">
              Generate Your <span className="gradient-text">Personalized Course</span>
            </h1>
            <button 
              className="analytics-toggle-btn"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              📊 Analytics
            </button>
          </div>
          <p className="hero-description">
            Enter any topic and let AI create a complete learning roadmap with videos, quizzes, and interactive mindmaps.
          </p>

          <form onSubmit={handleGenerate} className="topic-form">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Machine Learning, React, Python..."
              className="topic-input"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="generate-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Generating...
                </>
              ) : (
                <>✨ Generate</>
              )}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}

          <div className="quick-topics">
            {['Machine Learning', 'React', 'Python', 'Data Science', 'JavaScript', 'AI'].map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="quick-topic-btn"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {activeCourse && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-cyan">📖</div>
              <div>
                <div className="stat-label">Topics</div>
                <div className="stat-value">{getTotalTopics()}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">✅</div>
              <div>
                <div className="stat-label">Completed</div>
                <div className="stat-value">{getCompletedTopics()}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-violet">📈</div>
              <div>
                <div className="stat-label">Progress</div>
                <div className="stat-value">{getProgress()}%</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-amber">⏱️</div>
              <div>
                <div className="stat-label">Time Spent</div>
                <div className="stat-value">{formatTime(totalTimeSpent)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Course Content */}
        {activeCourse ? (
          <div className="content-grid">
            {/* Left Column - Syllabus */}
            <div className="glass-card syllabus-card">
              <h2 className="syllabus-title">{activeCourse.title}</h2>
              <p className="syllabus-description">{activeCourse.description}</p>
              <div className="syllabus-meta">
                <span className="syllabus-tag">
                  {activeCourse.difficulty || 'Beginner'}
                </span>
                <span className="syllabus-tag">
                  {activeCourse.estimatedHours || 4}h estimated
                </span>
                <span className="syllabus-tag">
                  {activeCourse.chapters.length} chapters
                </span>
              </div>

              <div className="syllabus-list">
                {activeCourse.chapters.map((chapter, idx) => (
                  <div key={chapter.id} className="chapter-section">
                    <div className="chapter-header">
                      <span className="chapter-number">Chapter {idx + 1}</span>
                      <span className="chapter-title">{chapter.title}</span>
                    </div>
                    <div className="topic-timeline">
                      <div className="timeline-line" />
                      {chapter.topics.map((topic) => {
                        const key = `${activeCourse.id}:${topic.slug}`;
                        const isCompleted = progress[key]?.completed;
                        const quizScore = progress[key]?.quizScore;

                        return (
                          <div 
                            key={topic.id} 
                            className={`topic-item ${isCompleted ? 'completed' : ''}`}
                            onClick={() => handleTopicClick(topic, activeCourse.id)}
                          >
                            <div className={`topic-node ${isCompleted ? 'completed' : ''}`} />
                            <div className="topic-content">
                              <div className={`topic-check ${isCompleted ? 'completed' : ''}`}>
                                {isCompleted && '✓'}
                              </div>
                              <span className={`topic-text ${isCompleted ? 'completed' : ''}`}>
                                {topic.title}
                              </span>
                            </div>
                            <div className="topic-actions">
                              {topic.videoId && (
                                <span className="video-badge">▶</span>
                              )}
                              {quizScore !== undefined && quizScore >= 0 && (
                                <span className="quiz-badge">Score: {quizScore}%</span>
                              )}
                              <span className="topic-duration">{topic.estimatedDuration || 15}min</span>
                              {isCompleted && <span className="completed-badge">✓ Done</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Video Player & Content */}
            <div className="right-panel">
              {selectedTopic ? (
                <>
                  {/* Topic Header */}
                  <div className="glass-card topic-header">
                    <h3>{selectedTopic.title}</h3>
                    <p>{selectedTopic.description}</p>
                  </div>

                  {/* Tab Navigation */}
                  <div className="tab-navigation">
                    <button 
                      className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
                      onClick={() => setActiveTab('video')}
                    >
                      ▶ Video
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                      onClick={() => setActiveTab('summary')}
                    >
                      📝 Summary
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                      onClick={() => setActiveTab('quiz')}
                    >
                      🧠 Quiz
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'mindmap' ? 'active' : ''}`}
                      onClick={() => setActiveTab('mindmap')}
                    >
                      🗺️ Mindmap
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="tab-content">
                    {/* Video Tab */}
                    {activeTab === 'video' && (
                      <div className="video-container">
                        {selectedTopic.videoId ? (
                          <VideoPlayer
                            videoId={selectedTopic.videoId}
                            initialTime={progress[`${activeCourse?.id}:${selectedTopic.slug}`]?.videoTime || 0}
                            onTimeUpdate={(seconds) => {
                              if (activeCourse) {
                                updateVideoTime(activeCourse.id, selectedTopic.slug, seconds);
                              }
                            }}
                            onVideoEvent={recordVideoEvent}
                            onPauseReasonSubmitted={(reason) => {
                              recordPauseReason(selectedTopic.slug, reason);
                            }}
                          />
                        ) : (
                          <div className="no-video">
                            <p>No video available for this topic</p>
                            <p className="no-video-sub">Try generating a course with video support</p>
                          </div>
                        )}
                        
                        {isAnalyzing && (
                          <div className="analyzing-overlay">
                            <div className="spinner" />
                            <p>Analyzing video content...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary Tab */}
                    {activeTab === 'summary' && (
                      <div className="glass-card summary-panel">
                        {videoAnalysis?.summary ? (
                          <>
                            <h4>Key Insights</h4>
                            {videoAnalysis.summary.map((item: any, index: number) => (
                              <div key={index} className="summary-item">
                                <span className="summary-emoji">{item.emoji}</span>
                                <div>
                                  <strong>{item.heading}</strong>
                                  <p>{item.detail}</p>
                                </div>
                              </div>
                            ))}
                            
                            {videoAnalysis.eli5 && (
                              <div className="eli5-section">
                                <h4>🧠 ELI5 Explanation</h4>
                                <p>{videoAnalysis.eli5}</p>
                              </div>
                            )}
                            
                            {videoAnalysis.keyConcepts && (
                              <div className="key-concepts">
                                <h4>🔑 Key Concepts</h4>
                                <div className="concept-tags">
                                  {videoAnalysis.keyConcepts.map((concept: string, i: number) => (
                                    <span key={i} className="concept-tag">{concept}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="empty-content">
                            <p>No summary available</p>
                            <p className="empty-sub">Watch the video to generate insights</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quiz Tab */}
                    {activeTab === 'quiz' && (
                      <div className="glass-card quiz-panel">
                        {videoAnalysis?.quiz ? (
                          <>
                            <h4>📝 Quiz</h4>
                            {!quizSubmitted ? (
                              <>
                                {videoAnalysis.quiz.map((q: any, index: number) => (
                                  <div key={index} className="quiz-question">
                                    <p className="question-text">{q.question}</p>
                                    <div className="quiz-options">
                                      {q.options.map((opt: string, optIndex: number) => (
                                        <label key={optIndex} className="quiz-option">
                                          <input
                                            type="radio"
                                            name={`q${index}`}
                                            value={optIndex}
                                            checked={quizAnswers[index] === optIndex}
                                            onChange={() => {
                                              const newAnswers = [...quizAnswers];
                                              newAnswers[index] = optIndex;
                                              setQuizAnswers(newAnswers);
                                            }}
                                          />
                                          <span>{opt}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <button 
                                  className="quiz-submit-btn"
                                  onClick={handleQuizSubmit}
                                  disabled={quizAnswers.length < videoAnalysis.quiz.length}
                                >
                                  Submit Quiz
                                </button>
                              </>
                            ) : (
                              <div className="quiz-results">
                                <div className="quiz-score">
                                  <span className="score-number">{quizScore}%</span>
                                  <span className="score-label">Score</span>
                                </div>
                                {videoAnalysis.quiz.map((q: any, index: number) => (
                                  <div key={index} className="quiz-result-item">
                                    <p className="result-question">{q.question}</p>
                                    <p className={`result-answer ${quizAnswers[index] === q.correctAnswerIndex ? 'correct' : 'incorrect'}`}>
                                      Your answer: {q.options[quizAnswers[index]] || 'Not answered'}
                                      {quizAnswers[index] === q.correctAnswerIndex ? ' ✅' : ' ❌'}
                                    </p>
                                    <p className="result-explanation">💡 {q.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="empty-content">
                            <p>No quiz available</p>
                            <p className="empty-sub">Watch the video to generate quiz questions</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mindmap Tab */}
                    {activeTab === 'mindmap' && (
                      <div className="glass-card mindmap-tab">
                        {videoAnalysis?.mindmap ? (
                          <div className="mindmap-content">
                            <h4>🗺️ Concept Map</h4>
                            <div className="mindmap-visual">
                              {videoAnalysis.mindmap.nodes && videoAnalysis.mindmap.nodes.map((node: any) => (
                                <div key={node.id} className="mindmap-node-item">
                                  <span>{node.label}</span>
                                  {node.metadata?.icon && <span>{node.metadata.icon}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="empty-content">
                            <p>No mindmap available</p>
                            <p className="empty-sub">Watch the video to generate a mindmap</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="glass-card select-topic-prompt">
                  <div className="prompt-content">
                    <span className="prompt-icon">👆</span>
                    <h3>Select a Topic</h3>
                    <p>Click on any topic from the syllabus to start learning</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="welcome-card">
            <div className="welcome-content">
              <div className="welcome-icon">📚</div>
              <h2>No Course Selected</h2>
              <p>Generate a new course above or select one from your sidebar to start learning.</p>
            </div>
          </div>
        )}
      </main>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="analytics-modal-overlay" onClick={() => setShowAnalytics(false)}>
          <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="analytics-modal-close"
              onClick={() => setShowAnalytics(false)}
            >
              ✕
            </button>
            <AnalyticsDashboard />
          </div>
        </div>
      )}
    </div>
  );
}