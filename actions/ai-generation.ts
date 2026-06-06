'use server';

import { generateCourseOutline } from '@/services/ai/grok-client';
import { Course } from '@/types/ai-output';

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
