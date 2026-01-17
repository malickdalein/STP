"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useContentStore } from "@/store/content-store";
import { formatDate, getDomain, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Star,
  Archive,
  ExternalLink,
  Clock,
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import type { Article, PodcastEpisode } from "@/types";
import { AIInsightsPanel } from "./ai-insights-panel";

export function ReaderView() {
  const { items, selectedItemId, setSelectedItem, toggleFavorite, toggleArchive, updateProgress, settings } =
    useContentStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const item = items.find((i) => i.id === selectedItemId);

  const handleScroll = useCallback(() => {
    if (!contentRef.current || !item || item.type !== "article") return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const progress = Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100);

    if (progress > (item.progress || 0)) {
      updateProgress(item.id, progress);
    }
  }, [item, updateProgress]);

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener("scroll", handleScroll);
      return () => content.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[var(--paper-warm)] text-[var(--ink-muted)]">
        <BookOpen className="h-16 w-16 opacity-20" />
        <p className="mt-6 font-display text-lg">Select something to read</p>
        <p className="mt-1 text-sm opacity-60">Your content will appear here</p>
      </div>
    );
  }

  const isArticle = item.type === "article";
  const isPodcast = item.type === "podcast";
  const article = item as Article;
  const podcast = item as PodcastEpisode;

  return (
    <div className="flex h-full flex-col bg-[var(--paper-warm)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
        <button
          onClick={() => setSelectedItem(undefined)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFavorite(item.id)}
            className={cn(
              "rounded-lg p-2.5 transition-all duration-200",
              item.isFavorite
                ? "bg-amber-100 text-amber-600"
                : "text-[var(--ink-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
            )}
          >
            <Star className={cn("h-4 w-4", item.isFavorite && "fill-current")} />
          </button>
          <button
            onClick={() => toggleArchive(item.id)}
            className="rounded-lg p-2.5 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
          >
            <Archive className="h-4 w-4" />
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2.5 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
      >
        <article className="mx-auto max-w-2xl px-6 py-12 sm:px-8 animate-fade-in">
          {/* Article Header */}
          <header className="mb-10">
            <h1 className="font-display text-3xl font-medium leading-tight text-[var(--ink)] sm:text-4xl text-balance">
              {item.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--ink-muted)]">
              {item.author && (
                <span className="font-medium text-[var(--ink)]">{item.author}</span>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"
              >
                {item.source || getDomain(item.url)}
                <ExternalLink className="h-3 w-3" />
              </a>
              {isArticle && article.estimatedReadTime > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {article.estimatedReadTime} min read
                </span>
              )}
              {isPodcast && podcast.duration > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(podcast.duration)}
                </span>
              )}
              <span className="opacity-60">{formatDate(item.addedAt)}</span>
            </div>

            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt=""
                className="mt-8 w-full rounded-xl object-cover shadow-lg"
              />
            )}
          </header>

          {/* Article Content */}
          {isArticle && article.content && (
            <div
              className="prose prose-dropcap"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}

          {/* Podcast Player */}
          {isPodcast && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
              <audio
                ref={audioRef}
                src={podcast.audioUrl}
                className="hidden"
                onTimeUpdate={(e) => {
                  const audio = e.currentTarget;
                  const progress = (audio.currentTime / audio.duration) * 100;
                  updateProgress(item.id, progress);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              <div className="flex flex-col items-center gap-8">
                {/* Progress bar */}
                <div className="w-full">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-medium text-[var(--ink-muted)]">
                    <span>{formatDuration(podcast.currentTime || 0)}</span>
                    <span>{formatDuration(podcast.duration || 0)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime -= settings.podcast.skipBack;
                      }
                    }}
                    className="rounded-full p-3 text-[var(--ink-muted)] transition-all hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
                  >
                    <SkipBack className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        if (audioRef.current.paused) {
                          audioRef.current.play();
                        } else {
                          audioRef.current.pause();
                        }
                      }
                    }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-all hover:bg-[var(--accent-dark)] hover:shadow-xl"
                  >
                    {isPlaying ? (
                      <Pause className="h-7 w-7" />
                    ) : (
                      <Play className="h-7 w-7 translate-x-0.5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime += settings.podcast.skipForward;
                      }
                    }}
                    className="rounded-full p-3 text-[var(--ink-muted)] transition-all hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
                  >
                    <SkipForward className="h-6 w-6" />
                  </button>
                </div>

                {/* Speed control */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--ink-muted)]">Speed</span>
                  <select
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 font-medium text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                    defaultValue={settings.podcast.defaultSpeed}
                    onChange={(e) => {
                      if (audioRef.current) {
                        audioRef.current.playbackRate = parseFloat(e.target.value);
                      }
                    }}
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="1.75">1.75x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other types */}
          {!isArticle && !isPodcast && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-[var(--ink-muted)]">
                {item.description || "No preview available for this content."}
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 font-medium text-white transition-all hover:bg-[var(--accent-dark)]"
              >
                <ExternalLink className="h-4 w-4" />
                View Original
              </a>
            </div>
          )}

          {/* AI Insights Panel */}
          <div className="mt-10">
            <AIInsightsPanel item={item} />
          </div>

          {/* No Audio Warning for Podcasts */}
          {isPodcast && !podcast.audioUrl && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Audio not available</p>
                <p className="mt-1 text-sm text-amber-700">
                  We couldn't extract the audio from this podcast. You can still{" "}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-900"
                  >
                    listen on the original site
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Progress bar at bottom for articles */}
      {isArticle && (
        <div className="h-1 bg-[var(--border)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--sage)] to-[var(--sage-light)] transition-all duration-300"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
