// components/features/learning/LearningProfileBadge.tsx

'use client';

import { useLearningStore } from '@/store/use-learning-store';
import { LearningStyle } from '@/types/learning-style';

const STYLE_ICONS: Record<LearningStyle, string> = {
  'visual': '👁️',
  'auditory': '👂',
  'read-write': '📝',
  'kinesthetic': '🏃',
  'unknown': '🧠',
};

const STYLE_LABELS: Record<LearningStyle, string> = {
  'visual': 'Visual Learner',
  'auditory': 'Auditory Learner',
  'read-write': 'Read/Write Learner',
  'kinesthetic': 'Kinesthetic Learner',
  'unknown': 'Learning Style Unknown',
};

const STYLE_COLORS: Record<LearningStyle, string> = {
  'visual': '#8B5CF6',
  'auditory': '#3B82F6',
  'read-write': '#10B981',
  'kinesthetic': '#F59E0B',
  'unknown': '#6B7280',
};

const STYLE_DESCRIPTIONS: Record<LearningStyle, string> = {
  'visual': 'You learn best by seeing information through images and diagrams',
  'auditory': 'You learn best by listening to explanations and discussions',
  'read-write': 'You learn best by reading text and writing notes',
  'kinesthetic': 'You learn best by doing and hands-on activities',
  'unknown': 'Complete the quiz to discover your learning style!',
};

export function LearningProfileBadge() {
  const { learningProfile } = useLearningStore();
  const style = learningProfile.dominantStyle || 'unknown';
  const confidence = learningProfile.confidence || 0;

  return (
    <div className="learning-badge" style={{ borderColor: STYLE_COLORS[style] }}>
      <span className="learning-badge-icon">{STYLE_ICONS[style]}</span>
      <div className="learning-badge-info">
        <span className="learning-badge-label">{STYLE_LABELS[style]}</span>
        <span className="learning-badge-description">{STYLE_DESCRIPTIONS[style]}</span>
        {confidence > 0 && (
          <div className="learning-badge-confidence">
            <span className="learning-badge-confidence-label">Confidence: {confidence}%</span>
            <div className="learning-badge-confidence-bar">
              <div 
                className="learning-badge-confidence-fill"
                style={{ width: `${confidence}%`, backgroundColor: STYLE_COLORS[style] }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}