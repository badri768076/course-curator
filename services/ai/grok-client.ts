import { Course, Chapter, TopicNode, MindmapNode, MindmapEdge } from '@/types/ai-output';
import { slugify } from '@/lib/utils';
import { env } from '@/config/env';

// Helper to avoid rate limiting
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ---------- NEW: Robust YouTube search using official API ----------
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

async function getEducationalYouTubeVideo(query: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn("YouTube API key missing");
    return null;
  }

  const searchUrl = "https://www.googleapis.com/youtube/v3/search";
  const params = new URLSearchParams({
    part: "snippet",
    maxResults: "5",
    q: query,
    type: "video",
    videoEmbeddable: "true",
    videoCaption: "closedCaption",
    relevanceLanguage: "en",
    regionCode: "US",
    key: YOUTUBE_API_KEY,
  });

  try {
    const response = await fetch(`${searchUrl}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error:", data.error?.message);
      return null;
    }

    if (!data.items || data.items.length === 0) return null;

    // Filter out obvious music/entertainment
    const filtered = data.items.filter((item: any) => {
      const title = item.snippet.title.toLowerCase();
      const channel = item.snippet.channelTitle.toLowerCase();
      return !/music|song|lyrics|official video|audio|vevo|trailer|movie|clip|concert/i.test(title + " " + channel);
    });

    if (filtered.length === 0) return null;

    // Return the first non-music video – no extra embed check
    return filtered[0].id.videoId;
  } catch (err) {
    console.error("YouTube search fetch error:", err);
    return null;
  }
}

/**
 * Get a video for a given topic – tries exact query, then broader, then fallback.
 */
async function getVideoForTopic(topicTitle: string, courseTitle: string): Promise<string> {
  // Build a highly specific query
  let query = `${topicTitle} ${courseTitle} tutorial educational lecture`.trim();
  let videoId = await getEducationalYouTubeVideo(query);
  
  if (!videoId) {
    // Broader fallback: "introduction to [topic]"
    query = `introduction to ${topicTitle} tutorial`;
    videoId = await getEducationalYouTubeVideo(query);
  }
  
  if (!videoId) {
    // Ultimate fallback: a generic "how to learn" video or a course-specific placeholder
    // Instead of random unrelated videos, use a curated set based on topic category
    const fallbackVideos: Record<string, string> = {
      java: "eIrMbAQSU34",      // Java Full Course (Mosh) – you already saw this works
      javascript: "W6NZfCO5SIk",
      python: "_uQrJ0TkZlc",
      dsa: "8hly31xKli0",
      default: "5MgBikgcWnY",
    };
    let key = "default";
    const lower = (courseTitle + " " + topicTitle).toLowerCase();
    if (lower.includes("java") && !lower.includes("javascript")) key = "java";
    else if (lower.includes("javascript") || lower.includes("js")) key = "javascript";
    else if (lower.includes("python")) key = "python";
    else if (lower.includes("algorithm") || lower.includes("dsa")) key = "dsa";
    videoId = fallbackVideos[key];
  }
  
  return videoId;
}

// Pre-curated, rich mock courses for immediate deployment and demo
const MOCK_COURSES: Record<string, Omit<Course, 'id' | 'createdAt' | 'mindmap'>> = {
  'quantum-computing-foundations': {
    title: 'Quantum Computing Foundations',
    slug: 'quantum-computing-foundations',
    description: 'An introductory guide to quantum mechanics, qubits, quantum gates, and foundational algorithms.',
    chapters: [
      {
        title: 'Introduction to Qubits',
        slug: 'introduction-to-qubits',
        topics: [
          {
            title: 'What is a Qubit?',
            slug: 'what-is-a-qubit',
            videoUrl: 'g_IaVepNDT4', // YouTube Video ID
            duration: 480,
            content: `
# What is a Qubit?

In classical computing, the basic unit of information is the **bit**, which can exist in one of two states: **0** or **1**. 

In quantum computing, the fundamental unit of information is the **qubit** (quantum bit). Unlike a classical bit, a qubit can exist in a state of **superposition**, representing both 0 and 1 simultaneously until it is measured.

## Key Properties of Qubits

1. **Superposition**: Mathematically, a qubit is represented as a linear combination of two basis states $|0\\rangle$ and $|1\\rangle$:
   $$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$$
   where $\\alpha$ and $\\beta$ are complex numbers representing probability amplitudes, satisfying $|\\alpha|^2 + |\\beta|^2 = 1$.

2. **Entanglement**: A unique quantum phenomenon where two or more qubits become connected such that the state of one instantly influences the state of another, no matter how far apart they are.

3. **Measurement**: When a qubit is measured, its superposition collapses into one of the basis states ($|0\\rangle$ or $|1\\rangle$) with probabilities $|\\alpha|^2$ and $|\\beta|^2$ respectively.

## Conceptual Differences
| Feature | Classical Bit | Quantum Qubit |
|---|---|---|
| Basic States | 0 or 1 | Superposition of $|0\\rangle$ and $|1\\rangle$ |
| Operations | Boolean Logic Gates | Unitary Transformations (Rotations) |
| Correlation | Independent | Can be Entangled |
            `,
            quiz: [
              {
                id: 'q1',
                question: 'Which equation represents the state of a qubit in superposition?',
                options: [
                  '|ψ⟩ = α|0⟩ - β|1⟩ where α² + β² = 0',
                  '|ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1',
                  '|ψ⟩ = 0 or 1',
                  '|ψ⟩ = α + β'
                ],
                correctAnswerIndex: 1,
                explanation: 'A qubit is represented as a linear combination of |0⟩ and |1⟩ where the sum of the absolute squares of the amplitudes equals 1.'
              },
              {
                id: 'q2',
                question: 'What happens to a qubit in superposition when it is measured?',
                options: [
                  'It remains in superposition.',
                  'It doubles its state.',
                  'It collapses into one of the basis states (0 or 1).',
                  'It turns into a classical bit permanently.'
                ],
                correctAnswerIndex: 2,
                explanation: 'Measurement forces the quantum system to collapse from a probability distribution into a single definitive state.'
              }
            ]
          },
          {
            title: 'Bloch Sphere Visualization',
            slug: 'bloch-sphere-visualization',
            videoUrl: '4T20PFC_fT0',
            duration: 620,
            content: `
# Bloch Sphere Visualization

The **Bloch Sphere** is a geometrical representation of the pure state space of a two-level quantum mechanical system (a qubit).

## Spherical Coordinates
Any pure state $|\\psi\\rangle$ of a qubit can be written as:
$$|\\psi\\rangle = \\cos(\\theta/2)|0\\rangle + e^{i\\phi}\\sin(\\theta/2)|1\\rangle$$

Where:
- $\\theta$ (colatitude) determines the probability of measuring $|0\\rangle$ or $|1\\rangle$.
- $\\phi$ (longitude) represents the relative quantum phase.

## Visualizing States on the Sphere
- The **North Pole** corresponds to the state $|0\\rangle$.
- The **South Pole** corresponds to the state $|1\\rangle$.
- The **Equator** contains states with equal probability of collapsing to $|0\\rangle$ or $|1\\rangle$ but different phases, such as:
  - $|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$ along the x-axis.
  - $|-\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)$ along the negative x-axis.
            `,
            quiz: [
              {
                id: 'q3',
                question: 'What state is represented by the North Pole on the Bloch Sphere?',
                options: ['The state |1⟩', 'The state |0⟩', 'The superposition state |+⟩', 'The state |i⟩'],
                correctAnswerIndex: 1,
                explanation: 'By mathematical convention, the North Pole representing θ = 0 corresponds to the ground state |0⟩.'
              }
            ]
          }
        ]
      },
      {
        title: 'Quantum Gates',
        slug: 'quantum-gates',
        topics: [
          {
            title: 'The Hadamard Gate',
            slug: 'the-hadamard-gate',
            videoUrl: '78TfMee13d8',
            duration: 450,
            content: `
# The Hadamard Gate

The **Hadamard Gate (H-gate)** is a single-qubit operation that mapped the basis states to superposition states. It acts as the "creator of superposition."

## Mathematical Representation
The H-gate is represented by the matrix:
$$H = \\frac{1}{\\sqrt{2}} \\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}$$

