"use client";

import { useState } from "react";
import { Link, Headphones, Twitter, Video, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useContentStore } from "@/store/content-store";
import { cn, getDomain, estimateReadTime } from "@/lib/utils";
import type { ContentType } from "@/types";

interface AddContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const contentTypes: { type: ContentType; icon: React.ReactNode; label: string }[] = [
  { type: "article", icon: <Link className="h-4 w-4" />, label: "Article" },
  { type: "podcast", icon: <Headphones className="h-4 w-4" />, label: "Podcast" },
  { type: "tweet", icon: <Twitter className="h-4 w-4" />, label: "Tweet" },
  { type: "video", icon: <Video className="h-4 w-4" />, label: "Video" },
];

export function AddContentDialog({ open, onOpenChange }: AddContentDialogProps) {
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState<ContentType>("article");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoDetected, setAutoDetected] = useState(false);

  const { addItem, updateItem } = useContentStore();

  // Auto-detect content type from URL
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setAutoDetected(false);

    const lowerUrl = newUrl.toLowerCase();

    if (lowerUrl.includes('podcast') || lowerUrl.includes('/episodes/') ||
        lowerUrl.includes('spotify.com/episode') || lowerUrl.includes('anchor.fm') ||
        lowerUrl.includes('acquired.fm') || lowerUrl.includes('overcast.fm')) {
      setContentType("podcast");
      setAutoDetected(true);
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      setContentType("tweet");
      setAutoDetected(true);
    } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') ||
               lowerUrl.includes('vimeo.com')) {
      setContentType("video");
      setAutoDetected(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);

    try {
      const domain = getDomain(url);

      // Create initial item
      const id = addItem({
        type: contentType,
        url: url.trim(),
        title: `Loading from ${domain}...`,
        source: domain,
      });

      // Try to fetch and parse the content
      try {
        const response = await fetch(`/api/parse?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();

          // Auto-detect podcast if the API says so
          const finalType = data.isPodcast ? "podcast" : contentType;

          const updates: Record<string, unknown> = {
            type: finalType,
            title: data.title || `Content from ${domain}`,
            description: data.excerpt || data.description,
            author: data.author,
            thumbnail: data.image,
          };

          // Article-specific fields
          if (finalType === "article") {
            updates.content = data.content;
            updates.textContent = data.textContent;
            updates.wordCount = data.wordCount || 0;
            updates.estimatedReadTime = data.readTime || estimateReadTime(data.textContent || "");
          }

          // Podcast-specific fields
          if (finalType === "podcast") {
            updates.audioUrl = data.audioUrl;
            updates.duration = data.duration || 0;
            if (data.podcastName) {
              updates.source = data.podcastName;
            }
          }

          updateItem(id, updates);
        } else {
          // If parsing fails, keep the basic info
          updateItem(id, {
            title: `Content from ${domain}`,
          });
        }
      } catch {
        // If parsing fails, keep the basic info
        updateItem(id, {
          title: `Content from ${domain}`,
        });
      }

      // Reset form and close
      setUrl("");
      setContentType("article");
      setAutoDetected(false);
      onOpenChange(false);
    } catch {
      setError("Failed to add content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-[var(--border)] bg-[var(--surface)]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-[var(--ink)]">Add Content</DialogTitle>
          <DialogDescription className="text-[var(--ink-muted)]">
            Paste a URL to save an article, podcast, tweet, or video.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <input
              type="url"
              placeholder="https://example.com/article-or-podcast"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {autoDetected && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--sage)]">
                <Sparkles className="h-3 w-3" />
                Auto-detected as {contentType}
              </p>
            )}
          </div>

          {/* Content Type Selector */}
          <div className="flex gap-2">
            {contentTypes.map(({ type, icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setContentType(type);
                  setAutoDetected(false);
                }}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition-all duration-200",
                  contentType === type
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]"
                )}
              >
                {icon}
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-dark)] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
