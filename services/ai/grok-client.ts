// services/ai/grok-client.ts

import { 
  Course, 
  AIResponse,
  MindmapNode,
  MindmapEdge 
} from '@/types/ai-output';
import { buildCoursePrompt } from '@/lib/ai/prompts';
import { parseAIResponse, validateCourse } from '@/lib/ai/responseParser';
import { generateFallbackCourse } from '@/lib/ai/fallbackGenerator';

import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Groq API Setup ──
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

// ── Gemini API Setup ──
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

// ── Groq API Client ──
async function callGroqAPI(prompt: string, model: string = 'llama-3.3-70b-versatile'): Promise<string> {
  if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith('gsk_')) {
    throw new Error('Invalid or missing GROQ_API_KEY');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer. Return ONLY valid JSON, no markdown, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error response:', errorText);
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from Groq API');
  }
  
  return data.choices[0].message.content;
}

// ── Gemini API Client Fallback ──
async function callGeminiForCourse(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not available');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

  for (const modelName of models) {
    try {
      console.log(`🤖 Attempting course generation with Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(
        `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. No code fences, no extra conversational text.`
      );
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (e: any) {
      console.warn(`⚠️ Gemini model ${modelName} failed:`, e?.message || e);
    }
  }

  throw new Error('All Gemini model attempts failed');
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export async function generateCourseOutline(
  topic: string, 
  options?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: number;
    additionalInstructions?: string;
  }
): Promise<Course> {
  const prompt = buildCoursePrompt(topic, options);

  // 1. Try Groq if key is present
  if (GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')) {
    try {
      console.log(`📝 Sending request to Groq for: "${topic}"`);
      const result = await callGroqAPIWithRetry(prompt, 2);
      if (result) {
        const parsed = parseAIResponse(result);
        const validated = validateCourse(parsed) as AIResponse;
        const course = transformToCourse(validated, topic);
        console.log('🎬 Fetching videos for topics...');
        await enrichCourseWithVideos(course);
        return course;
      }
    } catch (error) {
      console.warn('⚠️ Groq generation failed, attempting Gemini fallback:', error);
    }
  }

  // 2. Try Gemini if key is present
  if (GEMINI_API_KEY) {
    try {
      console.log(`📝 Sending request to Gemini for: "${topic}"`);
      const geminiResult = await callGeminiForCourse(prompt);
      if (geminiResult) {
        const parsed = parseAIResponse(geminiResult);
        const validated = validateCourse(parsed) as AIResponse;
        const course = transformToCourse(validated, topic);
        console.log('🎬 Fetching videos for topics...');
        await enrichCourseWithVideos(course);
        return course;
      }
    } catch (geminiErr) {
      console.warn('⚠️ Gemini generation failed, using dynamic blueprint:', geminiErr);
    }
  }

  // 3. Fallback to dynamic rich curriculum builder
  console.log('✨ Using dynamic curriculum generator for:', topic);
  const fallback = generateFallbackCourse(topic);
  await enrichCourseWithVideos(fallback);
  return fallback;
}

// ============================================
// GROQ API WITH RETRY LOGIC
// ============================================

async function callGroqAPIWithRetry(prompt: string, maxRetries: number): Promise<string> {
  let lastError: Error | null = null;
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile'];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const model of models) {
      try {
        console.log(`🔄 Attempt ${attempt} with model: ${model}`);
        const result = await callGroqAPI(prompt, model);
        
        if (result && result.trim().length > 0) {
          console.log(`✅ Groq response received (${result.length} chars)`);
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Model ${model} failed:`, error);
        continue;
      }
    }
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('All Groq API attempts failed');
}

// ============================================
// ENRICH COURSE WITH DIVERSE VIDEOS
// ============================================

