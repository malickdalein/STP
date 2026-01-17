import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract basic metadata using regex (lightweight approach)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null;

    // Open Graph meta tags
    const ogTitle = extractMeta(html, 'property="og:title"') || extractMeta(html, "property='og:title'");
    const ogDescription = extractMeta(html, 'property="og:description"') || extractMeta(html, "property='og:description'");
    const ogImage = extractMeta(html, 'property="og:image"') || extractMeta(html, "property='og:image'");
    const ogType = extractMeta(html, 'property="og:type"') || extractMeta(html, "property='og:type'");
    const ogAudio = extractMeta(html, 'property="og:audio"') || extractMeta(html, "property='og:audio'");

    // Standard meta tags
    const metaDescription = extractMeta(html, 'name="description"') || extractMeta(html, "name='description'");
    const metaAuthor = extractMeta(html, 'name="author"') || extractMeta(html, "name='author'");

    // Twitter cards
    const twitterTitle = extractMeta(html, 'name="twitter:title"');
    const twitterDescription = extractMeta(html, 'name="twitter:description"');
    const twitterImage = extractMeta(html, 'name="twitter:image"');

    // Extract podcast/audio information
    const audioData = extractAudioData(html, url);

    // Extract article content (simplified)
    const { content, textContent, wordCount } = extractArticleContent(html);

    // Calculate read time
    const wordsPerMinute = 200;
    const readTime = Math.ceil(wordCount / wordsPerMinute);

    // Detect content type
    const isPodcast = ogType === 'music.song' ||
                      ogType === 'video.episode' ||
                      audioData.audioUrl !== null ||
                      url.includes('podcast') ||
                      url.includes('/episodes/');

    return NextResponse.json({
      title: ogTitle || twitterTitle || title || "Untitled",
      description: ogDescription || twitterDescription || metaDescription,
      excerpt: ogDescription || twitterDescription || metaDescription,
      image: ogImage || twitterImage,
      author: metaAuthor || audioData.author,
      content,
      textContent,
      wordCount,
      readTime,
      // Podcast specific
      audioUrl: audioData.audioUrl || ogAudio,
      duration: audioData.duration,
      podcastName: audioData.podcastName,
      isPodcast,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse URL" },
      { status: 500 }
    );
  }
}

