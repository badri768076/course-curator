// services/ai/video-analyzer.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import type { VideoAnalysisResult, TranscriptChunk, VideoChapter } from '@/types/video-analysis';
import type { MCQQuestion } from '@/types/ai-output';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

type BaseAnalysisResult = Omit<VideoAnalysisResult, 'topicSlug' | 'videoId' | 'generatedAt'>;

function getDetailedSimulatedChapters(topicTitle: string): VideoChapter[] {
  const titleLower = topicTitle.toLowerCase();
  
  if (titleLower.includes('data structure')) {
    return [
      {
        seconds: 0,
        timestamp: '00:00',
        title: 'Introduction to Data Structures',
        summary: 'A Data Structure is a specialized format for organizing, processing, retrieving, and storing data in computer memory so that operations can be performed efficiently. Choosing the right data structure is critical because it directly impacts both the Time Complexity (speed of execution) and Space Complexity (memory usage) of algorithms. Primitive data structures include integers, floats, characters, and booleans, which serve as the fundamental building blocks for more complex user-defined structures.'
      },
      {
        seconds: 90,
        timestamp: '01:30',
        title: 'Linear vs. Non-Linear Structures',
        summary: 'Data structures are broadly classified into two categories. Linear data structures arrange elements sequentially, where each element is connected to its previous and next adjacent elements (e.g., Arrays, Linked Lists, Stacks, and Queues). Non-linear data structures organize elements hierarchically or in interconnected networks (e.g., Trees and Graphs). In a linear structure, traversal is straightforward and sequential, whereas non-linear structures require recursive traversal algorithms like Depth-First Search (DFS) or Breadth-First Search (BFS).'
      },
      {
        seconds: 270,
        timestamp: '04:30',
        title: 'Real-world Applications & Memory Management',
        summary: 'Understanding the operational trade-offs of each structure is key to software design. For instance, Arrays offer O(1) constant-time access via indices but have a fixed size, while Linked Lists allow dynamic resizing but require O(N) linear-time traversal. Stacks are used in runtime memory management (the call stack) and expression evaluation, while Queues handle scheduling and buffering. Choosing the correct structure ensures optimal hardware utilization and scalable application architecture.'
      }
    ];
  }
  
  if (titleLower.includes('stack')) {
    return [
      {
        seconds: 0,
        timestamp: '00:00',
        title: 'Introduction to Stack LIFO Principle',
        summary: 'A Stack is a linear data structure operating under the Last-In-First-Out (LIFO) protocol. This means the element inserted most recently is the first one to be removed. Think of a stack of dinner plates: you can only place a new plate on top, and you must remove the top plate before accessing the ones below. Stacks are used whenever we need to temporarily store state and retrieve it in reverse order.'
      },
      {
        seconds: 90,
        timestamp: '01:30',
        title: 'Core Operations: Push and Pop',
        summary: 'Stacks support two primary operations with O(1) time complexity: Push and Pop. The Push operation inserts an element onto the top of the stack, updating the top pointer. The Pop operation removes and returns the element at the top of the stack. A third operation, Peek or Top, returns the top element without removing it, allowing inspection. Stacks also implement checks for overflow (when pushing to a full stack) and underflow (when popping from an empty stack).'
      },
      {
        seconds: 270,
        timestamp: '04:30',
        title: 'The Call Stack & Runtime Memory',
        summary: 'In execution runtimes, the Stack is crucial for managing function calls. Every time a function is invoked, an execution context (activation record) containing parameters, local variables, and the return address is pushed onto the Call Stack. When the function returns, its frame is popped, returning control to the caller. Other major applications include expression parsing (converting infix to postfix notation), syntax checking (matching brackets), and implementing backtracking histories (e.g., the browser back button or undo/redo engines).'
      }
    ];
  }

  // Generic fallback with rich technical wording
  return [
    {
      seconds: 0,
      timestamp: '00:00',
      title: 'Introduction & Context',
      summary: `An overview of ${topicTitle}, detailing the historic context, theoretical motivation, and the specific programming challenges it aims to solve. Understanding the foundations of this topic helps software engineers choose optimal solutions and build reliable architectures.`
    },
    {
      seconds: 90,
      timestamp: '01:30',
      title: 'Core Mechanisms & Principles',
      summary: `A deep dive into the operational mechanics of ${topicTitle}. This includes identifying key parameters, analyzing algorithm complexities (Big-O limits), mapping memory layout, and examining step-by-step logic. We focus on building a mental model of how the system functions under load.`
    },
    {
      seconds: 270,
      timestamp: '04:30',
      title: 'Implementation & Best Practices',
      summary: `Practical implementation guide and performance tuning for ${topicTitle}. We cover real-world use cases, production trade-offs, common pitfalls to avoid (like memory leaks or redundant loops), and design patterns that ensure clean, scalable, and maintainable application code.`
    }
  ];
}

