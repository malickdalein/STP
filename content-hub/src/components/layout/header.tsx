"use client";

import { useState } from "react";
import { Search, Plus, X, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentStore } from "@/store/content-store";
import { AddContentDialog } from "@/components/content/add-content-dialog";

export function Header() {
  const { searchQuery, setSearchQuery, currentView } = useContentStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const viewTitles: Record<string, string> = {
    inbox: "Inbox",
    reading: "Reading List",
    podcasts: "Podcasts",
    archive: "Archive",
    favorites: "Favorites",
    folder: "Collection",
    tag: "Tagged",
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-medium text-[var(--ink)]">
            {viewTitles[currentView] || "Content Hub"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div
            className={`
              relative flex items-center rounded-xl border bg-[var(--surface-raised)] transition-all duration-300
              ${searchFocused
                ? "w-80 border-[var(--accent)] shadow-sm ring-2 ring-[var(--accent)]/10"
                : "w-64 border-[var(--border)] hover:border-[var(--border-strong)]"
              }
            `}
          >
            <Search className="absolute left-3.5 h-4 w-4 text-[var(--ink-muted)]" />
            <input
              type="search"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="h-10 w-full bg-transparent pl-10 pr-12 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 flex h-5 w-5 items-center justify-center rounded text-[var(--ink-muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--ink)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="absolute right-3 flex items-center gap-0.5 text-[10px] text-[var(--ink-muted)]">
                <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] px-1 font-mono">
                  <Command className="h-2.5 w-2.5" />
                </kbd>
                <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] px-1 font-mono">
                  K
                </kbd>
              </div>
            )}
          </div>

          {/* Add Button */}
          <Button
            onClick={() => setShowAddDialog(true)}
            className="group gap-2 rounded-xl bg-[var(--accent)] px-5 text-white shadow-sm transition-all hover:bg-[var(--accent-dark)] hover:shadow-md"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span className="font-medium">Add</span>
          </Button>
        </div>
      </header>

      <AddContentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </>
  );
}