function extractMeta(html: string, attr: string): string | null {
  const regex = new RegExp(`<meta[^>]*${attr}[^>]*content=["']([^"']+)["'][^>]*>`, "i");
  const altRegex = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*${attr}[^>]*>`, "i");
  const match = html.match(regex) || html.match(altRegex);
  return match ? decodeHtmlEntities(match[1]) : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

function extractAudioData(html: string, url: string): {
  audioUrl: string | null;
  duration: number | null;
  podcastName: string | null;
  author: string | null;
} {
  let audioUrl: string | null = null;
  let duration: number | null = null;
  let podcastName: string | null = null;
  let author: string | null = null;

  // Try JSON-LD structured data (most reliable)
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // PodcastEpisode schema
        if (item['@type'] === 'PodcastEpisode' || item['@type'] === 'Episode') {
          audioUrl = item.audio?.contentUrl || item.audio?.url || item.contentUrl || item.url;
          duration = item.duration ? parseDuration(item.duration) : null;
          podcastName = item.partOfSeries?.name || item.associatedMedia?.name;
          author = item.author?.name || item.creator?.name;
        }
        // AudioObject schema
        if (item['@type'] === 'AudioObject') {
          audioUrl = item.contentUrl || item.url;
          duration = item.duration ? parseDuration(item.duration) : null;
        }
        // Check for embedded audio in Article
        if (item['@type'] === 'Article' && item.audio) {
          audioUrl = item.audio.contentUrl || item.audio.url;
        }
      }
    } catch {
      // JSON parse failed, continue
    }
  }

  // Try direct audio tag
  if (!audioUrl) {
    const audioMatch = html.match(/<audio[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (audioMatch) {
      audioUrl = audioMatch[1];
    }

    // Try source inside audio tag
    const audioSourceMatch = html.match(/<audio[^>]*>[\s\S]*?<source[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (audioSourceMatch) {
      audioUrl = audioSourceMatch[1];
    }
  }

  // Try common podcast embed patterns
  if (!audioUrl) {
    // Simplecast
    const simplecastMatch = html.match(/simplecast\.com\/episodes\/([a-zA-Z0-9-]+)/i);
    if (simplecastMatch) {
      // Simplecast requires API call, store episode ID
      audioUrl = `https://cdn.simplecast.com/audio/${simplecastMatch[1]}.mp3`;
    }

    // Transistor
    const transistorMatch = html.match(/share\.transistor\.fm\/e\/([a-zA-Z0-9-]+)/i);
    if (transistorMatch) {
      audioUrl = `https://media.transistor.fm/${transistorMatch[1]}.mp3`;
    }

    // Buzzsprout
    const buzzsproutMatch = html.match(/buzzsprout\.com\/(\d+)\/(\d+)/i);
    if (buzzsproutMatch) {
      audioUrl = `https://www.buzzsprout.com/${buzzsproutMatch[1]}/${buzzsproutMatch[2]}.mp3`;
    }

    // Anchor/Spotify
    const anchorMatch = html.match(/anchor\.fm\/[^/]+\/episodes\/([^/"]+)/i);
    if (anchorMatch) {
      // Anchor embeds need special handling
    }

    // Megaphone
    const megaphoneMatch = html.match(/traffic\.megaphone\.fm\/([A-Z0-9]+)/i);
    if (megaphoneMatch) {
      audioUrl = `https://traffic.megaphone.fm/${megaphoneMatch[1]}.mp3`;
    }

    // Libsyn
    const libsynMatch = html.match(/traffic\.libsyn\.com\/[^/]+\/([^?"]+)/i);
    if (libsynMatch) {
      audioUrl = `https://traffic.libsyn.com/secure/${libsynMatch[1]}`;
    }
  }

  // Try to find audio URL in inline JavaScript/data
  if (!audioUrl) {
    // Look for common patterns
    const audioUrlMatch = html.match(/["'](https?:\/\/[^"']+\.(mp3|m4a|ogg|wav)(\?[^"']*)?)["']/i);
    if (audioUrlMatch) {
      audioUrl = audioUrlMatch[1];
    }

    // Look for enclosure URLs
    const enclosureMatch = html.match(/enclosure[^>]*url=["']([^"']+)["']/i);
    if (enclosureMatch) {
      audioUrl = enclosureMatch[1];
    }
  }

  // Make URL absolute if relative
  if (audioUrl && !audioUrl.startsWith('http')) {
    try {
      const baseUrl = new URL(url);
      audioUrl = new URL(audioUrl, baseUrl.origin).href;
    } catch {
      // URL parsing failed
    }
  }

  return { audioUrl, duration, podcastName, author };
}

function parseDuration(duration: string): number | null {
  // ISO 8601 duration (PT1H30M45S)
  const isoMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0');
    const minutes = parseInt(isoMatch[2] || '0');
    const seconds = parseInt(isoMatch[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Simple seconds
  const secondsMatch = duration.match(/^(\d+)$/);
  if (secondsMatch) {
    return parseInt(secondsMatch[1]);
  }

  // HH:MM:SS or MM:SS
  const timeMatch = duration.match(/(?:(\d+):)?(\d+):(\d+)/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1] || '0');
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseInt(timeMatch[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function extractArticleContent(html: string): { content: string; textContent: string; wordCount: number } {
  // Remove script and style tags
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find article content
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentMatch = cleaned.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  let content = articleMatch?.[1] || mainMatch?.[1] || contentMatch?.[1] || "";

  // If no content found, try to extract body
  if (!content) {
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    content = bodyMatch?.[1] || "";
  }

  // Clean up the content
  content = content
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, "");

  // Extract plain text for word count
  const textContent = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  return { content, textContent, wordCount };
}
