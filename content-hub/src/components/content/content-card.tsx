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
  MoreHorizontal,
} from "lucide-react";
import type { ContentItem, Article, PodcastEpisode } from "@/types";
import { useState } from "react";

interface ContentCardProps {
  item: ContentItem;
}

const typeIcons: Record<string, React.ReactNode> = {
  article: <BookOpen className="h-4 w-4" />,
  podcast: <Headphones className="h-4 w-4" />,
  tweet: <Twitter className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  link: <LinkIcon className="h-4 w-4" />,
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

  return (
    <div
      className={cn(
        "group relative cursor-pointer p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
        isSelected && "bg-neutral-50 dark:bg-neutral-900/50"
      )}
      onClick={() => setSelectedItem(item.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        {item.thumbnail && (
          <div className="hidden h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:block dark:bg-neutral-800">
            <img
              src={item.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <div className="flex items-start gap-2">
            <span className={cn(
              "mt-0.5 flex-shrink-0",
              item.status === "completed" ? "text-green-500" : "text-neutral-400"
            )}>
              {typeIcons[item.type]}
            </span>
            <h3
              className={cn(
                "line-clamp-2 font-medium leading-tight",
                item.status === "completed" && "text-neutral-400 line-through"
              )}
            >
              {item.title}
            </h3>
            {item.isFavorite && (
              <Star className="h-4 w-4 flex-shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
              {item.description}
            </p>
          )}

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
            <span>{item.source || getDomain(item.url)}</span>

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

            <span>{formatDate(item.addedAt)}</span>

            {/* Progress indicator */}
            {item.progress > 0 && item.progress < 100 && (
              <span className="text-blue-500">{Math.round(item.progress)}% done</span>
            )}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex flex-shrink-0 flex-col gap-1 transition-opacity",
            showActions || isSelected ? "opacity-100" : "opacity-0"
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className={cn(
              "rounded p-1.5 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700",
              item.isFavorite ? "text-yellow-500" : "text-neutral-400"
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
            className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700"
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
            className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {item.progress > 0 && item.progress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
