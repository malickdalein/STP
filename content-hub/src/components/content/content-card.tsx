"use client";

import { useContentStore } from "@/store/content-store";
import { formatDate, getDomain, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Headphones,
  Twitter,
  Video,
  Link as LinkIcon,
  Star,
  Archive,
  Trash2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import type { ContentItem, Article, PodcastEpisode } from "@/types";
import { useState } from "react";

interface ContentCardProps {
  item: ContentItem;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  article: {
    icon: <BookOpen className="h-3.5 w-3.5" />,
    label: "Article",
    color: "bg-[var(--accent)]/10 text-[var(--accent)]",
  },
  podcast: {
    icon: <Headphones className="h-3.5 w-3.5" />,
    label: "Podcast",
    color: "bg-[var(--sage)]/20 text-[var(--sage-dark)]",
  },
  tweet: {
    icon: <Twitter className="h-3.5 w-3.5" />,
    label: "Tweet",
    color: "bg-sky-500/10 text-sky-600",
  },
  video: {
    icon: <Video className="h-3.5 w-3.5" />,
    label: "Video",
    color: "bg-rose-500/10 text-rose-600",
  },
  link: {
    icon: <LinkIcon className="h-3.5 w-3.5" />,
    label: "Link",
    color: "bg-[var(--border)] text-[var(--ink-muted)]",
  },
};

export function ContentCard({ item }: ContentCardProps) {
  const { selectedItemId, setSelectedItem, toggleFavorite, toggleArchive, deleteItem } =
    useContentStore();
  const [showActions, setShowActions] = useState(false);

  const isSelected = selectedItemId === item.id;
  const isArticle = item.type === "article";
  const isPodcast = item.type === "podcast";

  const article = item as Article;
  const podcast = item as PodcastEpisode;
  const config = typeConfig[item.type] || typeConfig.link;

  return (
    <article
      className={cn(
        "group relative cursor-pointer border-b border-[var(--border)] px-5 py-5 transition-all duration-300",
        isSelected
          ? "bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]"
          : "hover:bg-[var(--surface-raised)] border-l-2 border-l-transparent"
      )}
      onClick={() => setSelectedItem(item.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-5">
        {/* Thumbnail */}
        {item.thumbnail && (
          <div className="hidden h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--surface-raised)] shadow-sm sm:block">
            <img
              src={item.thumbnail}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Type badge & favorite */}
          <div className="mb-2 flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              config.color
            )}>
              {config.icon}
              {config.label}
            </span>
            {item.isFavorite && (
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            )}
            {item.status === "completed" && (
              <span className="text-[11px] font-medium text-[var(--sage)]">Finished</span>
            )}
          </div>

          {/* Title */}
          <h3
            className={cn(
              "font-display text-base font-medium leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]",
              item.status === "completed" && "text-[var(--ink-muted)] line-through decoration-[var(--border)]"
            )}
          >
            {item.title}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              {item.description}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--ink-muted)]">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 font-medium transition-colors hover:text-[var(--accent)]"
            >
              {item.source || getDomain(item.url)}
              <ArrowUpRight className="h-3 w-3" />
            </a>

            {isArticle && article.estimatedReadTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.estimatedReadTime} min read
              </span>
            )}

            {isPodcast && podcast.duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(podcast.duration)}
              </span>
            )}

            <span className="opacity-60">{formatDate(item.addedAt)}</span>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-muted)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex flex-shrink-0 flex-col gap-1 transition-all duration-200",
            showActions || isSelected ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className={cn(
              "rounded-lg p-2 transition-all duration-200",
              item.isFavorite
                ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                : "text-[var(--ink-muted)] hover:bg-[var(--border)] hover:text-[var(--ink)]"
            )}
            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn("h-4 w-4", item.isFavorite && "fill-current")} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleArchive(item.id);
            }}
            className="rounded-lg p-2 text-[var(--ink-muted)] transition-all duration-200 hover:bg-[var(--border)] hover:text-[var(--ink)]"
            title={item.isArchived ? "Unarchive" : "Archive"}
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this item?")) {
                deleteItem(item.id);
              }
            }}
            className="rounded-lg p-2 text-[var(--ink-muted)] transition-all duration-200 hover:bg-red-100 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {item.progress > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                item.progress >= 100
                  ? "bg-[var(--sage)]"
                  : "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]"
              )}
              style={{ width: `${Math.min(100, item.progress)}%` }}
            />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-[var(--ink-muted)]">
            {Math.round(item.progress)}%
          </span>
        </div>
      )}
    </article>
  );
}