## Operations
- $H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = |+\\rangle$
- $H|1\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}} = |-\\rangle$

Applying the H-gate twice brings the qubit back to its original state ($H \\cdot H = I$).
            `,
            quiz: [
              {
                id: 'q4',
                question: 'What is the matrix multiplier of the Hadamard Gate?',
                options: ['1 / √2', '1 / 2', '1', 'i'],
                correctAnswerIndex: 0,
                explanation: 'The scaling factor is 1/√2 to maintain the normalization of probability amplitudes.'
              }
            ]
          },
          {
            title: 'Pauli Gates (X, Y, Z)',
            slug: 'pauli-gates',
            videoUrl: 'O238S0N2280',
            duration: 500,
            content: `
# Pauli Gates (X, Y, Z)

The Pauli gates represent basic rotations around the principal axes of the Bloch Sphere.

- **Pauli-X Gate**: The quantum equivalent of the classical NOT gate. It flips $|0\\rangle$ to $|1\\rangle$ and vice-versa.
  $$X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$$
- **Pauli-Y Gate**: Rotates the qubit around the Y-axis.
  $$Y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}$$
- **Pauli-Z Gate**: Flips the phase of the $|1\\rangle$ state while leaving $|0\\rangle$ unchanged.
  $$Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$$
            `,
            quiz: [
              {
                id: 'q5',
                question: 'Which Pauli gate acts as a quantum NOT gate?',
                options: ['Pauli-Z', 'Pauli-Y', 'Pauli-X', 'Hadamard'],
                correctAnswerIndex: 2,
                explanation: 'The Pauli-X gate flips the amplitudes of the |0⟩ and |1⟩ states, representing a quantum NOT operation.'
              }
            ]
          }
        ]
      }
    ]
  },
  'react-native-app-development': {
    title: 'React Native App Development',
    slug: 'react-native-app-development',
    description: 'Learn to build native cross-platform mobile apps for iOS and Android using React and JavaScript.',
    chapters: [
      {
        title: 'Core Components and Layout',
        slug: 'core-components-layout',
        topics: [
          {
            title: 'Views, Texts, and Images',
            slug: 'views-texts-images',
            videoUrl: 'gVKvgHw-45M',
            duration: 750,
            content: `
