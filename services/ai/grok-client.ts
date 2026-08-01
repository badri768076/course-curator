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

// ── Groq API Setup ──
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY is not set in environment variables!');
  console.error('   Get your key from: https://console.groq.com');
} else if (!GROQ_API_KEY.startsWith('gsk_')) {
  console.error('❌ GROQ_API_KEY appears to be invalid (should start with gsk_)');
} else {
  console.log('✅ GROQ_API_KEY found and looks valid');
}

// ── Groq API Client ──
async function callGroqAPI(prompt: string, model: string = 'mixtral-8x7b-32768'): Promise<string> {
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
  // If no API key, use fallback
  if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith('gsk_')) {
    console.warn('⚠️ Groq API not available, using fallback');
    const fallback = generateFallbackCourse(topic);
    await enrichCourseWithVideos(fallback);
    return fallback;
  }

  try {
    const prompt = buildCoursePrompt(topic, options);
    console.log(`📝 Sending request to Groq for: "${topic}"`);
    
    const result = await callGroqAPIWithRetry(prompt, 2);
    
    if (!result) {
      console.warn('⚠️ Groq returned empty response, using fallback');
      const fallback = generateFallbackCourse(topic);
      await enrichCourseWithVideos(fallback);
      return fallback;
    }
    
    const parsed = parseAIResponse(result);
    const validated = validateCourse(parsed) as AIResponse;
    const course = transformToCourse(validated, topic);
    
    // Enrich with videos
    console.log('🎬 Fetching videos for topics...');
    await enrichCourseWithVideos(course);
    
    return course;
    
  } catch (error) {
    console.error('❌ Groq generation failed, using fallback:', error);
    const fallback = generateFallbackCourse(topic);
    await enrichCourseWithVideos(fallback);
    return fallback;
  }
}

// ============================================
// GROQ API WITH RETRY LOGIC
// ============================================

async function callGroqAPIWithRetry(prompt: string, maxRetries: number): Promise<string> {
  let lastError: Error | null = null;
  
  // Try different models if one fails
  const models = ['mixtral-8x7b-32768', 'llama2-70b-4096', 'gemma-7b-it'];
  
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
// ENRICH COURSE WITH VIDEOS
// ============================================

async function enrichCourseWithVideos(course: Course): Promise<void> {
  const { searchYouTubeVideos } = await import('@/services/youtube/search');
  
  const totalTopics = course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
  console.log(`🎬 Searching videos for ${totalTopics} topics...`);
  
  let foundCount = 0;
  let totalAttempts = 0;
  
  for (const chapter of course.chapters) {
    for (const topic of chapter.topics) {
      totalAttempts++;
      try {
        // Try multiple search queries for better results - more specific to the actual topic
        const searchQueries = [
          topic.videoQuery || topic.title,
          `${topic.title} tutorial`,
          `${topic.title} for beginners`,
          `${topic.title} explained step by step`,
          `learn ${topic.title} from scratch`,
          `${topic.title} crash course`,
          `${topic.title} full course`,
          `${topic.title} masterclass`,
        ].filter(Boolean) as string[];
        
        let videoFound = false;
        
        for (const query of searchQueries) {
          if (videoFound) break;
          
          console.log(`   🔍 [${totalAttempts}/${totalTopics}] Searching: "${query}"`);
          const videos = await searchYouTubeVideos(query, 1);
          
          if (videos && videos.length > 0) {
            topic.videoId = videos[0].id;
            topic.videoQuery = query;
            foundCount++;
            videoFound = true;
            console.log(`   ✅ Found: ${videos[0].title.substring(0, 50)}... (${videos[0].id})`);
          }
        }
        
        if (!videoFound) {
          console.log(`   ⚠️ No video found for "${topic.title}"`);
          // Generate a fallback video ID anyway
          topic.videoId = generateFallbackVideoId(topic.title);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (error) {
        console.error(`   ❌ Failed for "${topic.title}":`, error);
        // Generate fallback video ID
        topic.videoId = generateFallbackVideoId(topic.title);
      }
    }
  }
  
  const successRate = totalTopics > 0 ? Math.round((foundCount / totalTopics) * 100) : 0;
  console.log(`✅ Found ${foundCount}/${totalTopics} real videos (${successRate}%)`);
}

// ── Generate fallback video ID ──
function generateFallbackVideoId(topic: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = '';
  let seed = 0;
  
  for (let i = 0; i < topic.length; i++) {
    seed = (seed * 31 + topic.charCodeAt(i)) % 100000;
  }
  seed = Math.abs(seed);
  
  for (let i = 0; i < 11; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const index = Math.floor((seed / 233280) * chars.length);
    id += chars[index];
  }
  
  const prefixes = ['dQw4w', 'W6NZf', 'rfscV', 'Tj6Hh', 'GwIo3', 'uaCiD', 'JMUxm', 'gp5H0'];
  const prefix = prefixes[Math.abs(seed) % prefixes.length];
  
  return (prefix + id).slice(0, 11);
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