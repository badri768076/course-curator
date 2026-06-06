import { MCQQuestion, MindmapNode, MindmapEdge } from './ai-output';

export interface TranscriptChunk {
  startTime: number; // seconds
  endTime: number;
  text: string;
  conceptTags?: string[];
}

export interface VideoSummaryPoint {
  emoji: string;
  heading: string;
  detail: string;
}

export interface FlowchartNode {
  id: string;
  label: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'io';
  x: number;
  y: number;
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: string;
}

export interface VideoFlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface VideoMindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

export interface VideoChapter {
  seconds: number;
  timestamp: string;
  title: string;
  summary: string;
}

export interface VideoAnalysisResult {
  topicSlug: string;
  videoId: string;
  generatedAt: string;
  summary: VideoSummaryPoint[];
  eli5Summary?: VideoSummaryPoint[];
  transcript: TranscriptChunk[];
  chapters?: VideoChapter[];
  mindmap: VideoMindmapData;
  flowchart: VideoFlowchartData;
  quiz: MCQQuestion[];
}
