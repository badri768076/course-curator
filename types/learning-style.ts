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
  totalEngagementMs: number;
  videoPauses: number;
  videoRewinds: number;
  videoSkips: number;
  panelTimeSpent: Record<string, number>; // panel name → ms
  quizAttemptSpeedAvg: number; // seconds per question
  sessionCount: number;
  lastUpdated: string;
  // Dynamic Pitch Deck features
  pauseReasons: {
    notes: number;
    confused: number;
    bored: number;
  };
  answeringStyle: 'Reflective' | 'Active' | 'Balanced';
  quizAnswerChanges: number;
}

export const DEFAULT_LEARNING_PROFILE: LearningProfile = {
  dominantStyle: 'unknown',
  scores: { visual: 0, auditory: 0, 'read-write': 0, kinesthetic: 0 },
  totalEngagementMs: 0,
  videoPauses: 0,
  videoRewinds: 0,
  videoSkips: 0,
  panelTimeSpent: {
    summary: 0,
    transcript: 0,
    mindmap: 0,
    flowchart: 0,
    quiz: 0,
  },
  quizAttemptSpeedAvg: 0,
  sessionCount: 0,
  lastUpdated: new Date().toISOString(),
  pauseReasons: {
    notes: 0,
    confused: 0,
    bored: 0,
  },
  answeringStyle: 'Balanced',
  quizAnswerChanges: 0,
};

export const STYLE_META: Record<LearningStyle, { label: string; emoji: string; color: string; description: string }> = {
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
    description: 'Keep engaging with the content. We\'re learning how you learn.',
  },
};
