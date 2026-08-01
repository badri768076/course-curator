// services/ai/video-chatbot.ts
// Video chatbot using Groq API with RAG

import { retrieveContext } from './rag-system';
import { fetchYouTubeTranscript } from '@/services/youtube/transcript';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatbotResponse {
  message: string;
  sources?: string[];
}

/**
 * Initialize chatbot for a video by processing its transcript
 */
export async function initializeVideoChatbot(videoId: string): Promise<void> {
  console.log(`🤖 Initializing chatbot for video: ${videoId}`);
  
  try {
    // Fetch transcript
    const transcriptData = await fetchYouTubeTranscript(videoId);
    
    // Process for RAG
    const { processVideoForRAG } = await import('./rag-system');
    await processVideoForRAG(videoId, transcriptData.fullText);
    
    console.log(`✅ Chatbot initialized for video: ${videoId}`);
  } catch (error) {
    console.error('Error initializing chatbot:', error);
    throw new Error('Failed to initialize video chatbot');
  }
}

/**
 * Send a message to the chatbot
 */
export async function sendChatMessage(
  videoId: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatbotResponse> {
  console.log(`💬 Processing chat message for video: ${videoId}`);
  
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  try {
    // Retrieve relevant context from RAG
    const context = await retrieveContext(videoId, userMessage);
    
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);
    
    // Prepare messages for API
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userMessage },
    ];
    
    // Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // Using Llama 3 70B model
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    
    return {
      message: assistantMessage,
      sources: context ? ['Video Transcript'] : undefined,
    };
  } catch (error) {
    console.error('Error in chatbot:', error);
    throw error;
  }
}

/**
 * Build system prompt with RAG context
 */
function buildSystemPrompt(context: string): string {
  const basePrompt = `You are a helpful AI assistant that answers questions about educational videos. 
You have access to the video's transcript and can provide accurate information based on the content.

Your role:
- Answer questions based on the video content
- Be concise and direct
- If the information is not in the video, say so clearly
- Use examples from the video when relevant
- Maintain a friendly, educational tone`;

  if (context) {
    return `${basePrompt}

Here is the relevant context from the video transcript:
---
${context}
---

Use this context to answer the user's questions accurately.`;
  }
  
  return basePrompt;
}

/**
 * Stream chat response for real-time updates
 */
export async function* streamChatMessage(
  videoId: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): AsyncGenerator<string, void, unknown> {
  console.log(`🔄 Streaming chat response for video: ${videoId}`);
  
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  try {
    // Retrieve relevant context from RAG
    const context = await retrieveContext(videoId, userMessage);
    
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);
    
    // Prepare messages for API
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ];
    
    // Call Groq API with streaming
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${JSON.stringify(error)}`);
    }
    
    // Process streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('Response body is not readable');
    }
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in streaming chatbot:', error);
    throw error;
  }
}
