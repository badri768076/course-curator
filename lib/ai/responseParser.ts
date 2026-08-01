// lib/ai/responseParser.ts

import { AIResponse } from '@/types/ai-output';

export function parseAIResponse(response: string): AIResponse {
  try {
    let cleaned = response.trim();
    
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    cleaned = cleaned.trim();
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.course) {
      throw new Error('Missing "course" key in response');
    }
    
    if (!parsed.course.title || !parsed.course.chapters || !Array.isArray(parsed.course.chapters)) {
      throw new Error('Invalid course structure');
    }
    
    return parsed as AIResponse;
    
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error(`Response parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateCourse(aiResponse: any): AIResponse {
  const { course } = aiResponse;
  
  const validChapters = course.chapters
    .filter((chapter: any) => chapter.title && chapter.topics && Array.isArray(chapter.topics))
    .map((chapter: any) => ({
      ...chapter,
      topics: chapter.topics
        .filter((topic: any) => topic.title)
        .map((topic: any) => ({
          ...topic,
          description: topic.description || `Learn about ${topic.title}`,
          videoQuery: topic.videoQuery || topic.title,
          estimatedDuration: topic.estimatedDuration || 15,
          prerequisites: topic.prerequisites || [],
        })),
    }))
    .filter((chapter: any) => chapter.topics.length > 0);
  
  if (validChapters.length === 0) {
    throw new Error('No valid chapters found in AI response');
  }
  
  return {
    course: {
      title: course.title || 'Untitled Course',
      description: course.description || 'A comprehensive learning path',
      difficulty: course.difficulty || 'beginner',
      estimatedHours: course.estimatedHours || 4,
      chapters: validChapters,
    },
  };
}

export function extractJSONFromText(text: string): any {
  const strategies = [
    () => {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    },
    () => {
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : null;
    },
    () => {
      return JSON.parse(text);
    },
  ];
  
  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result) return result;
    } catch (e) {
      continue;
    }
  }
  
  throw new Error('Could not extract valid JSON from text');
}