// lib/ai/fallbackGenerator.ts

import { Course, MindmapNode, MindmapEdge } from '@/types/ai-output';

// ── Dynamic Topic Generation based on input topic ──
function generateDynamicTopics(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  
  // Generate topics dynamically based on the topic name
  const baseTopics = [
    `Introduction to ${topic}`,
    `${topic} Fundamentals and Core Concepts`,
    `Working with ${topic} - Practical Examples`,
    `Advanced ${topic} Techniques`,
    `Best Practices and Patterns in ${topic}`,
    `Building Real Projects with ${topic}`,
    `Troubleshooting Common ${topic} Issues`,
    `${topic} Integration and Ecosystem`,
    `Performance Optimization for ${topic}`,
    `Mastering ${topic} - Expert Level`
  ];
  
  // Return a subset based on topic complexity (5-8 topics)
  const complexity = Math.min(8, Math.max(5, topic.length % 4 + 5));
  return baseTopics.slice(0, complexity);
}

// ── Generate Dynamic YouTube-like ID ──
function generateDynamicVideoId(topic: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = '';
  
  // Create seed from topic
  let seed = 0;
  for (let i = 0; i < topic.length; i++) {
    seed = (seed * 31 + topic.charCodeAt(i)) % 100000;
  }
  seed = Math.abs(seed);
  
  // Generate 11 character ID
  for (let i = 0; i < 11; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const index = Math.floor((seed / 233280) * chars.length);
    id += chars[index];
  }
  
  // Make it look like a real YouTube ID
  const prefixes = [
    'dQw4w', 'W6NZf', 'rfscV', 'Tj6Hh', 'GwIo3', 
    'uaCiD', 'JMUxm', 'gp5H0', 'ENrzD', 'ZVnjO',
    'M6f6J', 'P8p8K', 'L9l9M', 'N0n1O', 'Q2q3R'
  ];
  const prefix = prefixes[Math.abs(seed) % prefixes.length];
  
  return (prefix + id).slice(0, 11);
}

// ── Chapter Title Generator ──
function getChapterTitle(index: number, topic: string): string {
  const titles = [
    `Foundations of ${topic}`,
    `Core Concepts and Practices`,
    `Advanced Topics and Applications`,
    `Practical Applications of ${topic}`,
    `Mastering ${topic}`,
  ];
  return titles[index] || `Module ${index + 1}`;
}

// ============================================
// MAIN FALLBACK GENERATOR
// ============================================

export function generateFallbackCourse(topic: string): Course {
  // Generate dynamic topics based on the actual topic
  const chapterTopics = generateDynamicTopics(topic);
  
  // Generate dynamic video ID for this topic
  const videoId = generateDynamicVideoId(topic);
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Calculate chapters
  const chaptersCount = Math.min(4, Math.ceil(chapterTopics.length / 2));
  const topicsPerChapter = Math.ceil(chapterTopics.length / chaptersCount);
  
  const course: Course = {
    id: `course-fallback-${Date.now()}`,
    slug,
    title: `Introduction to ${topic}`,
    description: `A comprehensive learning path covering the fundamentals of ${topic}. This course is designed for beginners and intermediate learners.`,
    difficulty: 'beginner',
    estimatedHours: 4,
    chapters: [],
    mindmap: { nodes: [], edges: [] },
    generatedAt: new Date().toISOString(),
  };
  
  // ── Build Chapters and Topics ──
  for (let i = 0; i < chaptersCount; i++) {
    const startIdx = i * topicsPerChapter;
    const endIdx = Math.min(startIdx + topicsPerChapter, chapterTopics.length);
    const chapterTopicsList = chapterTopics.slice(startIdx, endIdx);
    
    const chapter = {
      id: `ch-${i + 1}`,
      title: `Chapter ${i + 1}: ${getChapterTitle(i, topic)}`,
      description: `Learn the fundamentals of ${topic} through practical examples and exercises.`,
      order: i + 1,
      topics: chapterTopicsList.map((topicTitle: string, j: number) => ({
        id: `t-${i + 1}-${j + 1}`,
        slug: topicTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: topicTitle,
        description: `Comprehensive coverage of ${topicTitle} with practical examples and real-world applications.`,
        videoId: generateDynamicVideoId(topicTitle), // ✅ Unique video ID per topic
        videoQuery: topicTitle,
        estimatedDuration: 15,
        prerequisites: [],
        completed: false,
        order: j + 1,
      })),
    };
    
    course.chapters.push(chapter);
  }
  
  // ── Build Mindmap ──
  const nodes: MindmapNode[] = [
    {
      id: 'root',
      slug: slug,
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
  
  course.chapters.forEach((chapter: any, ci: number) => {
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
  
  course.mindmap = { nodes, edges };
  
  return course;
}