// HARDCODED FALLBACK for any topic (guarantees content)
function getHardcodedFallback(topicTitle: string): BaseAnalysisResult {
  return {
    summary: [
      { emoji: '📚', heading: `Introduction to ${topicTitle}`, detail: `Learn the core concepts of ${topicTitle} easily.` },
      { emoji: '🎯', heading: 'Key Principles', detail: 'Understand the fundamental building blocks.' },
      { emoji: '🚀', heading: 'Practical Applications', detail: 'Real-world use cases and examples.' },
      { emoji: '✅', heading: 'Best Practices', detail: 'Follow industry standards for success.' },
    ],
    eli5Summary: [
      { emoji: '🧠', heading: 'Simple Explanation', detail: `${topicTitle} helps solve important problems.` },
    ],
    transcript: [],
    quiz: [
      {
        id: 'q1',
        question: `What is a primary goal of ${topicTitle}?`,
        options: ['Efficiency', 'Entertainment', 'Art', 'Sports'],
        correctAnswerIndex: 0,
        explanation: `${topicTitle} focuses on improving efficiency and solving problems.`,
      },
      {
        id: 'q2',
        question: `Which skill is most relevant to ${topicTitle}?`,
        options: ['Cooking', 'Critical Thinking', 'Dancing', 'Painting'],
        correctAnswerIndex: 1,
        explanation: `Critical thinking and analysis are key to mastering ${topicTitle}.`,
      },
      {
        id: 'q3',
        question: `Why is ${topicTitle} important?`,
        options: ['For fun', 'For real-world solutions', 'For decoration', 'For entertainment'],
        correctAnswerIndex: 1,
        explanation: `${topicTitle} provides real-world solutions to complex challenges.`,
      },
    ],
    mindmap: {
      nodes: [
        { id: 'root', label: topicTitle, type: 'root', slug: '', x: 400, y: 300 },
        { id: 'node1', label: 'Core Concepts', type: 'topic', slug: 'core', x: 250, y: 200 },
        { id: 'node2', label: 'Applications', type: 'topic', slug: 'apps', x: 550, y: 200 },
        { id: 'node3', label: 'Best Practices', type: 'topic', slug: 'practices', x: 400, y: 400 },
      ],
      edges: [
        { from: 'root', to: 'node1' },
        { from: 'root', to: 'node2' },
        { from: 'root', to: 'node3' },
      ],
    },
    flowchart: {
      nodes: [
        { id: 'start', label: 'Start Learning', type: 'start', x: 400, y: 50 },
        { id: 'step1', label: 'Study Fundamentals', type: 'process', x: 400, y: 150 },
        { id: 'step2', label: 'Practice Examples', type: 'process', x: 400, y: 250 },
        { id: 'step3', label: 'Apply to Projects', type: 'process', x: 400, y: 350 },
        { id: 'end', label: 'Mastery', type: 'end', x: 400, y: 450 },
      ],
      edges: [
        { from: 'start', to: 'step1' },
        { from: 'step1', to: 'step2' },
        { from: 'step2', to: 'step3' },
        { from: 'step3', to: 'end' },
      ],
    },
    chapters: getDetailedSimulatedChapters(topicTitle),
  };
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

async function generateChaptersFromTranscript(transcriptText: string, topicTitle: string): Promise<VideoChapter[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
  const prompt = `
You are an expert curriculum designer and educational editor.
We have a video transcript with timestamps.
Please analyze the transcript and partition it into logical chapters/sections (aim for 5-10 sections).
Use the video's actual flow to create these. If the transcript relates to a course introduction or matches the following chapters, prioritize using them:
- 00:00 Introduction
- 01:27 Overview
- 02:44 Shoutouts
- 03:32 Teaching Methodology
- 06:20 Syllabus
- 11:16 Features
- 11:44 Newsletter
- 12:02 Upcoming Courses
- 13:22 Important Links
- 14:44 Outro

Otherwise, automatically partition the transcript into logical sections (e.g. key concepts, demo, summary, outro) based on transitions.
For each section, provide:
1. Start time in seconds (e.g. 0, 87)
2. A formatted timestamp string (e.g. "00:00", "01:27")
3. A descriptive, professional chapter title (e.g. "Introduction", "Overview")
4. A detailed, rich summary of what is taught in this section. The summary must be highly educational, containing concrete explanations, concepts, and technical definitions with at least 150-250 words per chapter. Do NOT write generic placeholder statements. Summarize the transcript content thoroughly so a student can learn directly from the text.

Transcript:
${transcriptText.slice(0, 50000)}

Return ONLY a valid JSON array matching this schema:
[
  {
    "seconds": number,
    "timestamp": "string",
    "title": "string",
    "summary": "string"
  }
]
`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function generateSimulatedChapters(topicTitle: string): Promise<VideoChapter[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
  const prompt = `
Generate a simulated detailed chapter breakdown with timestamps and detailed summaries for a course topic titled "${topicTitle}".
Create 5 logical chapters representing a typical 10-15 minute educational video about this topic.
Feel free to use logical timestamps (e.g., 00:00 Introduction, 01:30 Fundamentals, etc.).
For each chapter, provide:
1. Start time in seconds (e.g. 0, 90, 180, 270, 360)
2. Timestamp string (e.g. "00:00", "01:30", "03:00", "04:30", "06:00")
3. Chapter title
4. A detailed, rich summary of what is taught in this section. The summary must be highly educational, containing concrete explanations, concepts, and technical definitions with at least 120-180 words per chapter. Do NOT write generic placeholder statements. Explain the details using your deep computer science knowledge of this topic so a student can learn directly from the text.

Return ONLY a valid JSON array matching this schema:
[
  {
    "seconds": number,
    "timestamp": "string",
    "title": "string",
    "summary": "string"
  }
]
`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function generateContentFromTitle(topicTitle: string): Promise<BaseAnalysisResult> {
  if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.warn('No Gemini API key – using hardcoded fallback');
    return getHardcodedFallback(topicTitle);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const summaryPrompt = `Create 4 key insights about "${topicTitle}". Each: emoji, heading (max 5 words), detail (max 20 words). Return JSON array only.`;
    const summaryRes = await model.generateContent(summaryPrompt);
    const summary = JSON.parse(summaryRes.response.text().replace(/```json|```/g, '').trim());

    const quizPrompt = `Generate 3 multiple-choice questions about "${topicTitle}" for beginners. Each: question, 4 options, correctIndex (0-3), explanation. Return JSON array.`;
    const quizRes = await model.generateContent(quizPrompt);
    const quiz = JSON.parse(quizRes.response.text().replace(/```json|```/g, '').trim());

    const mindmapPrompt = `Create a mindmap for "${topicTitle}" with 5-7 nodes. Return JSON: { nodes: [{id, label, type, x, y}], edges: [{from, to}] }. Use dummy coordinates.`;
    const mindmapRes = await model.generateContent(mindmapPrompt);
    const mindmap = JSON.parse(mindmapRes.response.text().replace(/```json|```/g, '').trim());

    const flowchartPrompt = `Create a 4-6 step flowchart for "${topicTitle}". Return JSON: { nodes: [{id, label, type, x, y}], edges: [{from, to}] }.`;
    const flowchartRes = await model.generateContent(flowchartPrompt);
    const flowchart = JSON.parse(flowchartRes.response.text().replace(/```json|```/g, '').trim());

    return {
      summary,
      eli5Summary: summary.map((s: any) => ({ ...s, detail: s.detail.toLowerCase() })),
      transcript: [],
      chapters: [],
      quiz,
      mindmap,
      flowchart,
    };
  } catch (err) {
    console.error('AI generation from title failed:', err);
    return getHardcodedFallback(topicTitle);
  }
}

export async function analyzeVideo(
  topicSlug: string,
  topicTitle: string,
  videoId: string
): Promise<VideoAnalysisResult> {
  console.log(`[analyzeVideo] Starting AI generation for "${topicTitle}" (${videoId})`);

  // 1. Generate base content from the title
  const baseContent = await generateContentFromTitle(topicTitle);

  let transcriptChunks: TranscriptChunk[] = [];
  let chapters: VideoChapter[] = [];

  // 2. Try to fetch the transcript from YouTube
  if (videoId) {
    try {
      console.log(`[analyzeVideo] Fetching transcript for videoId: ${videoId}`);
      const fetched = await YoutubeTranscript.fetchTranscript(videoId);
      if (fetched && fetched.length > 0) {
        console.log(`[analyzeVideo] Transcript fetched successfully. Length: ${fetched.length}`);
        
        transcriptChunks = fetched.map((item) => {
          const startTime = Math.floor(item.offset / 1000);
          const endTime = Math.floor((item.offset + item.duration) / 1000);
          return {
            startTime,
            endTime,
            text: item.text,
            conceptTags: []
          };
        });

        // Format transcript with timestamps
        const formattedText = fetched
          .map((item) => `[${formatTime(Math.floor(item.offset / 1000))}] ${item.text}`)
          .join('\n');

        // Generate chapters using Gemini
        try {
          console.log(`[analyzeVideo] Generating chapters from transcript via Gemini...`);
          chapters = await generateChaptersFromTranscript(formattedText, topicTitle);
        } catch (chapterErr) {
          console.error(`[analyzeVideo] Failed to generate chapters from transcript:`, chapterErr);
          chapters = await generateSimulatedChapters(topicTitle);
        }
      }
    } catch (transcriptErr) {
      console.warn(`[analyzeVideo] Could not fetch real transcript for ${videoId}:`, transcriptErr);
    }
  }

  // 3. Fallback to simulated chapters if none generated
  if (chapters.length === 0) {
    try {
      console.log(`[analyzeVideo] Generating simulated chapters via Gemini...`);
      chapters = await generateSimulatedChapters(topicTitle);
    } catch (fallbackErr) {
      console.error(`[analyzeVideo] Failed to generate simulated chapters:`, fallbackErr);
      chapters = getDetailedSimulatedChapters(topicTitle);
    }
  }

  return {
    ...baseContent,
    transcript: transcriptChunks,
    chapters,
    topicSlug,
    videoId,
    generatedAt: new Date().toISOString(),
  };
}