'use server';

import { generateCourseOutline } from '@/services/ai/grok-client';
import { Course } from '@/types/ai-output';
import { analyzeVideo } from '@/services/ai/video-analyzer';
import { VideoAnalysisResult } from '@/types/video-analysis';

export async function generateCourseAction(topic: string): Promise<Course> {
  if (!topic || topic.trim() === '') {
    throw new Error('Topic query cannot be empty.');
  }
  
  try {
    // Call the Grok client generator
    const course = await generateCourseOutline(topic);
    return course;
  } catch (error: any) {
    console.error('Failed to generate course outline:', error);
    throw new Error(error?.message || 'Failed to curate course syllabus');
  }
}

export async function analyzeVideoAction(
  topicSlug: string,
  topicTitle: string,
  videoId: string
): Promise<VideoAnalysisResult> {
  try {
    return await analyzeVideo(topicSlug, topicTitle, videoId);
  } catch (error: any) {
    console.error('Failed to analyze video:', error);
    throw new Error(error?.message || 'Failed to analyze video');
  }
}
