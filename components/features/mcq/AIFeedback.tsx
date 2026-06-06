import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIFeedbackProps {
  isCorrect: boolean;
  explanation: string;
}

export function AIFeedback({ isCorrect, explanation }: AIFeedbackProps) {
  return (
    <div
      className="animate-fade-in"
      style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: isCorrect ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
        <Sparkles size={16} color={isCorrect ? '#22c55e' : '#ef4444'} />
        <span style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
          {isCorrect ? 'Correct Answer!' : 'Incorrect Choice'}
        </span>
      </div>
      <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.5' }}>
        <strong>AI Explanation:</strong> {explanation}
      </p>
    </div>
  );
}
export default AIFeedback;
