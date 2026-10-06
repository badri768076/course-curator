// actions/ai-generation.ts

'use server';

import { 
  Course, 
  GenerationRequest, 
  GenerationResponse,
  VideoAnalysisResult,
  FlowchartData,
  FlowchartEdge
} from '@/types/ai-output';
import { generateCourseOutline } from '@/services/ai/grok-client';
import { analyzeVideo } from '@/services/ai/video-analyzer';
import { searchYouTubeVideos } from '@/services/youtube/search';

// ============================================
// COURSE GENERATION ACTIONS
// ============================================

/**
 * Generate a complete course outline for a given topic
 */
export async function generateCourseAction(
  topic: string,
  options?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: number;
  }
): Promise<Course> {
  if (!topic || topic.trim() === '') {
    throw new Error('Topic query cannot be empty.');
  }

  if (topic.length < 2) {
    throw new Error('Topic must be at least 2 characters long.');
  }

  if (topic.length > 200) {
    throw new Error('Topic is too long. Please keep it under 200 characters.');
  }

  console.log(`[generateCourseAction] Starting generation for topic: "${topic}"`, options);

  try {
    const course = await generateCourseOutline(topic, options);
    
    // Log how many videos were found
    const totalTopics = course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
    const topicsWithVideos = course.chapters.reduce((acc, ch) => 
      acc + ch.topics.filter(t => t.videoId).length, 0
    );
    
    console.log(`[generateCourseAction] ✅ Course generated: "${course.title}"`);
    console.log(`[generateCourseAction] 📊 ${totalTopics} topics, ${topicsWithVideos} with videos (${Math.round(topicsWithVideos/totalTopics*100)}%)`);
    
    return course;
    
  } catch (error: any) {
    console.error('[generateCourseAction] ❌ Failed to generate course outline:', error);
    
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      throw new Error('AI service authentication failed. Please check your API key configuration.');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('AI service quota exceeded. Please try again in a few minutes.');
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      throw new Error('AI service request timed out. Please try again.');
    }
    
    if (error.message?.includes('parse') || error.message?.includes('invalid')) {
      throw new Error('Failed to parse AI response. The service returned an unexpected format.');
    }
    
    throw new Error(error?.message || 'Failed to generate course syllabus. Please try again.');
  }
}

/**
 * Generate a course with additional metadata for the response
 */
export async function generateCourseWithMetadata(
  request: GenerationRequest
): Promise<GenerationResponse> {
  const startTime = Date.now();
  
  try {
    const course = await generateCourseAction(
      request.topic,
      {
        difficulty: request.difficulty,
        duration: request.duration,
      }
    );
    
    const generationTime = Date.now() - startTime;
    
    return {
      success: true,
      course,
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'groq-mixtral-8x7b',
        generationTime,
        fallbackUsed: false,
      },
    };
    
  } catch (error: any) {
    const generationTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error?.message || 'Unknown error occurred',
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'groq-mixtral-8x7b',
        generationTime,
        fallbackUsed: true,
      },
    };
  }
}

/**
 * Regenerate a course with specific modifications
 */
export async function regenerateCourseAction(
  existingCourse: Course,
  modifications: {
    title?: string;
    addChapters?: number;
    changeDifficulty?: 'beginner' | 'intermediate' | 'advanced';
    expandTopics?: string[];
  }
): Promise<Course> {
  try {
    const baseTopic = modifications.title || existingCourse.title;
    
    let modificationInstructions = '';
    if (modifications.addChapters) {
      modificationInstructions += `Add approximately ${modifications.addChapters} more chapters. `;
    }
    if (modifications.changeDifficulty) {
      modificationInstructions += `Make the content at ${modifications.changeDifficulty} level. `;
    }
    if (modifications.expandTopics && modifications.expandTopics.length > 0) {
      modificationInstructions += `Expand these topics: ${modifications.expandTopics.join(', ')}. `;
    }
    
    const newCourse = await generateCourseOutline(baseTopic, {
      difficulty: modifications.changeDifficulty,
      additionalInstructions: modificationInstructions,
    });
    
    return {
      ...newCourse,
      id: existingCourse.id,
    };
    
  } catch (error: any) {
    console.error('[regenerateCourseAction] Failed to regenerate course:', error);
    throw new Error(`Failed to regenerate course: ${error?.message || 'Unknown error'}`);
  }
}

