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

export async function getVideoForTopicAction(
  topicTitle: string,
  topicDescription: string,
  excludeVideoIds: string[] = []
): Promise<YouTubeVideo | null> {
  try {
    const searchQueries = [
      `${topicTitle} tutorial`,
      `${topicTitle} course`,
      `${topicTitle} explanation`,
      topicDescription ? `${topicTitle} ${topicDescription}` : '',
    ].filter(Boolean);

    for (const q of searchQueries) {
      const results = await searchYouTubeVideos(q, 4, excludeVideoIds);
      const candidate = results.find((v) => !excludeVideoIds.includes(v.id));
      if (candidate) return candidate;
    }

    // If all excluded or none found, request with exclusion
    const fallbackResults = await searchYouTubeVideos(`${topicTitle} tutorial`, 1, excludeVideoIds);
    return fallbackResults.length > 0 ? fallbackResults[0] : null;
  } catch (error) {
    console.error('Failed to get video for topic:', error);
    return null;
  }
}