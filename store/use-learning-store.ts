import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course } from '@/types/ai-output';
import { VideoAnalysisResult } from '@/types/video-analysis';
import {
  LearningProfile,
  LearningStyle,
  LearningStyleScores,
  DEFAULT_LEARNING_PROFILE,
} from '@/types/learning-style';

type ScoredStyle = keyof LearningStyleScores;

interface ProgressData {
  completed: boolean;
  videoTime: number;
  quizScore: number;
}

interface LearningStore {
  courses: Course[];
  activeCourseId: string | null;
  activeTopicSlug: string | null;
  progress: Record<string, ProgressData>;
  videoAnalyses: Record<string, VideoAnalysisResult>;
  learningProfile: LearningProfile;
  eli5Unlocked: Record<string, boolean>;

  addCourse: (course: Course) => void;
  setActiveCourse: (courseId: string) => void;
  setActiveTopic: (topicSlug: string | null) => void;
  markTopicCompleted: (courseId: string, topicSlug: string, completed: boolean) => void;
  updateVideoTime: (courseId: string, topicSlug: string, time: number) => void;
  saveQuizScore: (courseId: string, topicSlug: string, score: number) => void;
  clearAll: () => void;
  cacheVideoAnalysis: (topicSlug: string, result: VideoAnalysisResult) => void;
  recordVideoEvent: (type: 'pause' | 'rewind' | 'skip') => void;
  recordPanelTime: (panelName: string, ms: number) => void;
  recordQuizAttemptSpeed: (secondsPerQuestion: number) => void;
  recordPauseReason: (topicSlug: string, reason: 'notes' | 'confused' | 'bored') => void;
  recordQuizAttemptDetails: (topicSlug: string, secondsPerQuestion: number, changeCount: number) => void;
  unlockEli5: (topicSlug: string) => void;
  computeAndUpdateStyle: () => LearningStyle;

  // NEW: Time tracking
  totalTimeSpent: number;
  updateTimeSpent: (courseId: string, topicSlug: string, seconds: number) => Promise<void>;
  fetchTotalTime: () => Promise<void>;
}

