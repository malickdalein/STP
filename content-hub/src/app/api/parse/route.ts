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
          "Mozilla/5.0 (compatible; ContentHub/1.0; +https://contenthub.app)",
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

    // Standard meta tags
    const metaDescription = extractMeta(html, 'name="description"') || extractMeta(html, "name='description'");
    const metaAuthor = extractMeta(html, 'name="author"') || extractMeta(html, "name='author'");

    // Twitter cards
    const twitterTitle = extractMeta(html, 'name="twitter:title"');
    const twitterDescription = extractMeta(html, 'name="twitter:description"');
    const twitterImage = extractMeta(html, 'name="twitter:image"');

    // Extract article content (simplified)
    const { content, textContent, wordCount } = extractArticleContent(html);

    // Calculate read time
    const wordsPerMinute = 200;
    const readTime = Math.ceil(wordCount / wordsPerMinute);

    return NextResponse.json({
      title: ogTitle || twitterTitle || title || "Untitled",
      description: ogDescription || twitterDescription || metaDescription,
      excerpt: ogDescription || twitterDescription || metaDescription,
      image: ogImage || twitterImage,
      author: metaAuthor,
      content,
      textContent,
      wordCount,
      readTime,
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
