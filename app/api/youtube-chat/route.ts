import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage } from '@/services/ai/video-chatbot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, messages, message, topicTitle } = body;

    // Allow videoId to be optional for course-level tutoring
    const activeVideoId = videoId || 'course-overview';

    // Extract the latest user message
    let userQuery = '';
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (typeof message === 'string' && message.trim()) {
      userQuery = message.trim();
    } else if (Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      userQuery = lastMsg?.content || '';

      conversationHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content || '',
      }));
    }

    if (!userQuery) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Call RAG-augmented chatbot engine
    const response = await sendChatMessage(
      activeVideoId,
      userQuery,
      conversationHistory,
      topicTitle
    );

    return NextResponse.json({
      reply: response.message,
      citations: response.citations || [],
      sources: response.sources || ['Video Transcript'],
    });
  } catch (error: any) {
    console.error('Error in youtube-chat RAG API:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        reply: 'I encountered an issue processing the video transcript. Please try again.',
      },
      { status: 500 }
    );
  }
}
