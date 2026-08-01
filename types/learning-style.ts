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