function computeStyle(profile: LearningProfile): LearningStyle {
  const MIN_ENGAGEMENT_MS = 45_000;
  if (profile.totalEngagementMs < MIN_ENGAGEMENT_MS) return 'unknown';

  const { scores } = profile;
  const entries = Object.entries(scores) as [LearningStyle, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const second = sorted[1];
  if (top[1] === 0) return 'unknown';
  if (top[1] - second[1] < top[1] * 0.15 && profile.totalEngagementMs < 120_000) return 'unknown';
  return top[0] as LearningStyle;
}

const VIDEO_EVENT_POINTS: Record<string, Partial<Record<ScoredStyle, number>>> = {
  pause: { auditory: 3 },
  rewind: { auditory: 6 },
  skip: { kinesthetic: 2 },
};

const PANEL_STYLE_WEIGHTS: Record<string, Partial<Record<ScoredStyle, number>>> = {
  summary: { 'read-write': 1.0 },
  transcript: { auditory: 1.0, 'read-write': 0.3 },
  mindmap: { visual: 1.2 },
  flowchart: { visual: 1.2 },
  quiz: { kinesthetic: 1.5 },
};

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      courses: [],
      activeCourseId: null,
      activeTopicSlug: null,
      progress: {},
      videoAnalyses: {},
      learningProfile: { ...DEFAULT_LEARNING_PROFILE },
      eli5Unlocked: {},
      totalTimeSpent: 0, // NEW

      addCourse: (course) =>
        set((state) => {
          const exists = state.courses.some((c) => c.slug === course.slug);
          const newCourses = exists ? state.courses : [...state.courses, course];
          const firstTopic = course.chapters[0]?.topics[0]?.slug || null;
          return { courses: newCourses, activeCourseId: course.id, activeTopicSlug: firstTopic };
        }),

      setActiveCourse: (courseId) =>
        set((state) => {
          const course = state.courses.find((c) => c.id === courseId);
          const firstTopic = course?.chapters[0]?.topics[0]?.slug || null;
          return { activeCourseId: courseId, activeTopicSlug: firstTopic };
        }),

      setActiveTopic: (topicSlug) => set({ activeTopicSlug: topicSlug }),

      markTopicCompleted: (courseId, topicSlug, completed) =>
        set((state) => {
          const key = `${courseId}:${topicSlug}`;
          const current = state.progress[key] || { completed: false, videoTime: 0, quizScore: -1 };
          const updatedCourses = state.courses.map((course) => {
            if (course.id !== courseId) return course;
            return {
              ...course,
              mindmap: {
                ...course.mindmap,
                nodes: course.mindmap.nodes.map((n) =>
                  n.slug === topicSlug ? { ...n, completed } : n
                ),
              },
            };
          });
          return {
            courses: updatedCourses,
            progress: { ...state.progress, [key]: { ...current, completed } },
          };
        }),

      updateVideoTime: (courseId, topicSlug, time) =>
        set((state) => {
          const key = `${courseId}:${topicSlug}`;
          const current = state.progress[key] || { completed: false, videoTime: 0, quizScore: -1 };
          return { progress: { ...state.progress, [key]: { ...current, videoTime: time } } };
        }),

      saveQuizScore: (courseId, topicSlug, score) =>
        set((state) => {
          const key = `${courseId}:${topicSlug}`;
          const current = state.progress[key] || { completed: false, videoTime: 0, quizScore: -1 };
          return { progress: { ...state.progress, [key]: { ...current, quizScore: score } } };
        }),

      clearAll: () =>
        set({
          courses: [],
          activeCourseId: null,
          activeTopicSlug: null,
          progress: {},
          videoAnalyses: {},
          learningProfile: { ...DEFAULT_LEARNING_PROFILE },
          eli5Unlocked: {},
          totalTimeSpent: 0, // NEW
        }),

      cacheVideoAnalysis: (topicSlug, result) =>
        set((state) => ({
          videoAnalyses: { ...state.videoAnalyses, [topicSlug]: result },
        })),

      recordVideoEvent: (type) =>
        set((state) => {
          const profile = { ...state.learningProfile };
          const scoresDelta = VIDEO_EVENT_POINTS[type] || {};

          if (type === 'pause') profile.videoPauses += 1;
          if (type === 'rewind') profile.videoRewinds += 1;
          if (type === 'skip') profile.videoSkips += 1;

          const newScores = { ...profile.scores };
          for (const [style, pts] of Object.entries(scoresDelta)) {
            const key = style as ScoredStyle;
            newScores[key] = (newScores[key] ?? 0) + (pts as number);
          }

          const updatedProfile = { ...profile, scores: newScores, lastUpdated: new Date().toISOString() };
          updatedProfile.dominantStyle = computeStyle(updatedProfile);
          return { learningProfile: updatedProfile };
        }),

      recordPanelTime: (panelName, ms) =>
        set((state) => {
          const profile = { ...state.learningProfile };
          const panelTime = { ...profile.panelTimeSpent };
          panelTime[panelName] = (panelTime[panelName] || 0) + ms;

          const weights = PANEL_STYLE_WEIGHTS[panelName] || {};
          const newScores = { ...profile.scores };
          const seconds = ms / 1000;
          for (const [style, w] of Object.entries(weights)) {
            const key = style as ScoredStyle;
            newScores[key] = (newScores[key] ?? 0) + seconds * (w as number);
          }

          const totalEngagementMs = profile.totalEngagementMs + ms;
          const updatedProfile = {
            ...profile,
            scores: newScores,
            panelTimeSpent: panelTime,
            totalEngagementMs,
            sessionCount: profile.sessionCount + 1,
            lastUpdated: new Date().toISOString(),
          };
          updatedProfile.dominantStyle = computeStyle(updatedProfile);
          return { learningProfile: updatedProfile };
        }),

      recordQuizAttemptSpeed: (secondsPerQuestion) =>
        set((state) => {
          const profile = { ...state.learningProfile };
          const prev = profile.quizAttemptSpeedAvg;
          const count = profile.sessionCount || 1;
          const avg = prev + (secondsPerQuestion - prev) / count;

          const newScores = { ...profile.scores };
          if (secondsPerQuestion < 8) newScores.kinesthetic = (newScores.kinesthetic || 0) + 5;
          else newScores['read-write'] = (newScores['read-write'] || 0) + 3;

          const updatedProfile = { ...profile, scores: newScores, quizAttemptSpeedAvg: avg, lastUpdated: new Date().toISOString() };
          updatedProfile.dominantStyle = computeStyle(updatedProfile);
          return { learningProfile: updatedProfile };
        }),

      recordPauseReason: (topicSlug, reason) =>
        set((state) => {
          const profile = { ...state.learningProfile };
          const pauseReasons = { ...profile.pauseReasons };
          pauseReasons[reason] = (pauseReasons[reason] || 0) + 1;

          const newScores = { ...profile.scores };
          const newEli5Unlocked = { ...state.eli5Unlocked };

          if (reason === 'confused') {
            newScores.visual = (newScores.visual || 0) + 5;
            newScores['read-write'] = (newScores['read-write'] || 0) + 2;
            newEli5Unlocked[topicSlug] = true;
          } else if (reason === 'notes') {
            newScores['read-write'] = (newScores['read-write'] || 0) + 5;
          } else if (reason === 'bored') {
            newScores.kinesthetic = (newScores.kinesthetic || 0) + 4;
          }

          const updatedProfile = {
            ...profile,
            scores: newScores,
            pauseReasons,
            lastUpdated: new Date().toISOString(),
          };
          updatedProfile.dominantStyle = computeStyle(updatedProfile);

          return {
            learningProfile: updatedProfile,
            eli5Unlocked: newEli5Unlocked,
          };
        }),

      recordQuizAttemptDetails: (topicSlug, secondsPerQuestion, changeCount) =>
        set((state) => {
          const profile = { ...state.learningProfile };

          const prevSpeed = profile.quizAttemptSpeedAvg;
          const count = profile.sessionCount || 1;
          const avgSpeed = prevSpeed + (secondsPerQuestion - prevSpeed) / count;

          const prevChanges = profile.quizAnswerChanges;
          const avgChanges = prevChanges + (changeCount - prevChanges) / count;

          let answeringStyle: 'Reflective' | 'Active' | 'Balanced' = 'Balanced';
          if (secondsPerQuestion > 12 && changeCount <= 1) {
            answeringStyle = 'Reflective';
          } else if (secondsPerQuestion < 8 || changeCount >= 2) {
            answeringStyle = 'Active';
          }

          const newScores = { ...profile.scores };
          const newEli5Unlocked = { ...state.eli5Unlocked };

          if (answeringStyle === 'Active') {
            newScores.kinesthetic = (newScores.kinesthetic || 0) + 4;
            newEli5Unlocked[topicSlug] = true;
          } else if (answeringStyle === 'Reflective') {
            newScores['read-write'] = (newScores['read-write'] || 0) + 4;
          }

          if (changeCount > 1) {
            newScores.kinesthetic = (newScores.kinesthetic || 0) + changeCount * 1.5;
          }

          const updatedProfile = {
            ...profile,
            scores: newScores,
            quizAttemptSpeedAvg: avgSpeed,
            quizAnswerChanges: avgChanges,
            answeringStyle,
            lastUpdated: new Date().toISOString(),
          };
          updatedProfile.dominantStyle = computeStyle(updatedProfile);

          return {
            learningProfile: updatedProfile,
            eli5Unlocked: newEli5Unlocked,
          };
        }),

      unlockEli5: (topicSlug) =>
        set((state) => ({
          eli5Unlocked: { ...state.eli5Unlocked, [topicSlug]: true },
        })),

      computeAndUpdateStyle: () => {
        const profile = get().learningProfile;
        const style = computeStyle(profile);
        set((state) => ({
          learningProfile: { ...state.learningProfile, dominantStyle: style },
        }));
        return style;
      },

      // NEW time tracking methods
      updateTimeSpent: async (courseId, topicSlug, seconds) => {
        try {
          await fetch('/api/track-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, topicSlug, seconds }),
          });
          await get().fetchTotalTime();
        } catch (err) {
          console.error('Failed to track time', err);
        }
      },

      fetchTotalTime: async () => {
        try {
          const res = await fetch('/api/user-time');
          const data = await res.json();
          set({ totalTimeSpent: data.totalSeconds || 0 });
        } catch (err) {
          console.error('Failed to fetch total time', err);
        }
      },
    }),
    { name: 'course-curator-storage' }
  )
);