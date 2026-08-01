// types/video-analysis.ts

// ============================================
// VIDEO ANALYSIS RESULT - MAIN TYPE
// ============================================

export interface VideoAnalysisResult {
  topicSlug: string;
  videoId: string;
  generatedAt: string;
  summary: VideoSummaryItem[];
  transcript: TranscriptSegment[];
  chapters: VideoChapter[];
  quiz: QuizQuestion[];
  mindmap: MindmapData;
  flowchart: FlowchartData;
  eli5: string;
  keyConcepts: string[];
  vocabulary: VocabularyItem[];
}

// ============================================
// SUMMARY TYPES
// ============================================

export interface VideoSummaryItem {
  emoji: string;
  heading: string;
  detail: string;
}

// ============================================
// TRANSCRIPT TYPES
// ============================================

export interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
  seconds?: number;
  timestamp?: string;
}

// ============================================
// CHAPTER TYPES
// ============================================

export interface VideoChapter {
  title: string;
  startTime: number;
  endTime: number;
  summary: string;
  keyPoints: string[];
  seconds?: number;
  timestamp?: string;
}

// ============================================
// QUIZ TYPES
// ============================================

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

// ============================================
// MINDMAP TYPES
// ============================================

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  layout?: 'radial' | 'tree' | 'horizontal';
}

export interface MindmapNode {
  id: string;
  slug: string;
  label: string;
  type: 'root' | 'chapter' | 'topic';
  parentId?: string;
  completed?: boolean;
  x?: number;
  y?: number;
  level?: number;
  children?: string[];
  metadata?: {
    icon?: string;
    color?: string;
    description?: string;
  };
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'direct' | 'dashed' | 'dotted';
}

// ============================================
// FLOWCHART TYPES
// ============================================

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  title?: string;
}

export interface FlowchartNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'io' | 'subprocess';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

// ============================================
// VOCABULARY TYPES
// ============================================

export interface VocabularyItem {
  term: string;
  definition: string;
  context?: string;
  example?: string;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isVideoAnalysisResult(obj: any): obj is VideoAnalysisResult {
  return (
    obj &&
    typeof obj.topicSlug === 'string' &&
    typeof obj.videoId === 'string' &&
    Array.isArray(obj.summary) &&
    Array.isArray(obj.chapters) &&
    Array.isArray(obj.quiz) &&
    obj.mindmap &&
    obj.flowchart
  );
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_VIDEO_ANALYSIS: VideoAnalysisResult = {
  topicSlug: '',
  videoId: '',
  generatedAt: new Date().toISOString(),
  summary: [],
  transcript: [],
  chapters: [],
  quiz: [],
  mindmap: { nodes: [], edges: [] },
  flowchart: { nodes: [], edges: [] },
  eli5: '',
  keyConcepts: [],
  vocabulary: [],
};