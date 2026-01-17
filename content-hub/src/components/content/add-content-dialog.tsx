"use client";

import { useState } from "react";
import { Link, Headphones, Twitter, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useContentStore } from "@/store/content-store";
import { cn, getDomain, estimateReadTime } from "@/lib/utils";
import type { ContentType, Article } from "@/types";

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

  const { addItem, updateItem } = useContentStore();

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
          updateItem(id, {
            title: data.title || `Content from ${domain}`,
            description: data.excerpt || data.description,
            author: data.author,
            thumbnail: data.image,
            ...(contentType === "article" && {
              content: data.content,
              textContent: data.textContent,
              wordCount: data.wordCount || 0,
              estimatedReadTime: data.readTime || estimateReadTime(data.textContent || ""),
            }),
          });
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
      onOpenChange(false);
    } catch (err) {
      setError("Failed to add content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Paste a URL to save an article, podcast, tweet, or video.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Type Selector */}
          <div className="flex gap-2">
            {contentTypes.map(({ type, icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setContentType(type)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors",
                  contentType === type
                    ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800"
                    : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
                )}
              >
                {icon}
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
