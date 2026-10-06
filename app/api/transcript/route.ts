import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeTranscript } from '@/services/youtube/transcript';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const topicTitle = searchParams.get('topicTitle') || undefined;

  if (!videoId) {
    return NextResponse.json({ error: 'videoId query parameter is required' }, { status: 400 });
  }

  try {
    const data = await fetchYouTubeTranscript(videoId, topicTitle);
    return NextResponse.json({
      videoId: data.videoId,
      fullText: data.fullText,
      transcript: data.transcript,
      isGenerated: !!data.isGenerated,
      count: data.transcript.length,
    });
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}
