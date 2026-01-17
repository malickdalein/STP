"use client";

import { useContentStore, useFilteredItems } from "@/store/content-store";
import { ContentCard } from "./content-card";
import { Inbox, BookOpen, Headphones, Archive, Star } from "lucide-react";

export function ContentList() {
  const items = useFilteredItems();
  const { currentView, searchQuery } = useContentStore();

  const emptyStates: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
    inbox: {
      icon: <Inbox className="h-12 w-12" />,
      title: "Your inbox is empty",
      description: "Add articles, podcasts, or tweets to get started.",
    },
    reading: {
      icon: <BookOpen className="h-12 w-12" />,
      title: "No articles yet",
      description: "Save articles to read them later.",
    },
    podcasts: {
      icon: <Headphones className="h-12 w-12" />,
      title: "No podcasts yet",
      description: "Add podcast episodes to listen later.",
    },
    archive: {
      icon: <Archive className="h-12 w-12" />,
      title: "Archive is empty",
      description: "Completed items will appear here.",
    },
    favorites: {
      icon: <Star className="h-12 w-12" />,
      title: "No favorites",
      description: "Star items to add them to your favorites.",
    },
  };

  if (items.length === 0) {
    const empty = emptyStates[currentView] || emptyStates.inbox;

    if (searchQuery) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-neutral-400">
          <p className="text-lg">No results found</p>
          <p className="text-sm">Try a different search term.</p>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center text-neutral-400">
        {empty.icon}
        <p className="mt-4 text-lg font-medium">{empty.title}</p>
        <p className="text-sm">{empty.description}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
