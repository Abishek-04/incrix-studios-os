import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

/**
 * GET /api/youtube?videoId=xxx
 * Fetch YouTube video details (stats, snippet) via YouTube Data API v3
 * Falls back to basic oEmbed data if no API key is configured
 */
export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ success: false, error: 'videoId required' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (apiKey) {
      // Full stats via YouTube Data API v3
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`,
        { next: { revalidate: 300 } } // cache 5 min
      );
      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
      }

      const video = data.items[0];
      return NextResponse.json({
        success: true,
        video: {
          id: videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails?.duration,
          viewCount: parseInt(video.statistics.viewCount || '0'),
          likeCount: parseInt(video.statistics.likeCount || '0'),
          commentCount: parseInt(video.statistics.commentCount || '0'),
          hasFullStats: true,
        },
      });
    } else {
      // Fallback: oEmbed (no API key, but no stats)
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (!res.ok) {
        return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
      }
      const data = await res.json();
      return NextResponse.json({
        success: true,
        video: {
          id: videoId,
          title: data.title,
          channelTitle: data.author_name,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          hasFullStats: false,
        },
      });
    }
  } catch (error) {
    console.error('[youtube] API error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch video data' }, { status: 500 });
  }
}