# Views, Texts, and Images

React Native uses native UI components instead of standard HTML elements.

## Basic Building Blocks
1. **View**: Equivalent to a \`<div>\`, used for layout and container styling using Flexbox.
2. **Text**: Equivalent to \`<p>\` or \`<span>\`. All text must be wrapped inside a \`<Text>\` component.
3. **Image**: Used to render local assets or remote URLs.

\`\`\`javascript
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello HackArena!</Text>
      <Image 
        source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }} 
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logo: {
    width: 50,
    height: 50,
    marginTop: 10,
  }
});
\`\`\`
            `,
            quiz: [
              {
                id: 'rn1',
                question: 'Which component is the equivalent of a <div> in React Native?',
                options: ['<Container>', '<View>', '<Div>', '<Layout>'],
                correctAnswerIndex: 1,
                explanation: 'The <View> component is the fundamental container element in React Native.'
              }
            ]
          },
          {
            title: 'Flexbox Layout Engine',
            slug: 'flexbox-layout-engine',
            videoUrl: 'hD7X1Nn8J8c',
            duration: 880,
            content: `
# Flexbox Layout Engine

React Native uses Flexbox for positioning elements.

## Key Differences from Web CSS
- **flexDirection**: Defaults to \`column\` instead of \`row\`.
- **flex**: Accepts a single number indicating the proportion of space.
- All dimensions are unitless (representing density-independent pixels).
            `,
            quiz: [
              {
                id: 'rn2',
                question: 'What is the default flexDirection in React Native?',
                options: ['row', 'column', 'row-reverse', 'grid'],
                correctAnswerIndex: 1,
                explanation: 'Unlike CSS on the web, React Native layout defaults flexDirection to column.'
              }
            ]
          }
        ]
      }
    ]
  }
};

// Generates coordinates for a beautiful star network layout
function generateMindmap(courseSlug: string, chapters: Chapter[]): Course['mindmap'] {
  const nodes: MindmapNode[] = [];
  const edges: MindmapEdge[] = [];
  
  const centerX = 400;
  const centerY = 280;
  
  // 1. Add Root Node
  const rootId = 'root';
  nodes.push({
    id: rootId,
    label: courseSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    x: centerX,
    y: centerY,
    type: 'root',
    completed: false
  });
  
  const numChapters = chapters.length;
  chapters.forEach((chapter, chIdx) => {
    // 2. Add Chapter Nodes in a circle around root
    const chAngle = (chIdx * 2 * Math.PI) / numChapters;
    const chRadius = 140;
    const chX = Math.round(centerX + chRadius * Math.cos(chAngle));
    const chY = Math.round(centerY + chRadius * Math.sin(chAngle));
    const chId = `ch-${chapter.slug}`;
    
    nodes.push({
      id: chId,
      label: chapter.title,
      x: chX,
      y: chY,
      type: 'chapter',
      completed: false
    });
    
    edges.push({ from: rootId, to: chId });
    
    // 3. Add Topic Nodes clustered around their chapters
    const numTopics = chapter.topics.length;
    chapter.topics.forEach((topic, topIdx) => {
      // Sub-orbits around chapter node
      const topAngle = chAngle - 0.5 + (topIdx * 1.0) / (numTopics > 1 ? numTopics - 1 : 1);
      const topRadius = 85;
      const topX = Math.round(chX + topRadius * Math.cos(topAngle));
      const topY = Math.round(chY + topRadius * Math.sin(topAngle));
      const topId = `top-${topic.slug}`;
      
      nodes.push({
        id: topId,
        label: topic.title,
        x: topX,
        y: topY,
        type: 'topic',
        slug: topic.slug,
        completed: false
      });
      
      edges.push({ from: chId, to: topId });
    });
  });
  
  return { nodes, edges };
}


