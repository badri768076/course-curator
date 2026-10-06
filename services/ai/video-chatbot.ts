// services/ai/video-chatbot.ts
// Video AI chatbot powered by RAG with Gemini, Groq, and intelligent local educational fallback

import {
  processVideoForRAG,
  retrieveContext,
  retrieveRAGChunks,
  synthesizeRAGAnswer,
  ragVectorStore,
} from './rag-system';
import { fetchYouTubeTranscript } from '@/services/youtube/transcript';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

const GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  process.env.NEXT_PUBLIC_GROQ_API_KEY ||
  '';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCitation {
  time: string;
  seconds: number;
  text: string;
}

export interface ChatbotResponse {
  message: string;
  sources?: string[];
  citations?: ChatCitation[];
}

/**
 * Initialize chatbot for a video by fetching and indexing its transcript into RAG
 */
export async function initializeVideoChatbot(videoId: string, topicTitle?: string): Promise<void> {
  if (ragVectorStore.hasVideo(videoId)) {
    return;
  }

  console.log(`🤖 Initializing RAG chatbot for video: ${videoId} (${topicTitle || 'No Title'})`);

  try {
    const transcriptData = await fetchYouTubeTranscript(videoId, topicTitle);
    await processVideoForRAG(videoId, transcriptData.transcript);
    console.log(`✅ Chatbot RAG initialized for video: ${videoId}`);
  } catch (error) {
    console.error('Error initializing chatbot RAG:', error);
    // Even if fetching fails, load fallback so RAG works
    const { generateFallbackTranscript } = await import('@/services/youtube/transcript');
    const fallback = generateFallbackTranscript(videoId, topicTitle);
    await processVideoForRAG(videoId, fallback.transcript);
  }
}

/**
 * Send a message to the chatbot with full RAG context retrieval
 */
export async function sendChatMessage(
  videoId: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  topicTitle?: string
): Promise<ChatbotResponse> {
  console.log(`💬 Processing RAG chat message for video: ${videoId} (${topicTitle || 'No title'})`);

  // 1. Ensure RAG index exists for this video
  if (!ragVectorStore.hasVideo(videoId)) {
    await initializeVideoChatbot(videoId, topicTitle);
  }

  // 2. Retrieve relevant chunks using hybrid search
  const retrievedChunks = await retrieveRAGChunks(videoId, userMessage, 4);
  const context = await retrieveContext(videoId, userMessage, 4);

  const citations: ChatCitation[] = retrievedChunks.map((r) => ({
    time: r.chunk.formattedTime,
    seconds: r.chunk.startSecond,
    text: r.chunk.text.slice(0, 120) + '...',
  }));

  // 3. Attempt Gemini generation if key is provided
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const systemInstruction = buildSystemPrompt(topicTitle, context);

      const historyFormatted = conversationHistory
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
      let assistantText = '';

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const chat = model.startChat({
            history: [
              {
                role: 'user',
                parts: [{ text: `System Instructions: ${systemInstruction}` }],
              },
              {
                role: 'model',
                parts: [{ text: 'Understood. I will act as the dedicated AI Video Tutor for this lesson, grounding my explanations in the video transcript and providing timestamp citations.' }],
              },
              ...historyFormatted,
            ],
          });

          const result = await chat.sendMessage(userMessage);
          assistantText = result.response.text();
          if (assistantText) break;
        } catch (modelErr: any) {
          console.warn(`⚠️ Model ${modelName} attempt failed in video chatbot:`, modelErr?.message || modelErr);
        }
      }

      if (assistantText) {
        return {
          message: assistantText,
          sources: ['Video Lecture Transcript (RAG Indexed)'],
          citations,
        };
      }
    } catch (geminiError: any) {
      console.warn('⚠️ Gemini AI call failed in video chatbot:', geminiError?.message || geminiError);
    }
  }

  // 4. Attempt Groq generation if key is provided
  if (GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')) {
    try {
      const systemPrompt = buildSystemPrompt(topicTitle, context);

      const cleanHistory = conversationHistory
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-8);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...cleanHistory,
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: 0.5,
          max_tokens: 1024,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content;
        if (assistantMessage) {
          return {
            message: assistantMessage,
            sources: ['Video Lecture Transcript (RAG Indexed)'],
            citations,
          };
        }
      } else {
        const errText = await response.text();
        console.warn('⚠️ Groq API returned non-OK status, falling back to RAG synthesis:', errText);
      }
    } catch (llmError) {
      console.warn('⚠️ Groq LLM call error, using RAG synthesizer fallback:', llmError);
    }
  }

  // 5. Intelligent Pedagogical RAG Synthesizer (Zero-crash guarantee)
  const synthesized = synthesizeRAGAnswer(userMessage, retrievedChunks, topicTitle);
  return {
    message: synthesized.reply,
    sources: ['Video Lecture Transcript (RAG Indexed)'],
    citations: synthesized.citations,
  };
}

/**
 * Build system prompt instructing LLM to adhere strictly to retrieved transcript context
 */
function buildSystemPrompt(topicTitle?: string, context?: string): string {
  const base = `You are CourseCurator's AI Tutor and Video Learning Assistant for the lesson: "${topicTitle || 'Video Lecture'}".

Instructions:
1. Base your answers strictly on the video transcript segments provided below.
2. Whenever referencing a point from the video, cite the timestamp in square brackets (e.g. "[02:15]") so the student can jump to that part in the video.
3. Be friendly, structured, concise, and educational. Use markdown formatting, bullet points, or code snippets when helpful.
4. If the student asks something not addressed in the video, explain what the video DOES cover, then provide a helpful answer based on general principles while clearly stating so.`;

  if (context && context.trim().length > 0) {
    return `${base}

=== RETRIEVED VIDEO TRANSCRIPT SEGMENTS (RAG) ===
${context}
==================================================

Answer the student's question using the transcript context above and include timestamp citations.`;
  }

  return base;
}
