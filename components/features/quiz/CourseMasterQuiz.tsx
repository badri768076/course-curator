'use client';

import React, { useState, useMemo } from 'react';
import { Course } from '@/types/ai-output';
import { BookOpen, HelpCircle, CheckCircle, BarChart2, ArrowLeft } from 'lucide-react';

interface CourseMasterQuizProps {
    activeCourse: Course | null;
    videoAnalyses: Record<string, any>;
    onBackToCourse: () => void;
}

export function CourseMasterQuiz({ activeCourse, videoAnalyses, onBackToCourse }: CourseMasterQuizProps) {
    const [phase, setPhase] = useState<'setup' | 'quiz' | 'results'>('setup');
    const [numQuestions, setNumQuestions] = useState<number>(5);
    const [activeQuestions, setActiveQuestions] = useState<any[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [score, setScore] = useState<number>(0);

    // Compile data via useMemo
    const { allNotes, allQuestions } = useMemo(() => {
        if (!activeCourse) return { allNotes: [], allQuestions: [] };

        const notes: any[] = [];
        const questions: any[] = [];

        activeCourse.chapters.forEach(ch => {
            ch.topics.forEach(t => {
                const analysis = videoAnalyses[t.slug];
                if (analysis) {
                    if (analysis.summary && analysis.summary.length > 0) {
                        notes.push({ topicTitle: t.title, items: analysis.summary });
                    }
                    if (analysis.quiz && analysis.quiz.length > 0) {
                        analysis.quiz.forEach((q: any) => {
                            questions.push({ ...q, topicTitle: t.title });
                        });
                    }
                }
            });
        });

        return { allNotes: notes, allQuestions: questions };
    }, [activeCourse, videoAnalyses]);

    const maxQuestions = allQuestions.length;
    if (numQuestions > maxQuestions && maxQuestions > 0) {
        setNumQuestions(maxQuestions);
    }

    if (!activeCourse) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <HelpCircle size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
                <h2 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.5rem' }}>No Course Selected</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Select a course from your left sidebar first to take its Master Quiz!</p>
            </div>
        );
    }

    if (maxQuestions === 0) {
        return (
            <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem', background: 'white' }}>
                <BookOpen size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
                <h2 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.5rem' }}>No Data Unlocked Yet!</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Watch and analyze videos in <strong>{activeCourse.title}</strong> to generate notes and unlock master quiz questions.</p>
                <button onClick={onBackToCourse} className="generate-btn" style={{ width: 'auto', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Go to Course Content
                </button>
            </div>
        );
    }

    const startQuiz = () => {
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, numQuestions);
        const diffMap: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
        selected.sort((a, b) => (diffMap[a.difficulty || 'medium'] || 2) - (diffMap[b.difficulty || 'medium'] || 2));

        setActiveQuestions(selected);
        setUserAnswers({});
        setPhase('quiz');
    };

    const submitQuiz = () => {
        let correct = 0;
        activeQuestions.forEach((q, idx) => {
            const correctIdx = q.correctAnswerIndex ?? q.correct_answer ?? 0;
            if (userAnswers[idx] === correctIdx) correct++;
        });
        setScore(Math.round((correct / activeQuestions.length) * 100));
        setPhase('results');
    };

    return (
        <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', background: 'white', color: '#1e293b', position: 'relative' }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                    🎓 Master Quiz: <span style={{ color: '#3b82f6', fontWeight: 600 }}>{activeCourse.title}</span>
                </h2>
                {phase !== 'setup' && (
                    <button onClick={() => setPhase('setup')} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                        <ArrowLeft size={16} /> Restart
                    </button>
                )}
            </div>

            <div style={{ padding: '2rem' }}>
                {phase === 'setup' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpen size={20} color="#3b82f6" /> Course Summary Notes
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '1rem' }}>
                                {allNotes.map((group, idx) => (
                                    <div key={idx} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                            From: {group.topicTitle}
                                        </h4>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {group.items.map((item: any, i: number) => (
                                                <li key={i} style={{ color: '#475569', lineHeight: '1.6' }}>
                                                    <strong>{item.emoji} {item.heading}:</strong> {item.detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'sticky', top: '2rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <HelpCircle size={48} color="#3b82f6" style={{ margin: '0 auto 1rem auto' }} />
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Ready to self-test?</h3>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Read your compiled notes on the left, then configure your quiz parameters below.</p>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
                                    Number of Questions
                                </label>
                                <input
                                    type="range"
                                    min={Math.min(1, maxQuestions)}
                                    max={maxQuestions}
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    <span>{numQuestions} selected</span>
                                    <span>Max: {maxQuestions}</span>
                                </div>
                                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px' }}>
                                    💡 Questions will be randomly pulled from the pool and automatically mixed across Easy, Medium, and Hard difficulties.
                                </p>
                            </div>

                            <button onClick={startQuiz} className="generate-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={20} /> Start Master Quiz
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'quiz' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0 }}>Attempting {activeQuestions.length} Questions</h3>
                            <span style={{ padding: '0.5rem 1rem', background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', fontWeight: 600, fontSize: '0.875rem' }}>
                                Mixed Difficulties
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {activeQuestions.map((q, idx) => {
                                const diffColor = q.difficulty === 'hard' ? '#ef4444' : q.difficulty === 'easy' ? '#10b981' : '#f59e0b';
                                return (
                                    <div key={idx} style={{ padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>From: {q.topicTitle}</span>
                                            <span style={{ fontSize: '0.75rem', color: diffColor, background: `${diffColor}20`, padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{q.difficulty || 'Medium'}</span>
                                        </div>
                                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', lineHeight: '1.5' }}>
                                            <span style={{ color: '#3b82f6', marginRight: '0.5rem' }}>{idx + 1}.</span> {q.question}
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {q.options.map((opt: string, oIdx: number) => {
                                                const isSelected = userAnswers[idx] === oIdx;
                                                return (
                                                    <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: isSelected ? '#eff6ff' : 'white', border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}>
                                                        <input type="radio" name={`q-${idx}`} value={oIdx} checked={isSelected} onChange={() => setUserAnswers(prev => ({ ...prev, [idx]: oIdx }))} style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
                                                        <span style={{ color: isSelected ? '#1e293b' : '#475569', fontWeight: isSelected ? 500 : 400 }}>{opt}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                            <button
                                onClick={submitQuiz}
                                disabled={Object.keys(userAnswers).length < activeQuestions.length}
                                className="generate-btn"
                                style={{ width: '100%', maxWidth: '400px', padding: '1.25rem', fontSize: '1.1rem', opacity: Object.keys(userAnswers).length < activeQuestions.length ? 0.5 : 1 }}
                            >
                                Submit Master Quiz
                            </button>
                            {Object.keys(userAnswers).length < activeQuestions.length && (
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '1rem' }}>Please answer all questions before submitting.</p>
                            )}
                        </div>
                    </div>
                )}

                {phase === 'results' && (
                    <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
                        <div style={{ marginBottom: '3rem' }}>
                            <BarChart2 size={64} color={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'} style={{ margin: '0 auto 1.5rem auto' }} />
                            <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>{score}%</h2>
                            <p style={{ fontSize: '1.25rem', color: '#64748b', margin: 0 }}>
                                {score >= 80 ? 'Outstanding! You mastered these concepts.' : score >= 50 ? 'Good effort! Keep reviewing your notes.' : 'Need more practice. Review the videos again!'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
                            {activeQuestions.map((q, idx) => {
                                const uAns = userAnswers[idx];
                                const cAns = q.correctAnswerIndex ?? q.correct_answer ?? 0;
                                const isCorrect = uAns === cAns;
                                return (
                                    <div key={idx} style={{ padding: '2rem', border: `2px solid ${isCorrect ? '#10b98150' : '#ef444450'}`, borderRadius: '16px', background: isCorrect ? '#ecfdf5' : '#fef2f2' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{isCorrect ? '✅' : '❌'}</span>
                                            <div>
                                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#1e293b' }}>{idx + 1}. {q.question}</h4>
                                                <div style={{ marginBottom: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                                    <p style={{ margin: 0, color: isCorrect ? '#10b981' : '#ef4444', fontWeight: 600 }}>Your Answer: {q.options[uAns]}</p>
                                                    {!isCorrect && (
                                                        <p style={{ margin: '0.5rem 0 0 0', color: '#10b981', fontWeight: 600 }}>Correct Answer: {q.options[cAns]}</p>
                                                    )}
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                                    <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}><strong>Explanation:</strong> {q.explanation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={() => setPhase('setup')} className="analytics-toggle-btn" style={{ marginTop: '3rem', padding: '1rem 3rem', fontSize: '1.1rem' }}>Review Notes & Try Again</button>
                    </div>
                )}
            </div>
        </div>
    );
}
