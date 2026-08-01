// services/ai/video-analyzer.ts

import { VideoAnalysisResult } from '@/types/video-analysis';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// ── Groq API Client ──
async function callGroqAPI(prompt: string, model: string = 'mixtral-8x7b-32768'): Promise<string> {
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
          content: 'You are an expert educator. Return ONLY valid JSON, no markdown, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function analyzeVideo(
  topicSlug: string,
  topicTitle: string,
  videoId: string
): Promise<VideoAnalysisResult> {
  console.log(`🔍 Analyzing video for: "${topicTitle}" (${videoId})`);

  // Try to get real transcript
  let transcript = await getTranscript(videoId);
  
  // If we have transcript and Groq is available, do real analysis
  if (transcript && GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')) {
    try {
      console.log(`📝 Transcript found (${transcript.length} chars), analyzing with Groq...`);
      const analysis = await analyzeTranscriptWithGroq(transcript, topicTitle);
      return {
        ...analysis,
        topicSlug,
        videoId,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Groq analysis failed:', error);
    }
  }

  // If we have transcript but no AI, use transcript-based mock
  if (transcript) {
    console.log(`📝 Using transcript-based mock analysis`);
    return getTranscriptBasedMock(topicSlug, topicTitle, transcript);
  }

  // Final fallback: full mock analysis
  console.log(`🎭 Using full mock analysis for "${topicTitle}"`);
  return getMockAnalysis(topicSlug, topicTitle, videoId);
}

// ── ANALYZE TRANSCRIPT WITH GROQ ──
async function analyzeTranscriptWithGroq(
  transcript: string,
  topicTitle: string
): Promise<VideoAnalysisResult> {
  const prompt = `
You are an expert educator. Analyze this video transcript and generate learning content.

Topic: ${topicTitle}

Transcript (first 5000 chars): ${transcript.slice(0, 5000)}

Return ONLY valid JSON:
{
  "summary": [
    { "emoji": "📌", "heading": "Key Point", "detail": "Explanation" }
  ],
  "chapters": [
    { "title": "Chapter", "startTime": 0, "endTime": 120, "summary": "Overview", "keyPoints": ["Point"] }
  ],
  "quiz": [
    {
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "The answer is...",
      "difficulty": "medium"
    }
  ],
  "eli5": "Simple explanation",
  "keyConcepts": ["Concept 1", "Concept 2"],
  "vocabulary": [
    { "term": "Term", "definition": "Definition" }
  ]
}`;

  try {
    const result = await callGroqAPI(prompt);
    
    let cleaned = result.trim();
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    cleaned = cleaned.trim();
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      topicSlug: '',
      videoId: '',
      generatedAt: new Date().toISOString(),
      summary: parsed.summary || [],
      transcript: [{ text: transcript, startTime: 0, endTime: 0 }],
      chapters: parsed.chapters || [],
      quiz: parsed.quiz || [],
      mindmap: { nodes: [], edges: [] },
      flowchart: { nodes: [], edges: [] },
      eli5: parsed.eli5 || '',
      keyConcepts: parsed.keyConcepts || [],
      vocabulary: parsed.vocabulary || [],
    };
  } catch (error) {
    console.error('Failed to analyze transcript with Groq:', error);
    throw error;
  }
}

// ── GET TRANSCRIPT ──
async function getTranscript(videoId: string): Promise<string | null> {
  if (videoId.startsWith('mock_') || videoId.length !== 11) {
    return null;
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    
    if (!response.ok) {
      return null;
    }

    return null;
    
  } catch (error) {
    console.error('Failed to get transcript:', error);
    return null;
  }
}