export async function generateCourseOutline(topic: string): Promise<Course> {
  const normalizedTopic = slugify(topic);
  
  // Check if we have pre-curated data
  let courseData = MOCK_COURSES[normalizedTopic];
  
  if (!courseData) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
        });

        const prompt = `
You are an expert curriculum designer. Generate a structured course outline for a topic titled "${topic}".
The course is for school children and undergraduate students.
Return ONLY valid JSON matching this exact schema:
{
  "title": "String (Course Title)",
  "description": "String (1-2 sentence description)",
  "chapters": [
    {
      "title": "String (Chapter Title)",
      "topics": [
        {
          "title": "String (Topic Title)",
          "content": "String (Markdown content explaining the topic fundamentals briefly)"
        }
      ]
    }
  ]
}
Include 2-3 chapters, each with 2-3 topics. Make the content educational and accurate.
`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        // Add slugs, dummy durations and search for youtube videos
        parsed.slug = normalizedTopic;
        for (const chapter of parsed.chapters) {
          chapter.slug = slugify(chapter.title);
          for (const t of chapter.topics) {
            t.slug = slugify(t.title);
            t.duration = Math.floor(Math.random() * 300) + 300;
            t.quiz = []; // mock quiz structure
            
            // *** FIXED: use our robust video search ***
            const videoId = await getVideoForTopic(t.title, parsed.title);
            t.videoUrl = videoId;
            await delay(800); // respect rate limits
          }
        }
        
        courseData = parsed as Omit<Course, 'id' | 'createdAt' | 'mindmap'>;
      } catch (e) {
        console.error("Failed to generate course outline via AI:", e);
      }
    }

    if (!courseData) {
      // Dynamically generate a simple structure for custom topics so the app never fails if API fails or is missing
      const title = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      // Use the robust search instead of old youtubeSearch
      let videoId = await getVideoForTopic(title, title);
  
      courseData = {
        title,
        slug: normalizedTopic,
        description: `Learn everything about ${title} with our structured curriculum.`,
        chapters: [
          {
            title: `Getting Started with ${title}`,
            slug: 'getting-started',
            topics: [
              {
                title: `Core Fundamentals of ${title}`,
                slug: 'core-fundamentals',
                videoUrl: videoId,
                duration: 300,
                content: `
  # Core Fundamentals of ${title}
  
  Welcome to the introduction section of ${title}! 
  
  This lesson covers the primary building blocks and key considerations when working in this domain.
  
  ## Key Pillars
  - **Efficiency:** Streamlined workflows.
  - **Design:** Modern layouts and visual systems.
  - **Scale:** Adapting components for enterprise growth.
  
  Stay tuned for the follow-up interactive quizzes!
                `,
                quiz: [
                  {
                    id: 'c1',
                    question: `What is the primary focus of ${title}?`,
                    options: ['Speed & Performance', 'Simplification & UX', 'Advanced Algorithms', 'All of the above'],
                    correctAnswerIndex: 3,
                    explanation: `In this domain, balancing speed, simplified user experience, and robust architectural algorithms are crucial for success.`
                  }
                ]
              }
            ]
          }
        ]
      };
    }
  }
  
  const courseId = `c_${Math.random().toString(36).substr(2, 9)}`;
  const mindmap = generateMindmap(courseData.slug, courseData.chapters);
  
  return {
    id: courseId,
    title: courseData.title,
    slug: courseData.slug,
    description: courseData.description,
    chapters: courseData.chapters,
    mindmap,
    createdAt: new Date().toISOString(),
  };
}
