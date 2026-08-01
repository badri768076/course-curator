// components/features/learning/LearningProfileDashboard.tsx

'use client';

import { useLearningStore } from '@/store/use-learning-store';
import { LearningStyle } from '@/types/learning-style';
import { LearningStyleQuiz } from './LearningStyleQuiz';
import { useState } from 'react';

const STYLE_INFO: Record<LearningStyle, { icon: string; label: string; color: string; description: string }> = {
  'visual': {
    icon: '👁️',
    label: 'Visual Learner',
    color: '#8B5CF6',
    description: 'You learn best by seeing information through images, diagrams, and visual aids.'
  },
  'auditory': {
    icon: '👂',
    label: 'Auditory Learner',
    color: '#3B82F6',
    description: 'You learn best by listening to explanations, discussions, and audio content.'
  },
  'read-write': {
    icon: '📝',
    label: 'Read/Write Learner',
    color: '#10B981',
    description: 'You learn best by reading text and writing notes and summaries.'
  },
  'kinesthetic': {
    icon: '🏃',
    label: 'Kinesthetic Learner',
    color: '#F59E0B',
    description: 'You learn best by doing, experimenting, and hands-on activities.'
  },
  'unknown': {
    icon: '🧠',
    label: 'Learning Style Unknown',
    color: '#6B7280',
    description: 'Take the quiz to discover your learning style!'
  }
};

export function LearningProfileDashboard() {
  const { learningProfile } = useLearningStore();
  const [showQuiz, setShowQuiz] = useState(false);
  const style = learningProfile.dominantStyle || 'unknown';
  const info = STYLE_INFO[style];

  const getStyleScore = () => {
    const scores = learningProfile.scores;
    // Get the score for the dominant style
    const styleKey = style as keyof typeof scores;
    const score = scores[styleKey] || 0;
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  };

  const confidence = getStyleScore();

  return (
    <div className="profile-dashboard">
      <div className="profile-header">
        <div className="profile-icon" style={{ backgroundColor: info.color + '20' }}>
          <span style={{ fontSize: '2rem' }}>{info.icon}</span>
        </div>
        <div className="profile-info">
          <h3>{info.label}</h3>
          <p>{info.description}</p>
          <div className="profile-confidence">
            <span>Confidence: {confidence}%</span>
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ width: `${confidence}%`, backgroundColor: info.color }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button 
          className="profile-btn"
          onClick={() => setShowQuiz(!showQuiz)}
        >
          {showQuiz ? 'Hide Quiz' : 'Take Learning Style Quiz'}
        </button>
      </div>

      {showQuiz && (
        <div className="profile-quiz-container">
          <LearningStyleQuiz />
        </div>
      )}

      <div className="profile-stats">
        <h4>Learning Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{learningProfile.videoPauses}</span>
            <span className="stat-label">Pauses</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{learningProfile.videoRewinds}</span>
            <span className="stat-label">Rewinds</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{learningProfile.videoSkips}</span>
            <span className="stat-label">Skips</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{learningProfile.sessionCount}</span>
            <span className="stat-label">Sessions</span>
          </div>
        </div>
      </div>

      <div className="profile-style-scores">
        <h4>Style Scores</h4>
        {Object.entries(learningProfile.scores).map(([styleName, score]) => {
          const styleKey = styleName as LearningStyle;
          const styleInfo = STYLE_INFO[styleKey];
          if (!styleInfo) return null;
          const maxScore = Math.max(...Object.values(learningProfile.scores), 1);
          const percentage = Math.round((score / maxScore) * 100);
          return (
            <div key={styleName} className="style-score">
              <span className="style-score-label">
                {styleInfo.icon} {styleInfo.label}
              </span>
              <div className="style-score-bar">
                <div 
                  className="style-score-fill"
                  style={{ 
                    width: `${percentage}%`, 
                    backgroundColor: styleInfo.color,
                    opacity: percentage > 0 ? 1 : 0.3
                  }}
                />
              </div>
              <span className="style-score-value">{Math.round(score)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}