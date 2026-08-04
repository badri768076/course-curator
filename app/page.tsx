// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { generateCourseAction, analyzeVideoAction } from '@/actions/ai-generation';
import { VideoPlayer } from '@/components/features/video/VideoPlayer';
import { AnalyticsDashboard } from '@/components/features/analytics/AnalyticsDashboard';
import { VideoAnalysisResult } from '@/types/video-analysis';
import { Home, BookOpen, PenTool, Bot, HelpCircle, TrendingUp, Bookmark, FileText, BarChart2, User, Settings, Search, Bell, Moon } from 'lucide-react';
import './dashboard-new.css';
import { AITutorChat } from '@/components/features/chat/AITutorChat';
import { CourseMasterQuiz } from '@/components/features/quiz/CourseMasterQuiz';

export default function DashboardPage() {
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
  const [activeNav, setActiveNav] = useState('Dashboard');

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
    cacheVideoAnalysis,
    removeAllCourses
  } = useLearningStore();

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const completedTopicsCount = Object.values(progress).filter(p => p?.completed).length;
  const mcqScores = Object.values(progress).map(p => p?.quizScore).filter(s => s !== undefined && s > -1);
  const mcqAvg = mcqScores.length > 0 ? Math.round(mcqScores.reduce((a, b) => a + b, 0) / mcqScores.length) : 0;


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
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="main-sidebar">
        <div className="brand-logo">
          <BookOpen className="brand-icon" />
          <span>CourseCurator AI</span>
        </div>

        <nav className="nav-menu">
          {[
            { id: 'Dashboard', icon: Home },
            { id: 'My Learning', icon: BookOpen },
            { id: 'Course Curator', icon: PenTool },
            { id: 'AI Tutor', icon: Bot },
            { id: 'Quiz Zone', icon: HelpCircle },
            { id: 'Analytics', icon: BarChart2 },
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <item.icon size={18} />
              <span>{item.id}</span>
            </button>
          ))}

          <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '1rem' }}>
            My Courses
          </div>
          {courses.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', paddingLeft: '1rem' }}>No courses yet</div>
          )}
          {courses.map(course => (
            <button
              key={course.id}
              className={`nav-item ${activeCourse?.id === course.id && activeNav === 'Course View' ? 'active' : ''}`}
              onClick={() => {
                setActiveCourse(course.id);
                setActiveNav('Course Curator');
              }}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '1rem' }}
              title={course.title}
            >
              <Bookmark size={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</span>
            </button>
          ))}
        </nav>

        <div className="learning-streak-card">
          <h4>Learning Streak 🔥</h4>
          <div className="streak-days">12 Days</div>
          <p>Keep it up! You're doing great.</p>
          <div className="streak-bar"><div className="streak-fill"></div></div>
        </div>
      </aside>

      <div className="main-envelope">
        {/* Topbar */}
        <header className="topbar">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search topics, notes, videos, questions..." />
            <span className="shortcut">Ctrl K</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn"><Bell size={18} /></button>
            <button className="icon-btn"><Moon size={18} /></button>
            <div className="user-profile">
              <img src="https://ui-avatars.com/api/?name=Shreyasa&background=random" alt="User" />
              <span>Shreyasa ⌄</span>
            </div>
          </div>
        </header>

        <div className="content-envelope">
          {activeNav === 'Dashboard' && (
            <div className="dashboard-grid">
              <div className="dashboard-main-col">
                <div className="greeting-section">
                  <h2>Good morning, Shreyasa! 👋</h2>
                  <p>Let's continue your learning journey.</p>
                </div>

                <div className="top-stats-row">
                  <div className="continue-learning-card">
                    <h4>Continue Learning</h4>
                    <div className="continue-content">
                      <div className="video-thumb">
                        <div className="play-icon">▶</div>
                      </div>
                      <div className="continue-info">
                        <h3>Graph Traversal - DFS & BFS</h3>
                        <div className="progress-track">
                          <div className="progress-fill-bg"><div style={{ width: '62%' }}></div></div>
                          <span>62%</span>
                        </div>
                        <p>Last watched 2 days ago</p>
                        <button className="continue-btn" onClick={() => setActiveNav('Course Curator')}>Continue →</button>
                      </div>
                    </div>
                  </div>

                  <div className="stats-2x2">
                    <div className="mini-stat">
                      <div className="stat-icon gray"><TrendingUp size={16} /></div>
                      <div className="stat-text">
                        <span>Total Learning Time</span>
                        <strong>{(totalTimeSpent / 3600).toFixed(1)} hrs</strong>
                        <span className="stat-trend positive">+6.2 hrs this week</span>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <div className="stat-icon green"><BookOpen size={16} /></div>
                      <div className="stat-text">
                        <span>Topics Completed</span>
                        <strong>{completedTopicsCount}</strong>
                        <span className="stat-trend positive">+4 this week</span>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <div className="stat-icon purple"><HelpCircle size={16} /></div>
                      <div className="stat-text">
                        <span>MCQ Accuracy</span>
                        <strong>{mcqAvg}%</strong>
                        <span className="stat-trend positive">+8% improvement</span>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <div className="stat-icon blue"><TrendingUp size={16} /></div>
                      <div className="stat-text">
                        <span>Exam Readiness</span>
                        <strong>Advanced</strong>
                        <span className="stat-trend normal">Top 18% of learners</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ai-recommended-section">
                  <h3>AI Recommended Videos</h3>
                  <div className="video-scroll">
                    {[
                      { title: "Depth First Search (DFS) - Full Visual Explanation", channel: "Tech Dose", match: "95% Match" },
                      { title: "Breadth First Search (BFS) - Algorithm + Examples", channel: "CodeHelp", match: "93% Match" },
                      { title: "Graph Traversal Algorithms Explained Simply", channel: "Jenny's Lectures CS/IT", match: "91% Match" },
                      { title: "DFS vs BFS - Difference Between Both", channel: "Take U Forward", match: "89% Match" },
                    ].map((v, i) => (
                      <div key={i} className="video-card-small">
                        <div className="vid-placeholder">▶</div>
                        <h4>{v.title}</h4>
                        <p>{v.channel}</p>
                        <span className="match-badge">{v.match}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bottom-row">
                  <div className="weak-topics">
                    <div className="section-header">
                      <div>
                        <h3>Weak Topics</h3>
                        <p>Focus on these to improve your performance.</p>
                      </div>
                    </div>
                    <div className="weak-list">
                      <div className="weak-item">
                        <div className="wi-left">
                          <span className="wi-icon blue">🌲</span>
                          <div>
                            <h4>Trees</h4>
                            <p>60% Accuracy</p>
                          </div>
                        </div>
                        <button className="review-btn" onClick={() => setActiveNav('Course Curator')}>Review</button>
                      </div>
                      <div className="weak-item">
                        <div className="wi-left">
                          <span className="wi-icon green">DP</span>
                          <div>
                            <h4>Dynamic Programming</h4>
                            <p>58% Accuracy</p>
                          </div>
                        </div>
                        <button className="review-btn" onClick={() => setActiveNav('Course Curator')}>Review</button>
                      </div>
                      <div className="weak-item">
                        <div className="wi-left">
                          <span className="wi-icon pink">B</span>
                          <div>
                            <h4>Backtracking</h4>
                            <p>62% Accuracy</p>
                          </div>
                        </div>
                        <button className="review-btn" onClick={() => setActiveNav('Course Curator')}>Review</button>
                      </div>
                    </div>
                  </div>

                  <div className="upcoming-goals">
                    <div className="section-header">
                      <div>
                        <h3>Upcoming Goals</h3>
                        <p>Plan your learning ahead.</p>
                      </div>
                      <a href="#" className="view-all">View all</a>
                    </div>
                    <div className="goals-list">
                      <div className="goal-item">
                        <span className="gi-icon green">🎯</span>
                        <span>Finish Trees and BST</span>
                        <span className="gi-date">May 25, 2025</span>
                      </div>
                      <div className="goal-item">
                        <span className="gi-icon blue">📚</span>
                        <span>Complete DP Basics</span>
                        <span className="gi-date">May 28, 2025</span>
                      </div>
                      <div className="goal-item">
                        <span className="gi-icon purple">📝</span>
                        <span>Solve 20 MCQs</span>
                        <span className="gi-date">May 25, 2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-right-col">
                <div className="recent-activity-card">
                  <h4>Recent Activity</h4>
                  <div className="activity-list">
                    <div className="act-item">
                      <div className="act-left"><span className="act-icon">▶</span> Watched Graph Traversal</div>
                      <span className="act-time">2 days ago</span>
                    </div>
                    <div className="act-item">
                      <div className="act-left"><span className="act-icon">📝</span> Solved 15 MCQs</div>
                      <span className="act-time">2 days ago</span>
                    </div>
                    <div className="act-item">
                      <div className="act-left"><span className="act-icon">✅</span> Completed Quiz on DFS</div>
                      <span className="act-time">3 days ago</span>
                    </div>
                  </div>
                  <a href="#" className="view-all-activity">View all activity</a>
                </div>

                <div className="quick-actions-card">
                  <h4>Quick Actions</h4>
                  <button className="quick-action-btn" onClick={() => setActiveNav('Course Curator')}><BookOpen size={16} /> Start New Topic</button>
                  <button className="quick-action-btn" onClick={() => setActiveNav('Course Curator')}><HelpCircle size={16} /> Take a Quiz</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: activeNav === 'Course Curator' ? 'block' : 'none', position: 'relative' }}>
            <div className="legacy-app-wrapper">
              <div className="legacy-curator-container" style={{ width: '100%' }}>
                {/* Sidebar */}
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
                                <div className="video-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1rem', alignItems: 'stretch' }}>
                                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
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
                                  </div>{/* End left wrapper */}
                                  <div style={{ background: '#f8fafc', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '450px' }}>
                                    <AITutorChat videoId={selectedTopic.videoId} topicTitle={selectedTopic.title} />
                                  </div>
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
            </div>
          </div>



          {activeNav === 'Quiz Zone' && (
            <div className="legacy-curator-container" style={{ height: '100%', overflowY: 'auto', background: '#f1f5f9' }}>
              <CourseMasterQuiz
                activeCourse={activeCourse || null}
                videoAnalyses={videoAnalyses}
                onBackToCourse={() => setActiveNav('Course Curator')}
              />
            </div>
          )}

          {activeNav !== 'Dashboard' && activeNav !== 'Course Curator' && activeNav !== 'Quiz Zone' && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <h3>{activeNav}</h3>
              <p>This module is under construction.</p>
            </div>
          )}
        </div>
      </div >
    </div >
  );
}
