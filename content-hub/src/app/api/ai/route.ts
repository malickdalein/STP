import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content, title, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required. Add your OpenAI API key in settings." },
        { status: 400 }
      );
    }

    if (!content && !title) {
      return NextResponse.json(
        { error: "Content or title is required" },
        { status: 400 }
      );
    }

    const textToAnalyze = content || title;
    const truncatedText = textToAnalyze.slice(0, 8000); // Limit for API

    switch (action) {
      case "summarize":
        return await summarize(truncatedText, title, apiKey);
      case "key-points":
        return await extractKeyPoints(truncatedText, title, apiKey);
      case "suggest-tags":
        return await suggestTags(truncatedText, title, apiKey);
      case "full-analysis":
        return await fullAnalysis(truncatedText, title, apiKey);
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: summarize, key-points, suggest-tags, or full-analysis" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes articles and podcasts. Be concise and insightful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function summarize(content: string, title: string, apiKey: string) {
  const prompt = `Summarize the following content in 2-3 concise paragraphs. Focus on the main ideas and key takeaways.

Title: ${title || "Untitled"}

Content:
${content}

Provide a clear, engaging summary that captures the essence of the content.`;

  try {
    const summary = await callOpenAI(prompt, apiKey);
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}

async function extractKeyPoints(content: string, title: string, apiKey: string) {
  const prompt = `Extract 3-5 key points from the following content. Format as a bulleted list.

Title: ${title || "Untitled"}

Content:
${content}

List the most important insights, facts, or arguments:`;

  try {
    const response = await callOpenAI(prompt, apiKey);
    const keyPoints = response
      .split("\n")
      .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("•") || line.trim().match(/^\d+\./))
      .map((line) => line.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    return NextResponse.json({ keyPoints });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract key points" },
      { status: 500 }
    );
  }
}

async function suggestTags(content: string, title: string, apiKey: string) {
  const prompt = `Suggest 3-5 relevant tags for categorizing this content. Tags should be single words or short phrases, lowercase.

Title: ${title || "Untitled"}

Content:
${content}

Return only the tags, one per line, without any additional text or formatting:`;

  try {
    const response = await callOpenAI(prompt, apiKey);
    const tags = response
      .split("\n")
      .map((line) => line.replace(/^[-•#]\s*/, "").trim().toLowerCase())
      .filter((tag) => tag && tag.length > 0 && tag.length < 30)
      .slice(0, 5);

    return NextResponse.json({ tags });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to suggest tags" },
      { status: 500 }
    );
  }
}

async function fullAnalysis(content: string, title: string, apiKey: string) {
  const prompt = `Analyze the following content and provide:
1. A 2-3 sentence summary
2. 3-5 key takeaways (as bullet points)
3. 3-5 suggested tags for categorization (lowercase, single words or short phrases)
4. Estimated reading difficulty (Easy, Medium, Hard)
5. Content type (News, Opinion, Tutorial, Interview, Analysis, Story, etc.)

Title: ${title || "Untitled"}

Content:
${content}

Format your response as JSON:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", ...],
  "tags": ["tag1", "tag2", ...],
  "difficulty": "Easy|Medium|Hard",
  "contentType": "..."
}`;

  try {
    const response = await callOpenAI(prompt, apiKey);

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ analysis });
    }

    return NextResponse.json(
      { error: "Failed to parse AI response" },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze content" },
      { status: 500 }
    );
  }
}