async function enrichCourseWithVideos(course: Course): Promise<void> {
  const { searchYouTubeVideos } = await import('@/services/youtube/search');
  
  const totalTopics = course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
  console.log(`🎬 Searching unique videos for ${totalTopics} topics...`);
  
  let foundCount = 0;
  let totalAttempts = 0;
  const usedVideoIds = new Set<string>();
  
  for (const chapter of course.chapters) {
    for (const topic of chapter.topics) {
      totalAttempts++;
      try {
        const searchQueries = [
          topic.videoQuery,
          `${topic.title} ${course.title} tutorial`,
          `${topic.title} explained`,
          `${topic.title} tutorial step by step`,
        ].filter(Boolean) as string[];
        
        let videoFound = false;
        
        for (const query of searchQueries) {
          if (videoFound) break;
          
          const videos = await searchYouTubeVideos(query, 1, Array.from(usedVideoIds));
          
          if (videos && videos.length > 0 && !usedVideoIds.has(videos[0].id)) {
            topic.videoId = videos[0].id;
            topic.videoQuery = query;
            usedVideoIds.add(videos[0].id);
            foundCount++;
            videoFound = true;
            console.log(`   ✅ [${totalAttempts}/${totalTopics}] Found unique video: ${videos[0].title.substring(0, 45)}... (${videos[0].id})`);
          }
        }
        
        if (!videoFound) {
          const fallbackId = generateFallbackVideoId(topic.title, usedVideoIds);
          topic.videoId = fallbackId;
          usedVideoIds.add(fallbackId);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Video search failed for "${topic.title}":`, error);
        const fallbackId = generateFallbackVideoId(topic.title, usedVideoIds);
        topic.videoId = fallbackId;
        usedVideoIds.add(fallbackId);
      }
    }
  }
  
  const successRate = totalTopics > 0 ? Math.round((foundCount / totalTopics) * 100) : 0;
  console.log(`✅ Assigned videos: ${foundCount}/${totalTopics} from live search (${successRate}%), ${usedVideoIds.size} unique videos across course`);
}

// ── Rich Curated Educational Video Pools (Guarantees Unique Videos per Topic) ──
const DIVERSE_EDUCATIONAL_VIDEOS: Record<string, string[]> = {
  machine: [
    'i_LwzRVP7bg', // Machine Learning for Everybody (freeCodeCamp)
    'ukzFI9rgwfU', // Machine Learning Intro (Simplilearn)
    'aircAruvnKk', // Neural Networks (3Blue1Brown)
    'IHZwWFHWa-w', // Gradient Descent (3Blue1Brown)
    'Gv9_4yMHFhI', // Linear Regression (StatQuest)
    'yIYKR4sgzI8', // Logistic Regression (StatQuest)
    '7eh4d6sabA0', // Decision Trees (StatQuest)
    'J4Wdy0Wc_xQ', // Random Forests (StatQuest)
    '4b5d3muPQmA', // K-Means Clustering (StatQuest)
    'FgakZw6K1QQ', // Principal Component Analysis (StatQuest)
    '5NgNicANyqM', // AI & Deep Learning Explained (freeCodeCamp)
  ],
  python: [
    'kqtD5dpn9C8', // Python for Beginners (Programming with Mosh)
    'rfscVS0vtbw', // Python Tutorial (freeCodeCamp)
    'eWRfhZUzrAc', // Python Full Course (Bro Code)
    '_uQrJ0TkZlc', // Python Course for Beginners
    'HGOBQPFzWKo', // Python Data Structures
    'ZDa-Z5JzLYM', // Python OOP Tutorial
    'W8KRzm-HUcc', // Python Functions & Scope
    'JJmcL1N2KQs', // Python Advanced Concepts
  ],
  react: [
    'bMknfKXIFA8', // React Full Course (freeCodeCamp)
    'SqcY0GlETPk', // React Tutorial (Mosh)
    'w7ejDZ8SWv8', // React Crash Course (Traversy)
    'x4rFhThSX04', // React Hooks Course
    '0riHps91AzE', // React State Management
    'lawz4ZgkOzc', // Next.js & React Full Course
  ],
  javascript: [
    'W6NZfCO5SIk', // JavaScript Tutorial (Mosh)
    'PkZNo7MFNFg', // Learn JavaScript (freeCodeCamp)
    'hdI2bqOjy3c', // JavaScript Crash Course (Traversy Media)
    'jS4aFq5-91M', // JavaScript Basics
    'poNTB9iC7_M', // JavaScript ES6 & Beyond
  ],
  data: [
    '8hly31xKli0', // Data Structures and Algorithms (freeCodeCamp)
    'RBSGKlAvoiM', // Data Structures Easy to Advanced
    'zg9ih6SVACc', // Graph Algorithms
    'oBt53YbR9Kk', // Dynamic Programming
  ],
  general: [
    'rfscVS0vtbw',
    'zOjov-2OZ0E',
    'kqtD5dpn9C8',
    '8hly31xKli0',
    'W6NZfCO5SIk',
    'bMknfKXIFA8',
    'HXV3zeRR3h4',
    'RGOj5yH7evk',
  ],
};

function generateFallbackVideoId(topic: string, usedIds?: Set<string>): string {
  const lower = topic.toLowerCase();
  let pool = DIVERSE_EDUCATIONAL_VIDEOS.general;

  for (const [key, list] of Object.entries(DIVERSE_EDUCATIONAL_VIDEOS)) {
    if (lower.includes(key)) {
      pool = list;
      break;
    }
  }

  // Pick first video not yet used in this course
  if (usedIds) {
    const unused = pool.filter((id) => !usedIds.has(id));
    if (unused.length > 0) {
      return unused[0];
    }
  }

  // Deterministically hash topic to pick varied video from pool
  const hash = topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return pool[hash % pool.length];
}



// ============================================
// TRANSFORM AI RESPONSE TO COURSE
// ============================================

function transformToCourse(aiResponse: AIResponse, topic: string): Course {
  const { course } = aiResponse;
  
  const courseSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const chapters = course.chapters.map((chapter: any, chapterIndex: number) => ({
    id: `ch-${chapterIndex + 1}`,
    title: chapter.title,
    description: chapter.description || `Learn about ${chapter.title}`,
    order: chapterIndex + 1,
    topics: chapter.topics.map((topicItem: any, topicIndex: number) => ({
      id: `t-${chapterIndex + 1}-${topicIndex + 1}`,
      slug: topicItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: topicItem.title,
      description: topicItem.description || `Learn about ${topicItem.title}`,
      videoId: undefined, // Will be filled by enrichCourseWithVideos
      videoQuery: topicItem.videoQuery || topicItem.title,
      estimatedDuration: topicItem.estimatedDuration || 15,
      prerequisites: topicItem.prerequisites || [],
      completed: false,
      order: topicIndex + 1,
    })),
  }));
  
  // ── Build Mindmap Nodes ──
  const nodes: MindmapNode[] = [
    {
      id: 'root',
      slug: courseSlug,
      label: course.title,
      type: 'root',
      level: 0,
      children: [],
      metadata: {
        icon: '📚',
        color: '#8B5CF6',
        description: course.description,
      },
    },
  ];
  
  const edges: MindmapEdge[] = [];
  
  chapters.forEach((chapter: any, ci: number) => {
    const chapterNode: MindmapNode = {
      id: `chapter-${ci + 1}`,
      slug: chapter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: chapter.title,
      type: 'chapter',
      parentId: 'root',
      level: 1,
      children: [],
      metadata: {
        icon: '📖',
        color: '#3B82F6',
        description: chapter.description,
      },
    };
    nodes.push(chapterNode);
    edges.push({
      id: `edge-root-ch${ci + 1}`,
      source: 'root',
      target: `chapter-${ci + 1}`,
      type: 'direct',
    });
    
    const rootNode = nodes.find((n: any) => n.id === 'root');
    if (rootNode) {
      rootNode.children = rootNode.children || [];
      rootNode.children.push(chapterNode.id);
    }
    
    chapter.topics.forEach((topicItem: any, ti: number) => {
      const topicNode: MindmapNode = {
        id: `topic-${ci + 1}-${ti + 1}`,
        slug: topicItem.slug,
        label: topicItem.title,
        type: 'topic',
        parentId: `chapter-${ci + 1}`,
        level: 2,
        children: [],
        completed: false,
        metadata: {
          icon: '🎯',
          color: '#10B981',
          description: topicItem.description,
        },
      };
      nodes.push(topicNode);
      edges.push({
        id: `edge-ch${ci + 1}-t${ti + 1}`,
        source: `chapter-${ci + 1}`,
        target: `topic-${ci + 1}-${ti + 1}`,
        type: 'direct',
      });
      
      const chapterNodeRef = nodes.find((n: any) => n.id === `chapter-${ci + 1}`);
      if (chapterNodeRef) {
        chapterNodeRef.children = chapterNodeRef.children || [];
        chapterNodeRef.children.push(topicNode.id);
      }
    });
  });
  
  return {
    id: `course-${Date.now()}`,
    slug: courseSlug,
    title: course.title,
    description: course.description,
    difficulty: course.difficulty || 'beginner',
    estimatedHours: course.estimatedHours || 4,
    chapters,
    mindmap: { 
      nodes, 
      edges,
      layout: 'radial' 
    },
    generatedAt: new Date().toISOString(),
  };
}