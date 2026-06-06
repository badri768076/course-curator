import React, { useState } from 'react';
import { MCQQuestion } from '@/types/ai-output';
import { AIFeedback } from './AIFeedback';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useLearningStore } from '@/store/use-learning-store';
import { Award, RefreshCw, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MCQFormProps {
  questions: MCQQuestion[];
  topicSlug: string;
  topicTitle: string;
}

export function MCQForm({ questions, topicSlug, topicTitle }: MCQFormProps) {
  const router = useRouter();
  const activeCourseId = useLearningStore((state) => state.activeCourseId);
  const saveQuizScore = useLearningStore((state) => state.saveQuizScore);
  const markTopicCompleted = useLearningStore((state) => state.markTopicCompleted);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <Card style={{ maxWidth: '650px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>No quiz questions available for this topic.</p>
        <Button onClick={() => router.back()} style={{ marginTop: '1rem' }}>Go Back</Button>
      </Card>
    );
  }

  const currentQuestion = questions[currentIdx];

  const handleOptionSelect = (idx: number) => {
    if (submitted) return;
    setSelectedIdx(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedIdx === null || submitted) return;
    
    setSubmitted(true);
    if (selectedIdx === currentQuestion.correctAnswerIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedIdx(null);
    setSubmitted(false);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      // Finished the quiz
      setQuizFinished(true);
      if (activeCourseId) {
        saveQuizScore(activeCourseId, topicSlug, score + (selectedIdx === currentQuestion.correctAnswerIndex ? 1 : 0));
        // Mark topic completed automatically if they score > 50%
        const finalScore = score + (selectedIdx === currentQuestion.correctAnswerIndex ? 1 : 0);
        const passRatio = finalScore / questions.length;
        if (passRatio >= 0.5) {
          markTopicCompleted(activeCourseId, topicSlug, true);
        }
      }
    }
  };

  const handleResetQuiz = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    const finalPercent = Math.round((score / questions.length) * 100);
    const passed = finalPercent >= 50;

    return (
      <Card style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${passed ? '#22c55e' : '#ef4444'}`,
            }}
          >
            <Award size={40} color={passed ? '#22c55e' : '#ef4444'} />
          </div>
          <div>
            <CardTitle style={{ fontSize: '1.8rem', fontWeight: 800 }}>Quiz Completed!</CardTitle>
            <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.5rem' }}>Topic: {topicTitle}</p>
          </div>

          <div style={{ margin: '1rem 0' }}>
            <span style={{ fontSize: '3.5rem', fontWeight: 800, color: passed ? '#22c55e' : '#ef4444' }}>
              {score}/{questions.length}
            </span>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginTop: '0.25rem' }}>
              {passed ? 'Congratulations! You Passed' : 'Keep Learning and Try Again'}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>
              Requires 50% score or more to unlock topic completion badge.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
            <Button variant="secondary" onClick={handleResetQuiz} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={16} /> Re-take Quiz
            </Button>
            <Button onClick={() => router.push(`/dashboard`)}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: '650px', margin: '2rem auto', padding: '2rem' }}>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          <button
            onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span>Question {currentIdx + 1} of {questions.length}</span>
        </div>
        <CardTitle style={{ fontSize: '1.4rem', color: 'white', lineHeight: '1.4' }}>
          {currentQuestion.question}
        </CardTitle>
      </CardHeader>
      
      <CardContent style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {currentQuestion.options.map((option, idx) => {
          let optionStyle: React.CSSProperties = {
            width: '100%',
            textAlign: 'left',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            background: 'hsla(220 50% 12% / 0.5)',
            border: '1px solid hsla(var(--border-glass))',
            color: 'hsl(var(--text-primary))',
            fontSize: '0.95rem',
            cursor: submitted ? 'default' : 'pointer',
            outline: 'none',
            transition: 'all 0.2s ease',
          };

          if (selectedIdx === idx) {
            optionStyle.borderColor = 'hsl(var(--primary-violet))';
            optionStyle.background = 'hsla(var(--primary-violet) / 0.1)';
          }

          if (submitted) {
            if (idx === currentQuestion.correctAnswerIndex) {
              optionStyle.borderColor = '#22c55e';
              optionStyle.background = 'rgba(34, 197, 94, 0.15)';
              optionStyle.color = '#fff';
            } else if (selectedIdx === idx) {
              optionStyle.borderColor = '#ef4444';
              optionStyle.background = 'rgba(239, 68, 68, 0.15)';
              optionStyle.color = '#fff';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              style={optionStyle}
              disabled={submitted}
              className={!submitted ? 'option-btn' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: selectedIdx === idx ? 'hsl(var(--primary-violet))' : 'hsla(var(--border-glass))',
                    color: selectedIdx === idx ? '#fff' : 'hsl(var(--text-secondary))',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </div>
            </button>
          );
        })}

        {submitted && (
          <AIFeedback
            isCorrect={selectedIdx === currentQuestion.correctAnswerIndex}
            explanation={currentQuestion.explanation}
          />
        )}
      </CardContent>

      <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        {!submitted ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={selectedIdx === null}
            style={{ width: '120px' }}
          >
            Submit
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            style={{ width: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <span>{currentIdx + 1 === questions.length ? 'Finish Quiz' : 'Next'}</span>
            <ChevronRight size={16} />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
export default MCQForm;
