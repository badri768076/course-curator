// types/learning-style.ts

export type LearningStyle = 'visual' | 'auditory' | 'read-write' | 'kinesthetic' | 'unknown';

export interface LearningStyleScores {
  visual: number;
  auditory: number;
  'read-write': number;
  kinesthetic: number;
}

export interface LearningProfile {
  dominantStyle: LearningStyle;
  scores: LearningStyleScores;
  confidence: number; // ADD THIS FIELD
  videoPauses: number;
  videoRewinds: number;
  videoSkips: number;
  panelTimeSpent: Record<string, number>;
  totalEngagementMs: number;
  sessionCount: number;
  quizAttemptSpeedAvg: number;
  quizAnswerChanges: number;
  answeringStyle: 'Reflective' | 'Active' | 'Balanced' | 'Unknown';
  pauseReasons: {
    notes: number;
    confused: number;
    bored: number;
  };
  lastUpdated: string;
}

export const DEFAULT_LEARNING_PROFILE: LearningProfile = {
  dominantStyle: 'unknown',
  scores: {
    visual: 0,
    auditory: 0,
    'read-write': 0,
    kinesthetic: 0,
  },
  confidence: 0, // ADD THIS
  videoPauses: 0,
  videoRewinds: 0,
  videoSkips: 0,
  panelTimeSpent: {},
  totalEngagementMs: 0,
  sessionCount: 0,
  quizAttemptSpeedAvg: 0,
  quizAnswerChanges: 0,
  answeringStyle: 'Unknown',
  pauseReasons: {
    notes: 0,
    confused: 0,
    bored: 0,
  },
  lastUpdated: new Date().toISOString(),
};

export interface StyleMeta {
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const STYLE_META: Record<LearningStyle, StyleMeta> = {
  visual: {
    label: 'Visual Learner',
    emoji: '🎨',
    color: '#a855f7',
    description: 'You learn best through diagrams, mindmaps, and visual representations of concepts.',
  },
  auditory: {
    label: 'Auditory Learner',
    emoji: '🎧',
    color: '#00ccff',
    description: 'You absorb information most effectively by listening, replaying, and following transcripts.',
  },
  'read-write': {
    label: 'Read/Write Learner',
    emoji: '📝',
    color: '#f59e0b',
    description: 'You prefer structured text, summaries, bullet points, and written notes.',
  },
  kinesthetic: {
    label: 'Active Learner',
    emoji: '⚡',
    color: '#22c55e',
    description: 'You learn by doing — quizzes, challenges, and hands-on practice work best for you.',
  },
  unknown: {
    label: 'Discovering Style...',
    emoji: '🔍',
    color: '#64748b',
    description: "Keep engaging with the content. We're learning how you learn.",
  },
};