// ============================================
// VIDEO SEARCH ACTION
// ============================================

/**
 * Search for videos for a specific topic
 */
export async function searchVideosForTopicAction(
  topicTitle: string,
  topicDescription?: string
): Promise<{ videoId: string | null; query: string }> {
  try {
    const searchQueries = [
      topicTitle,
      `${topicTitle} tutorial`,
      `${topicTitle} for beginners`,
      `${topicTitle} explained`,
      topicDescription ? `${topicDescription} tutorial` : null,
    ].filter(Boolean) as string[];

    for (const query of searchQueries) {
      const videos = await searchYouTubeVideos(query, 1);
      if (videos && videos.length > 0) {
        return { videoId: videos[0].id, query };
      }
    }

    return { videoId: null, query: topicTitle };
  } catch (error) {
    console.error('Failed to search videos for topic:', error);
    return { videoId: null, query: topicTitle };
  }
}

// ============================================
// VIDEO ANALYSIS ACTIONS
// ============================================

/**
 * Analyze a YouTube video and generate learning content
 */
export async function analyzeVideoAction(
  topicSlug: string,
  topicTitle: string,
  videoId: string,
  options?: {
    generateQuiz?: boolean;
    generateMindmap?: boolean;
    generateFlowchart?: boolean;
  }
): Promise<VideoAnalysisResult> {
  if (!topicSlug || topicSlug.trim() === '') {
    throw new Error('Topic slug cannot be empty.');
  }
  
  if (!topicTitle || topicTitle.trim() === '') {
    throw new Error('Topic title cannot be empty.');
  }
  
  if (!videoId || videoId.trim() === '') {
    throw new Error('Video ID cannot be empty.');
  }

  if (videoId.length < 5 || videoId.length > 20) {
    throw new Error('Invalid video ID format.');
  }

  console.log(`[analyzeVideoAction] Analyzing video for topic: "${topicTitle}" (${videoId})`);

  try {
    const analysis = await analyzeVideo(topicSlug, topicTitle, videoId);
    const rawAnalysis = analysis as any;
    
    const result: VideoAnalysisResult = {
      version: rawAnalysis.version || 2,
      summary: (rawAnalysis.summary && rawAnalysis.summary.length > 0) ? rawAnalysis.summary : [
        { emoji: '📌', heading: `Introduction to ${topicTitle}`, detail: `Fundamental principles, architecture, and core objectives of ${topicTitle}.` },
        { emoji: '🔑', heading: 'Core Concepts & Logic', detail: `Key structural mechanics and design guidelines explained in the lesson.` },
        { emoji: '💡', heading: 'Practical Application', detail: `Real-world examples, patterns, and implementation strategies.` },
      ],
      transcript: Array.isArray(rawAnalysis.transcript) && rawAnalysis.transcript.length > 0
        ? rawAnalysis.transcript
        : (rawAnalysis.chapters || []).map((ch: any) => ({
            text: ch.summary || ch.title || '',
            startTime: ch.seconds ?? ch.startTime ?? 0,
            endTime: ch.endTime ?? ((ch.seconds ?? ch.startTime ?? 0) + 120),
            conceptTags: [ch.title?.toLowerCase() || ''],
          })),
      chapters: (rawAnalysis.chapters && rawAnalysis.chapters.length > 0 ? rawAnalysis.chapters : [
        { title: `Introduction to ${topicTitle}`, startTime: 0, seconds: 0, timestamp: '0:00', summary: `Overview of ${topicTitle} and main objectives.` },
        { title: 'Core Principles & Architecture', startTime: 120, seconds: 120, timestamp: '2:00', summary: 'Deep dive into fundamental mechanisms and rules.' },
        { title: 'Implementation & Examples', startTime: 300, seconds: 300, timestamp: '5:00', summary: 'Practical step-by-step code and demonstrations.' },
        { title: 'Review & Best Practices', startTime: 480, seconds: 480, timestamp: '8:00', summary: 'Summary of key takeaways and common pitfalls.' },
      ]).map((ch: any) => {
        const sec = ch.seconds ?? ch.startTime ?? ch.start ?? ch.start_time ?? 0;
        const mins = Math.floor(sec / 60);
        const remSecs = Math.floor(sec % 60);
        return {
          title: ch.title || 'Chapter',
          startTime: sec,
          endTime: ch.endTime || ch.end || (sec + 120),
          seconds: sec,
          timestamp: ch.timestamp || `${mins}:${String(remSecs).padStart(2, '0')}`,
          summary: ch.summary || `Overview of ${ch.title || 'this section'}.`,
          keyPoints: ch.keyPoints || ch.key_points || ch.keypoints || [],
        };
      }),
      quiz: (rawAnalysis.quiz && rawAnalysis.quiz.length > 0 ? rawAnalysis.quiz : [
        {
          question: `What is the primary role of ${topicTitle}?`,
          options: ['Core foundational concept', 'Alternative optional library', 'Deprecated legacy pattern', 'None of the above'],
          correctAnswerIndex: 0,
          explanation: `${topicTitle} provides fundamental structure and capabilities in its domain.`,
          difficulty: 'easy',
        },
      ]).map((q: any) => ({
        question: q.question || '',
        options: q.options || [],
        correctAnswerIndex: q.correctAnswerIndex ?? q.correct_answer ?? q.answerIndex ?? 0,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        topic: q.topic || topicSlug,
      })),
      mindmap: (rawAnalysis.mindmap && rawAnalysis.mindmap.nodes && rawAnalysis.mindmap.nodes.length > 0)
        ? rawAnalysis.mindmap
        : {
            nodes: [
              { id: 'root', slug: topicSlug, label: topicTitle, type: 'root', x: 300, y: 200 },
              { id: 'c1', slug: 'fundamentals', label: 'Core Fundamentals', type: 'chapter', x: 200, y: 110 },
              { id: 'c2', slug: 'patterns', label: 'Design Patterns', type: 'chapter', x: 400, y: 110 },
              { id: 'c3', slug: 'workflow', label: 'Execution Workflow', type: 'topic', x: 190, y: 290 },
              { id: 'c4', slug: 'practices', label: 'Best Practices', type: 'topic', x: 410, y: 290 },
            ],
            edges: [
              { id: 'e1', from: 'root', to: 'c1' },
              { id: 'e2', from: 'root', to: 'c2' },
              { id: 'e3', from: 'root', to: 'c3' },
              { id: 'e4', from: 'root', to: 'c4' },
            ],
          },
      flowchart: convertToFlowchartData(rawAnalysis.flowchart, topicTitle),
      eli5: rawAnalysis.eli5 || rawAnalysis.eli_5 || '',
      keyConcepts: rawAnalysis.keyConcepts || rawAnalysis.key_concepts || [],
      vocabulary: (rawAnalysis.vocabulary || []).map((v: any) => ({
        term: v.term || v.word || '',
        definition: v.definition || v.meaning || '',
        context: v.context || '',
        example: v.example || '',
      })),
    };
    
    console.log(`[analyzeVideoAction] ✅ Successfully analyzed video for: "${topicTitle}"`);
    console.log(`[analyzeVideoAction] 📊 Summary items: ${result.summary?.length || 0}`);
    console.log(`[analyzeVideoAction] 📊 Quiz questions: ${result.quiz?.length || 0}`);
    
    return result;
    
  } catch (error: any) {
    console.error('[analyzeVideoAction] ❌ Failed to analyze video:', error);
    
    if (error.message?.includes('transcript') || error.message?.includes('transcription')) {
      throw new Error('Failed to fetch video transcript. The video might not have captions available.');
    }
    
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      throw new Error('AI service authentication failed. Please check your API key configuration.');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('AI service quota exceeded. Please try again in a few minutes.');
    }
    
    throw new Error(error?.message || 'Failed to analyze video. Please try again.');
  }
}

