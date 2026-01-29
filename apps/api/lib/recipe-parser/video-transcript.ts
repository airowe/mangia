// lib/recipe-parser/video-transcript.ts
// Fetch video transcripts/captions from YouTube and TikTok via RapidAPI

import type { UrlType } from "./types";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const FETCH_TIMEOUT = 5000;

/**
 * Get transcript or caption text from a video URL.
 */
export async function getVideoTranscript(
  url: string,
  type: UrlType,
): Promise<string> {
  switch (type) {
    case "youtube":
      return getYouTubeTranscript(url);
    case "tiktok":
      return getTikTokTranscript(url);
    case "instagram":
      throw new Error(
        "Instagram recipe import is not yet supported. " +
          "Please paste the recipe description manually or use a blog/YouTube URL.",
      );
    default:
      throw new Error(`Unsupported video type: ${type}`);
  }
}

/**
 * Fetch metadata from video oEmbed APIs (no auth required).
 */
export async function fetchVideoMetadata(
  url: string,
  type: UrlType,
): Promise<{ content: string; thumbnailUrl?: string }> {
  switch (type) {
    case "youtube":
      return fetchYouTubeMetadata(url);
    case "tiktok":
      return fetchTikTokMetadata(url);
    case "instagram":
      throw new Error("Instagram recipe import is not yet supported.");
    default:
      throw new Error(`Unsupported video type: ${type}`);
  }
}

// ──────────────────────────────── YouTube ────────────────────────────────

async function getYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  if (!RAPIDAPI_KEY) {
    throw new Error(
      "Video transcript extraction requires API configuration. Try pasting the video description instead.",
    );
  }

  const response = await fetch(
    `https://youtube-transcripts.p.rapidapi.com/youtube/transcript?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "youtube-transcripts.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to get YouTube transcript");
  }

  const data = await response.json();

  if (data.content && Array.isArray(data.content)) {
    return data.content
      .map((segment: { text: string }) => segment.text)
      .join(" ");
  }

  throw new Error("No transcript available for this video");
}

async function fetchYouTubeMetadata(
  url: string,
): Promise<{ content: string; thumbnailUrl?: string }> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const response = await fetch(oembedUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (response.ok) {
    const data = await response.json();
    return {
      content: data.title || "",
      thumbnailUrl: data.thumbnail_url,
    };
  }

  throw new Error("Could not fetch YouTube video metadata.");
}

export function extractYouTubeId(url: string): string | null {
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

// ──────────────────────────────── TikTok ─────────────────────────────────

async function getTikTokTranscript(url: string): Promise<string> {
  if (!RAPIDAPI_KEY) {
    throw new Error(
      "TikTok transcript extraction requires API configuration. Try pasting the video caption instead.",
    );
  }

  let spokenTranscript = "";
  let caption = "";

  // Try spoken transcript (instructions)
  try {
    spokenTranscript = await getTikTokSpokenTranscript(url);
  } catch {
    // Continue to fallback
  }

  // Get video caption (ingredients list)
  try {
    const response = await fetch(
      `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "tiktok-video-no-watermark2.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      },
    );

    if (response.ok) {
      const data = await response.json();
      caption = data.data?.title || data.data?.desc || "";
    }
  } catch {
    // Continue
  }

  // Combine both sources
  if (spokenTranscript && caption) {
    return `VIDEO CAPTION (ingredients):\n${caption}\n\nSPOKEN INSTRUCTIONS:\n${spokenTranscript}`;
  }
  if (spokenTranscript) return spokenTranscript;
  if (caption) return caption;

  throw new Error(
    "Could not get TikTok content. Try pasting the video description instead.",
  );
}

async function getTikTokSpokenTranscript(url: string): Promise<string> {
  const response = await fetch(
    `https://tiktok-video-transcript.p.rapidapi.com/transcribe?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "tiktok-video-transcript.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    },
  );

  if (!response.ok) {
    throw new Error(`Transcript API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Transcript extraction failed");
  }

  if (data.text) return data.text;

  throw new Error("No transcript in response");
}

async function fetchTikTokMetadata(
  url: string,
): Promise<{ content: string; thumbnailUrl?: string }> {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const response = await fetch(oembedUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (response.ok) {
    const data = await response.json();
    return {
      content: data.title || "",
      thumbnailUrl: data.thumbnail_url,
    };
  }

  throw new Error("Could not fetch TikTok video metadata.");
}

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
