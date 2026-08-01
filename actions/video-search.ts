// actions/video-search.ts

'use server';

import { searchYouTubeVideos, YouTubeVideo } from '@/services/youtube/search';

export async function searchVideoAction(query: string): Promise<YouTubeVideo[]> {
  if (!query || query.trim() === '') {
    throw new Error('Search query cannot be empty');
  }

  try {
    const results = await searchYouTubeVideos(query, 3);
    return results;
  } catch (error: any) {
    console.error('Failed to search videos:', error);
    throw new Error(error?.message || 'Failed to search videos');
  }
}

export async function getVideoForTopicAction(topicTitle: string, topicDescription: string): Promise<YouTubeVideo | null> {
  try {
    // Search with a combination of title and description for better results
    const searchQuery = `${topicTitle} tutorial lecture`;
    const results = await searchYouTubeVideos(searchQuery, 1);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to get video for topic:', error);
    return null;
  }
}