// ============================================
// HELPER: Convert flowchart data
// ============================================

function convertToFlowchartData(rawFlowchart: any, topicTitle: string = 'Topic'): FlowchartData {
  if (rawFlowchart?.nodes && rawFlowchart.nodes.length > 0) {
    const edges: FlowchartEdge[] = (rawFlowchart.edges || []).map((edge: any) => {
      const source = edge.source || edge.from || edge.start || '';
      const target = edge.target || edge.to || edge.end || '';
      return {
        id: edge.id || `edge-${Date.now()}-${Math.random()}`,
        source: source,
        target: target,
        label: edge.label || '',
        condition: edge.condition || '',
      };
    });
    
    const nodes = rawFlowchart.nodes.map((node: any, idx: number) => ({
      id: node.id || `node-${idx}`,
      label: node.label || node.title || node.name || `Step ${idx + 1}`,
      type: node.type || (idx === 0 ? 'start' : idx === rawFlowchart.nodes.length - 1 ? 'end' : 'process'),
      x: typeof node.x === 'number' ? node.x : 200,
      y: typeof node.y === 'number' ? node.y : (idx * 90 + 50),
      width: node.width || 150,
      height: node.height || 50,
    }));
    
    return {
      nodes,
      edges,
      title: rawFlowchart.title || topicTitle,
    };
  }

  // Fallback 5-step learning workflow
  return {
    nodes: [
      { id: 'start', label: `Start: ${topicTitle}`, type: 'start', x: 200, y: 50 },
      { id: 'p1', label: 'Understand Key Principles', type: 'process', x: 200, y: 140 },
      { id: 'd1', label: 'Code & Build Exercises', type: 'decision', x: 200, y: 230 },
      { id: 'p2', label: 'Debug & Refine Solution', type: 'process', x: 200, y: 320 },
      { id: 'end', label: 'Skill Mastered', type: 'end', x: 200, y: 410 },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'p1' },
      { id: 'e2', source: 'p1', target: 'd1' },
      { id: 'e3', source: 'd1', target: 'p2' },
      { id: 'e4', source: 'p2', target: 'end' },
    ],
    title: topicTitle,
  };
}

