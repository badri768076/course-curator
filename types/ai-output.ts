export interface MCQOption {
  text: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface TopicNode {
  title: string;
  slug: string;
  videoUrl?: string; // YouTube video embed ID
  videoQuery?: string; // Search query for video
  duration?: number; // Video duration in seconds
  content?: string; // Markdown learning content
  quiz?: MCQQuestion[];
  isCompleted?: boolean;
}

export interface Chapter {
  title: string;
  slug: string;
  topics: TopicNode[];
}

export interface MindmapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'root' | 'chapter' | 'topic';
  slug?: string;
  completed?: boolean;
}

export interface MindmapEdge {
  from: string;
  to: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  chapters: Chapter[];
  mindmap: {
    nodes: MindmapNode[];
    edges: MindmapEdge[];
  };
  createdAt: string;
}
