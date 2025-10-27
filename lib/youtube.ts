import { google } from 'googleapis';
import { Resource } from './types';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

/**
 * Fetches educational videos for a given topic from YouTube
 * Returns top 2-3 relevant videos
 */
export async function fetchYouTubeVideos(
  query: string,
  maxResults: number = 10
): Promise<Resource[]> {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: `${query} tutorial`,
      type: ['video'],
      videoDuration: 'medium', // Exclude shorts
      videoDefinition: 'high',
      relevanceLanguage: 'en',
      maxResults,
      order: 'relevance',
    });

    if (!response.data.items || response.data.items.length === 0) {
      return [];
    }

    // Get video details for duration and view count
    const videoIds = response.data.items
      .map(item => item.id?.videoId)
      .filter((id): id is string => !!id);

    const detailsResponse = await youtube.videos.list({
      part: ['contentDetails', 'statistics', 'snippet'],
      id: videoIds,
    });

    const videos = detailsResponse.data.items || [];

    // Filter and score videos
    const scoredVideos = videos
      .map(video => {
        const snippet = video.snippet;
        const statistics = video.statistics;
        const contentDetails = video.contentDetails;

        if (!snippet || !statistics || !contentDetails) return null;

        // Parse duration (ISO 8601 format: PT1H2M30S)
        const duration = parseDuration(contentDetails.duration || '');

        // Filter: minimum 5 minutes, maximum 3 hours
        const durationMinutes = duration.hours * 60 + duration.minutes;
        if (durationMinutes < 5 || durationMinutes > 180) return null;

        // Calculate score
        const viewCount = parseInt(statistics.viewCount || '0', 10);
        const viewScore = Math.log10(Math.max(viewCount, 1)) / 7; // Normalize (log scale, max ~10M views)

        // Prefer recent videos (bonus for last 2 years)
        const publishedDate = new Date(snippet.publishedAt || '');
        const ageYears = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const recencyScore = ageYears < 2 ? 0.1 : 0;

        const totalScore = (0.6) + (viewScore * 0.3) + recencyScore; // Relevance is primary (0.6)

        return {
          video,
          score: totalScore,
          viewCount,
          duration: formatDuration(duration),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Sort by score and take top 2-3
    scoredVideos.sort((a, b) => b.score - a.score);
    const topVideos = scoredVideos.slice(0, 3);

    // Transform to Resource format
    return topVideos.map((item, index) => {
      const video = item.video;
      const snippet = video.snippet!;
      const videoId = video.id!;

      return {
        id: `resource_yt_${index + 1}`,
        type: 'youtube' as const,
        title: snippet.title || 'Untitled Video',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        description: snippet.description?.substring(0, 200) || 'No description available',
        source: snippet.channelTitle || 'Unknown Channel',
        metadata: {
          duration: item.duration,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
          views: formatViewCount(item.viewCount),
          channel: snippet.channelTitle || 'Unknown',
        },
      };
    });
  } catch (error) {
    console.error('YouTube API error:', error);
    throw new Error('Failed to fetch YouTube videos');
  }
}

/**
 * Parses ISO 8601 duration format (PT1H2M30S) to object
 */
function parseDuration(duration: string): { hours: number; minutes: number; seconds: number } {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { hours: 0, minutes: 0, seconds: 0 };

  return {
    hours: parseInt(match[1] || '0', 10),
    minutes: parseInt(match[2] || '0', 10),
    seconds: parseInt(match[3] || '0', 10),
  };
}

/**
 * Formats duration object to readable string (1:23:45 or 23:45)
 */
function formatDuration(duration: { hours: number; minutes: number; seconds: number }): string {
  const parts: string[] = [];

  if (duration.hours > 0) {
    parts.push(duration.hours.toString());
  }

  parts.push(duration.minutes.toString().padStart(duration.hours > 0 ? 2 : 1, '0'));
  parts.push(duration.seconds.toString().padStart(2, '0'));

  return parts.join(':');
}

/**
 * Formats view count to readable string (1.2M, 345K, etc.)
 */
function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}
