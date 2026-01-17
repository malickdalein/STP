"use client";

import { useState } from "react";
import { useContentStore } from "@/store/content-store";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Tag,
  Settings,
  AlertCircle,
  RefreshCw,
  Check,
} from "lucide-react";
import type { ContentItem, Article } from "@/types";

interface AIInsightsPanelProps {
  item: ContentItem;
}

export function AIInsightsPanel({ item }: AIInsightsPanelProps) {
  const { settings, updateSettings, updateAIAnalysis, applyAISuggestedTags, addTagToItem } =
    useContentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.ai.apiKey || "");

  const hasApiKey = !!settings.ai.apiKey;
  const analysis = item.aiAnalysis;
  const isArticle = item.type === "article";
  const article = item as Article;

  const handleAnalyze = async () => {
    if (!settings.ai.apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = isArticle && article.textContent
        ? article.textContent.slice(0, 8000)
        : item.description || item.title;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "full-analysis",
          content,
          apiKey: settings.ai.apiKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze content");
      }

      const data = await response.json();
      // Handle both response formats: { analysis: {...} } or direct properties
      const analysisData = data.analysis || data;
      updateAIAnalysis(item.id, {
        summary: analysisData.summary,
        keyPoints: analysisData.keyPoints,
        suggestedTags: analysisData.tags || analysisData.suggestedTags,
        difficulty: analysisData.difficulty,
        contentType: analysisData.contentType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      updateSettings({
        ai: {
          ...settings.ai,
          apiKey: apiKeyInput.trim(),
        },
      });
      setShowApiKeyInput(false);
    }
  };

  const handleApplyTag = (tag: string) => {
    if (!item.tags.includes(tag)) {
      addTagToItem(item.id, tag);
    }
  };

  const handleApplyAllTags = () => {
    applyAISuggestedTags(item.id);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--surface-raised)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Sparkles className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h3 className="font-display text-sm font-medium text-[var(--ink)]">
              AI Insights
            </h3>
            {analysis?.generatedAt && (
              <p className="text-[11px] text-[var(--ink-muted)]">
                Generated {new Date(analysis.generatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--ink-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--ink-muted)]" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-5 py-5">
          {/* API Key Setup */}
          {showApiKeyInput && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Settings className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    OpenAI API Key Required
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Enter your OpenAI API key to enable AI features. Your key is stored locally.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput.trim()}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">Analysis Failed</p>
                <p className="mt-0.5 text-xs text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* No Analysis Yet */}
          {!analysis && !isLoading && (
            <div className="text-center py-6">
              <Sparkles className="mx-auto h-10 w-10 text-[var(--border-strong)]" />
              <p className="mt-3 text-sm text-[var(--ink-muted)]">
                Get AI-powered insights for this content
              </p>
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Content
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-violet-200" />
                <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-violet-600" />
              </div>
              <p className="mt-4 text-sm font-medium text-[var(--ink)]">
                Analyzing content...
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                This may take a few seconds
              </p>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !isLoading && (
            <div className="space-y-6">
              {/* Summary */}
              {analysis.summary && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Summary
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--ink)]">
                    {analysis.summary}
                  </p>
                </div>
              )}

              {/* Key Points */}
              {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    <span className="font-mono">•</span>
                    Key Points
                  </div>
                  <ul className="space-y-2">
                    {analysis.keyPoints.map((point, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-sm text-[var(--ink)]"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Tags */}
              {analysis.suggestedTags && analysis.suggestedTags.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                      <Tag className="h-3.5 w-3.5" />
                      Suggested Tags
                    </div>
                    <button
                      onClick={handleApplyAllTags}
                      className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-dark)]"
                    >
                      <Check className="h-3 w-3" />
                      Apply All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.suggestedTags.map((tag) => {
                      const isApplied = item.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleApplyTag(tag)}
                          disabled={isApplied}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                            isApplied
                              ? "bg-[var(--sage)]/20 text-[var(--sage-dark)]"
                              : "border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          )}
                        >
                          {isApplied && <Check className="h-3 w-3" />}
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Difficulty Badge */}
              {analysis.difficulty && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    Difficulty
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      analysis.difficulty === "Easy" &&
                        "bg-green-100 text-green-700",
                      analysis.difficulty === "Medium" &&
                        "bg-amber-100 text-amber-700",
                      analysis.difficulty === "Hard" &&
                        "bg-red-100 text-red-700"
                    )}
                  >
                    {analysis.difficulty}
                  </span>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Analysis
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
