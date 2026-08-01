// types/ai-output.ts

// ============================================
// MAIN COURSE TYPES
// ============================================

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  chapters: Chapter[];
  mindmap: MindmapData;
  generatedAt: string;
  totalDuration?: number;
  estimatedHours?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  topics: Topic[];
  order?: number;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string;
  videoId?: string;
  videoQuery?: string;
  estimatedDuration?: number;
  prerequisites?: string[];
  completed?: boolean;
  order?: number;
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
// AI RESPONSE TYPES
// ============================================

export interface AIResponse {
  course: {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedHours: number;
    chapters: {
      title: string;
      description: string;
      topics: {
        title: string;
        description: string;
        videoQuery: string;
        estimatedDuration: number;
        prerequisites?: string[];
      }[];
    }[];
  };
}

// ============================================
// GENERATION TYPES
// ============================================

export interface GenerationRequest {
  topic: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  includeVideos?: boolean;
  includeQuizzes?: boolean;
}

export interface GenerationResponse {
  success: boolean;
  course?: Course;
  error?: string;
  metadata?: {
    generatedAt: string;
    aiModel: string;
    generationTime: number;
    fallbackUsed: boolean;
  };
}

// ============================================
// VIDEO ANALYSIS TYPES
// ============================================

export interface VideoAnalysisResult {
  summary: VideoSummaryItem[];
  transcript: string;
  chapters: VideoChapter[];
  quiz: QuizQuestion[];
  mindmap: MindmapData;
  flowchart: FlowchartData;
  eli5: string;
  keyConcepts: string[];
  vocabulary: VocabularyItem[];
}

export interface VideoSummaryItem {
  emoji: string;
  heading: string;
  detail: string;
}

export interface VideoChapter {
  title: string;
  startTime: number;
  endTime: number;
  summary: string;
  keyPoints: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

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

export interface VocabularyItem {
  term: string;
  definition: string;
  context?: string;
  example?: string;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isCourse(obj: any): obj is Course {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.chapters) &&
    obj.chapters.every((c: any) => 
      typeof c.id === 'string' &&
      typeof c.title === 'string' &&
      Array.isArray(c.topics)
    )
  );
}

export function isAIResponse(obj: any): obj is AIResponse {
  return (
    obj &&
    obj.course &&
    typeof obj.course.title === 'string' &&
    Array.isArray(obj.course.chapters)
  );
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_COURSE: Partial<Course> = {
  difficulty: 'beginner',
  estimatedHours: 4,
  generatedAt: new Date().toISOString(),
};

export const DEFAULT_TOPIC: Partial<Topic> = {
  completed: false,
  estimatedDuration: 15,
};