/**
 * Analyze a video and return only specific content types
 */
export async function analyzeVideoPartialAction(
  topicSlug: string,
  topicTitle: string,
  videoId: string,
  contentTypes: ('summary' | 'quiz' | 'mindmap' | 'flowchart' | 'eli5' | 'transcript')[]
): Promise<Partial<VideoAnalysisResult>> {
  try {
    const fullAnalysis = await analyzeVideo(topicSlug, topicTitle, videoId);
    const rawAnalysis = fullAnalysis as any;
    
    const result: Partial<VideoAnalysisResult> = {};
    
    if (contentTypes.includes('summary')) {
      result.summary = rawAnalysis.summary || [];
    }
    if (contentTypes.includes('quiz')) {
      result.quiz = (rawAnalysis.quiz || []).map((q: any) => ({
        question: q.question || '',
        options: q.options || [],
        correctAnswerIndex: q.correctAnswerIndex || q.correct_answer || 0,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        topic: q.topic || '',
      }));
    }
    if (contentTypes.includes('mindmap')) {
      result.mindmap = rawAnalysis.mindmap || { nodes: [], edges: [] };
    }
    if (contentTypes.includes('flowchart')) {
      result.flowchart = convertToFlowchartData(rawAnalysis.flowchart);
    }
    if (contentTypes.includes('eli5')) {
      result.eli5 = rawAnalysis.eli5 || rawAnalysis.eli_5 || '';
    }
    if (contentTypes.includes('transcript')) {
      result.transcript = typeof rawAnalysis.transcript === 'string' 
        ? rawAnalysis.transcript 
        : JSON.stringify(rawAnalysis.transcript || '');
    }
    
    return result;
    
  } catch (error: any) {
    console.error('[analyzeVideoPartialAction] Failed to analyze video partially:', error);
    throw new Error(`Failed to analyze video: ${error?.message || 'Unknown error'}`);
  }
}

