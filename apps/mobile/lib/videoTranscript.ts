export type VideoType = 'tiktok' | 'instagram' | 'youtube';

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '';

/**
 * Gets transcript/captions from a video URL
 */
export async function getVideoTranscript(url: string, type: VideoType): Promise<string> {
  switch (type) {
    case 'youtube':
      return await getYouTubeTranscript(url);
    case 'tiktok':
      return await getTikTokTranscript(url);
    case 'instagram':
      return await getInstagramTranscript(url);
    default:
      throw new Error(`Unsupported video type: ${type}`);
  }
}

/**
 * Extracts transcript from YouTube video
 */
async function getYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  if (!RAPIDAPI_KEY) {
    throw new Error('Video transcript extraction requires API configuration. Try pasting the video description instead.');
  }

  try {
    const response = await fetch(
      `https://youtube-transcripts.p.rapidapi.com/youtube/transcript?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'youtube-transcripts.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get YouTube transcript');
    }

    const data = await response.json();

    // Combine transcript segments into single string
    if (data.content && Array.isArray(data.content)) {
      return data.content
        .map((segment: { text: string }) => segment.text)
        .join(' ');
    }

    throw new Error('No transcript available for this video');
  } catch (error) {
    console.error('YouTube transcript error:', error);
    throw new Error('Could not get YouTube transcript. Try pasting the video description instead.');
  }
}

/**
 * Extracts video ID from various YouTube URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/,
    /youtube\.com\/embed\/([^&\s?]+)/,
    /youtube\.com\/v\/([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extracts transcript/description from TikTok video
 * Combines spoken transcript (instructions) with caption (ingredients) for best results
 */
async function getTikTokTranscript(url: string): Promise<string> {
  if (!RAPIDAPI_KEY) {
    throw new Error('TikTok transcript extraction requires API configuration. Try pasting the video caption instead.');
  }

  let spokenTranscript = '';
  let caption = '';

  // Try to get spoken transcript (contains actual instructions)
  try {
    spokenTranscript = await getTikTokSpokenTranscript(url);
    console.log('Got spoken transcript from TikTok:', spokenTranscript.length, 'chars');
  } catch (error) {
    console.log('Spoken transcript not available:', error);
  }

  // Get video caption (usually contains ingredients list)
  try {
    const response = await fetch(
      `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      caption = data.data?.title || data.data?.desc || '';
      console.log('Got caption from TikTok:', caption.length, 'chars');
    }
  } catch (error) {
    console.log('Caption not available:', error);
  }

  // Combine both sources for best recipe extraction
  if (spokenTranscript && caption) {
    return `VIDEO CAPTION (ingredients):\n${caption}\n\nSPOKEN INSTRUCTIONS:\n${spokenTranscript}`;
  }

  if (spokenTranscript) {
    return spokenTranscript;
  }

  if (caption) {
    return caption;
  }

  throw new Error('Could not get TikTok content. Try pasting the video description instead.');
}

/**
 * Gets the spoken transcript from a TikTok video using speech-to-text
 */
async function getTikTokSpokenTranscript(url: string): Promise<string> {
  // Use TikTok Video Transcript API on RapidAPI (GET /transcribe endpoint)
  const response = await fetch(
    `https://tiktok-video-transcript.p.rapidapi.com/transcribe?url=${encodeURIComponent(url)}`,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tiktok-video-transcript.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Transcript API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Transcript extraction failed');
  }

  // API returns { success: true, source: "subtitle", text: "..." }
  if (data.text) {
    return data.text;
  }

  throw new Error('No transcript in response');
}

/**
 * Extracts transcript/description from Instagram Reel
 */
async function getInstagramTranscript(url: string): Promise<string> {
  // Instagram transcript extraction is more complex
  // For MVP, guide user to paste caption manually
  throw new Error(
    'Instagram video import is coming soon. For now, please paste the caption or recipe description.'
  );
}

/**
 * Extracts TikTok video ID from URL
 */
export function extractTikTokId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/t\/(\w+)/,
    /vm\.tiktok\.com\/(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extracts Instagram Reel ID from URL
 */
export function extractInstagramId(url: string): string | null {
  const patterns = [
    /instagram\.com\/reel\/([^/?]+)/,
    /instagram\.com\/p\/([^/?]+)/,
    /instagr\.am\/p\/([^/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