// ── TRANSCRIPT-BASED MOCK ──
function getTranscriptBasedMock(
  topicSlug: string,
  topicTitle: string,
  transcript: string
): VideoAnalysisResult {
  const words = transcript.split(' ').slice(0, 100);
  const summary = `This video covers ${topicTitle}. Key topics include: ${words.join(' ')}...`;
  
  return {
    topicSlug,
    videoId: '',
    generatedAt: new Date().toISOString(),
    summary: [
      { emoji: '📌', heading: `Introduction to ${topicTitle}`, detail: summary.slice(0, 150) },
      { emoji: '🔑', heading: 'Key Concepts', detail: `Core concepts of ${topicTitle} explained in detail.` },
      { emoji: '💡', heading: 'Practical Applications', detail: `Real-world applications of ${topicTitle}.` },
    ],
    transcript: [{ text: transcript, startTime: 0, endTime: 0 }],
    chapters: [
      { title: 'Introduction', startTime: 0, endTime: 120, summary: 'Overview', keyPoints: ['What', 'Why'] },
      { title: 'Core Concepts', startTime: 120, endTime: 300, summary: 'Deep dive', keyPoints: ['Concept 1', 'Concept 2'] },
    ],
    quiz: [
      {
        question: `What is ${topicTitle}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswerIndex: 0,
        explanation: `The correct answer is based on the video content.`,
        difficulty: 'medium',
      },
      {
        question: `Which is a key concept of ${topicTitle}?`,
        options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
        correctAnswerIndex: 0,
        explanation: 'This concept is fundamental.',
        difficulty: 'medium',
      },
    ],
    mindmap: {
      nodes: [
        { id: 'root', slug: topicSlug, label: topicTitle, type: 'root' },
        { id: 'node1', slug: 'concept1', label: 'Concept 1', type: 'topic', parentId: 'root' },
        { id: 'node2', slug: 'concept2', label: 'Concept 2', type: 'topic', parentId: 'root' },
      ],
      edges: [
        { id: 'e1', source: 'root', target: 'node1' },
        { id: 'e2', source: 'root', target: 'node2' },
      ],
    },
    flowchart: {
      nodes: [
        { id: 'start', label: 'Start', type: 'start' },
        { id: 'p1', label: 'Step 1', type: 'process' },
        { id: 'p2', label: 'Step 2', type: 'process' },
        { id: 'end', label: 'End', type: 'end' },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'p1' },
        { id: 'e2', source: 'p1', target: 'p2' },
        { id: 'e3', source: 'p2', target: 'end' },
      ],
    },
    eli5: `${topicTitle} explained simply: Imagine it's like...`,
    keyConcepts: [`${topicTitle} Basics`, 'Core Principles', 'Practical Applications'],
    vocabulary: [
      { term: 'Term 1', definition: 'Definition 1' },
      { term: 'Term 2', definition: 'Definition 2' },
    ],
  };
}

// ── FULL MOCK ANALYSIS (same as before) ──
function getMockAnalysis(
  topicSlug: string,
  topicTitle: string,
  videoId: string
): VideoAnalysisResult {
  // ... (same mock data as before)
  // Keep the same mock analysis function from previous version
  const isReact = topicTitle.toLowerCase().includes('react') || topicSlug.includes('react');
  const isPython = topicTitle.toLowerCase().includes('python') || topicSlug.includes('python');
  const isJS = topicTitle.toLowerCase().includes('javascript') || topicSlug.includes('javascript');
  const isML = topicTitle.toLowerCase().includes('machine learning') || topicSlug.includes('machine');
  
  let specificContent: any = null;
  
  if (isReact) {
    specificContent = {
      summary: [
        { emoji: '🚀', heading: 'What is React?', detail: 'React is a JavaScript library for building user interfaces.' },
        { emoji: '⚛️', heading: 'Components', detail: 'React applications are built from reusable components.' },
        { emoji: '🔄', heading: 'Virtual DOM', detail: 'React uses a virtual DOM for efficient updates.' },
      ],
      quiz: [
        {
          question: 'What is React?',
          options: ['A library for building UIs', 'A programming language', 'A database', 'A CSS framework'],
          correctAnswerIndex: 0,
          explanation: 'React is a JavaScript library for building user interfaces.',
          difficulty: 'easy',
        },
        {
          question: 'What is JSX?',
          options: ['JavaScript XML', 'Java XML', 'JSON', 'CSS'],
          correctAnswerIndex: 0,
          explanation: 'JSX is a syntax extension that allows HTML-like code in JavaScript.',
          difficulty: 'medium',
        },
      ],
      eli5: `${topicTitle} explained simply: It's like building with LEGO blocks!`,
      keyConcepts: ['Components', 'Props', 'State', 'Hooks'],
      vocabulary: [
        { term: 'Component', definition: 'A reusable piece of UI' },
        { term: 'State', definition: 'Data that changes over time' },
      ],
    };
  } else if (isPython) {
    specificContent = {
      summary: [
        { emoji: '🐍', heading: 'Python Basics', detail: 'Python is a high-level programming language.' },
        { emoji: '📊', heading: 'Data Types', detail: 'Python supports integers, floats, strings, and booleans.' },
      ],
      quiz: [
        {
          question: 'What is Python?',
          options: ['A programming language', 'A database', 'A CSS framework', 'A video game'],
          correctAnswerIndex: 0,
          explanation: 'Python is a high-level programming language.',
          difficulty: 'easy',
        },
      ],
      eli5: `${topicTitle} explained simply: Python helps you tell computers what to do!`,
      keyConcepts: ['Variables', 'Functions', 'Data Types'],
      vocabulary: [
        { term: 'Variable', definition: 'A container for storing data' },
        { term: 'Function', definition: 'A block of reusable code' },
      ],
    };
  } else if (isJS) {
    specificContent = {
      summary: [
        { emoji: '📜', heading: 'JavaScript Basics', detail: 'JavaScript is a programming language for the web.' },
        { emoji: '🎯', heading: 'DOM Manipulation', detail: 'JavaScript can manipulate HTML elements dynamically.' },
      ],
      quiz: [
        {
          question: 'What is JavaScript?',
          options: ['A programming language', 'A database', 'A CSS framework', 'A video game'],
          correctAnswerIndex: 0,
          explanation: 'JavaScript is a programming language for the web.',
          difficulty: 'easy',
        },
      ],
      eli5: `${topicTitle} explained simply: JavaScript makes websites interactive!`,
      keyConcepts: ['Variables', 'Functions', 'DOM'],
      vocabulary: [
        { term: 'DOM', definition: 'Document Object Model' },
        { term: 'Event', definition: 'An action on a webpage' },
      ],
    };
  } else if (isML) {
    specificContent = {
      summary: [
        { emoji: '🧠', heading: 'Machine Learning Basics', detail: 'ML enables systems to learn from data.' },
        { emoji: '📊', heading: 'Types of ML', detail: 'Supervised, Unsupervised, and Reinforcement Learning.' },
      ],
      quiz: [
        {
          question: 'What is Machine Learning?',
          options: ['A subset of AI', 'A programming language', 'A database', 'A CSS framework'],
          correctAnswerIndex: 0,
          explanation: 'Machine Learning is a subset of AI.',
          difficulty: 'easy',
        },
      ],
      eli5: `${topicTitle} explained simply: It\'s like teaching a computer to recognize patterns!`,
      keyConcepts: ['Supervised Learning', 'Unsupervised Learning'],
      vocabulary: [
        { term: 'Algorithm', definition: 'A set of rules for solving a problem' },
        { term: 'Model', definition: 'A trained system that makes predictions' },
      ],
    };
  }

  const defaultContent = {
    summary: [
      { emoji: '📌', heading: `Introduction to ${topicTitle}`, detail: `This topic covers the fundamentals of ${topicTitle}.` },
      { emoji: '🔑', heading: 'Key Concepts', detail: `Core ideas and principles of ${topicTitle}.` },
      { emoji: '💡', heading: 'Practical Applications', detail: `Real-world use cases of ${topicTitle}.` },
    ],
    quiz: [
      {
        question: `What is ${topicTitle}?`,
        options: ['A technology', 'A concept', 'A tool', 'All of the above'],
        correctAnswerIndex: 0,
        explanation: `${topicTitle} is a technology/concept in its domain.`,
        difficulty: 'medium',
      },
    ],
    eli5: `${topicTitle} explained simply: It's a way to do things better!`,
    keyConcepts: ['Concept A', 'Concept B', 'Concept C'],
    vocabulary: [
      { term: 'Term 1', definition: 'Definition 1' },
      { term: 'Term 2', definition: 'Definition 2' },
    ],
  };

  const content = specificContent || defaultContent;

  return {
    topicSlug,
    videoId,
    generatedAt: new Date().toISOString(),
    summary: content.summary,
    transcript: [{ text: `This is a transcript for ${topicTitle}.`, startTime: 0, endTime: 0 }],
    chapters: [
      { title: 'Introduction', startTime: 0, endTime: 120, summary: 'Overview', keyPoints: ['What', 'Why'] },
      { title: 'Core Concepts', startTime: 120, endTime: 300, summary: 'Deep dive', keyPoints: ['Concept 1', 'Concept 2'] },
    ],
    quiz: content.quiz,
    mindmap: {
      nodes: [
        { id: 'root', slug: topicSlug, label: topicTitle, type: 'root' },
        { id: 'node1', slug: 'concept1', label: 'Concept 1', type: 'topic', parentId: 'root' },
        { id: 'node2', slug: 'concept2', label: 'Concept 2', type: 'topic', parentId: 'root' },
      ],
      edges: [
        { id: 'e1', source: 'root', target: 'node1' },
        { id: 'e2', source: 'root', target: 'node2' },
      ],
    },
    flowchart: {
      nodes: [
        { id: 'start', label: 'Start', type: 'start' },
        { id: 'p1', label: 'Step 1', type: 'process' },
        { id: 'p2', label: 'Step 2', type: 'process' },
        { id: 'end', label: 'End', type: 'end' },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'p1' },
        { id: 'e2', source: 'p1', target: 'p2' },
        { id: 'e3', source: 'p2', target: 'end' },
      ],
    },
    eli5: content.eli5,
    keyConcepts: content.keyConcepts,
    vocabulary: content.vocabulary,
  };
}