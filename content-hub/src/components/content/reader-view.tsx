"use client";

import { useEffect, useRef, useCallback } from "react";
import { useContentStore } from "@/store/content-store";
import { formatDate, getDomain, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  X,
  Star,
  Archive,
  ExternalLink,
  Clock,
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Article, PodcastEpisode, ContentItem } from "@/types";

export function ReaderView() {
  const { items, selectedItemId, setSelectedItem, toggleFavorite, toggleArchive, updateProgress, settings } =
    useContentStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const item = items.find((i) => i.id === selectedItemId);

  // Track scroll progress for articles
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
      <div className="flex h-full items-center justify-center text-neutral-400">
        <p>Select an item to read</p>
      </div>
    );
  }

  const isArticle = item.type === "article";
  const isPodcast = item.type === "podcast";
  const article = item as Article;
  const podcast = item as PodcastEpisode;

  const fontSizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
    xlarge: "text-xl",
  };

  const fontFamilyClasses = {
    serif: "font-serif",
    "sans-serif": "font-sans",
    mono: "font-mono",
  };

  const lineSpacingClasses = {
    compact: "leading-normal",
    normal: "leading-relaxed",
    relaxed: "leading-loose",
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <Button variant="ghost" size="sm" onClick={() => setSelectedItem(undefined)}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFavorite(item.id)}
            className={cn(item.isFavorite && "text-yellow-500")}
          >
            <Star className={cn("h-4 w-4", item.isFavorite && "fill-current")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => toggleArchive(item.id)}>
            <Archive className="h-4 w-4" />
          </Button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 py-8 sm:px-8 md:px-16 lg:px-24",
          settings.reader.theme === "sepia" && "bg-amber-50 dark:bg-amber-950/20"
        )}
      >
        <article className="mx-auto max-w-2xl">
          {/* Meta */}
          <header className="mb-8">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{item.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500">
              {item.author && <span>{item.author}</span>}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {item.source || getDomain(item.url)}
              </a>
              {isArticle && article.estimatedReadTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {article.estimatedReadTime} min read
                </span>
              )}
              {isPodcast && podcast.duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(podcast.duration)}
                </span>
              )}
              <span>{formatDate(item.addedAt)}</span>
            </div>

            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt=""
                className="mt-6 w-full rounded-lg object-cover"
              />
            )}
          </header>

          {/* Article Content */}
          {isArticle && article.content && (
            <div
              className={cn(
                "prose prose-neutral max-w-none dark:prose-invert",
                fontSizeClasses[settings.reader.fontSize],
                fontFamilyClasses[settings.reader.fontFamily],
                lineSpacingClasses[settings.reader.lineSpacing]
              )}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}

          {/* Podcast Player */}
          {isPodcast && (
            <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
              <audio
                ref={audioRef}
                src={podcast.audioUrl}
                className="hidden"
                onTimeUpdate={(e) => {
                  const audio = e.currentTarget;
                  const progress = (audio.currentTime / audio.duration) * 100;
                  updateProgress(item.id, progress);
                }}
              />

              <div className="flex flex-col items-center gap-6">
                {/* Progress bar */}
                <div className="w-full">
                  <div className="h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all dark:bg-white"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-neutral-400">
                    <span>{formatDuration((podcast.currentTime || 0))}</span>
                    <span>{formatDuration(podcast.duration || 0)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime -= settings.podcast.skipBack;
                      }
                    }}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    className="h-14 w-14 rounded-full"
                    onClick={() => {
                      if (audioRef.current) {
                        if (audioRef.current.paused) {
                          audioRef.current.play();
                        } else {
                          audioRef.current.pause();
                        }
                      }
                    }}
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime += settings.podcast.skipForward;
                      }
                    }}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                {/* Speed control */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-400">Speed:</span>
                  <select
                    className="rounded border border-neutral-200 bg-transparent px-2 py-1 dark:border-neutral-700"
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
            <div className="rounded-lg border border-neutral-200 p-6 text-center dark:border-neutral-800">
              <p className="text-neutral-500">
                {item.description || "No preview available."}
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                <ExternalLink className="h-4 w-4" />
                Open Original
              </a>
            </div>
          )}
        </article>
      </div>

      {/* Progress bar at bottom for articles */}
      {isArticle && (
        <div className="h-1 bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
