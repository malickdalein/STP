"use client";

import { useContentStore, useFilteredItems } from "@/store/content-store";
import { ContentCard } from "./content-card";
import { Inbox, BookOpen, Headphones, Archive, Star, Sparkles } from "lucide-react";

export function ContentList() {
  const items = useFilteredItems();
  const { currentView, searchQuery } = useContentStore();

  const emptyStates: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
    inbox: {
      icon: <Inbox className="h-16 w-16" />,
      title: "Your reading list awaits",
      description: "Add articles, podcasts, or tweets to begin your journey.",
    },
    reading: {
      icon: <BookOpen className="h-16 w-16" />,
      title: "No articles yet",
      description: "Save articles from the web to read them in peace.",
    },
    podcasts: {
      icon: <Headphones className="h-16 w-16" />,
      title: "No podcasts yet",
      description: "Add episodes to build your listening queue.",
    },
    archive: {
      icon: <Archive className="h-16 w-16" />,
      title: "Nothing archived",
      description: "Finished content will rest here.",
    },
    favorites: {
      icon: <Star className="h-16 w-16" />,
      title: "No favorites yet",
      description: "Star the content you love most.",
    },
  };

  if (items.length === 0) {
    const empty = emptyStates[currentView] || emptyStates.inbox;

    if (searchQuery) {
      return (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <div className="rounded-2xl bg-[var(--surface-raised)] p-6 text-[var(--ink-muted)]">
            <Sparkles className="mx-auto h-12 w-12 opacity-40" />
            <p className="mt-4 font-display text-lg text-[var(--ink)]">No results found</p>
            <p className="mt-1 text-sm">Try a different search term.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center animate-fade-in">
        <div className="text-[var(--border-strong)]">
          {empty.icon}
        </div>
        <p className="mt-6 font-display text-xl font-medium text-[var(--ink)]">{empty.title}</p>
        <p className="mt-2 max-w-xs text-sm text-[var(--ink-muted)]">{empty.description}</p>
      </div>
    );
  }

  return (
    <div className="stagger-children">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