// ============================================
// BATCH PROCESSING ACTIONS
// ============================================

/**
 * Generate multiple courses in parallel
 */
export async function generateMultipleCoursesAction(
  topics: string[]
): Promise<Course[]> {
  if (!topics || topics.length === 0) {
    throw new Error('At least one topic is required.');
  }

  if (topics.length > 5) {
    throw new Error('Maximum 5 topics can be generated at once.');
  }

  console.log(`[generateMultipleCoursesAction] Generating ${topics.length} courses`);

  try {
    const courses = await Promise.all(
      topics.map(async (topic: string) => {
        try {
          return await generateCourseAction(topic);
        } catch (error) {
          console.error(`[generateMultipleCoursesAction] Failed for topic "${topic}":`, error);
          return null;
        }
      })
    );

    const successfulCourses = courses.filter((course): course is Course => course !== null);
    
    console.log(`[generateMultipleCoursesAction] ✅ Successfully generated ${successfulCourses.length}/${topics.length} courses`);
    
    return successfulCourses;
    
  } catch (error: any) {
    console.error('[generateMultipleCoursesAction] Failed to generate multiple courses:', error);
    throw new Error(`Failed to generate courses: ${error?.message || 'Unknown error'}`);
  }
}

// ============================================
// UTILITY ACTIONS
// ============================================

/**
 * Validate a course structure without generating
 */
export async function validateCourseAction(
  courseData: any
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (!courseData) {
    errors.push('Course data is required');
    return { valid: false, errors };
  }

  if (!courseData.title || typeof courseData.title !== 'string') {
    errors.push('Course title is required and must be a string');
  }

  if (!courseData.chapters || !Array.isArray(courseData.chapters)) {
    errors.push('Course chapters are required and must be an array');
  } else {
    courseData.chapters.forEach((chapter: any, index: number) => {
      if (!chapter.title || typeof chapter.title !== 'string') {
        errors.push(`Chapter ${index + 1}: Title is required and must be a string`);
      }
      
      if (!chapter.topics || !Array.isArray(chapter.topics)) {
        errors.push(`Chapter ${index + 1}: Topics are required and must be an array`);
      } else {
        chapter.topics.forEach((topic: any, topicIndex: number) => {
          if (!topic.title || typeof topic.title !== 'string') {
            errors.push(`Chapter ${index + 1}, Topic ${topicIndex + 1}: Title is required and must be a string`);
          }
          if (!topic.description || typeof topic.description !== 'string') {
            errors.push(`Chapter ${index + 1}, Topic ${topicIndex + 1}: Description is required and must be a string`);
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate the total duration of a course
 */
export async function estimateCourseDurationAction(
  course: Course
): Promise<{ totalMinutes: number; formatted: string }> {
  let totalMinutes = 0;
  
  course.chapters.forEach((chapter: any) => {
    chapter.topics.forEach((topic: any) => {
      totalMinutes += topic.estimatedDuration || 15;
    });
  });
  
  totalMinutes += Math.ceil(totalMinutes * 0.2);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const formatted = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` 
    : `${minutes}m`;
  
  return {
    totalMinutes,
    formatted: formatted.trim() || '0m',
  };
}