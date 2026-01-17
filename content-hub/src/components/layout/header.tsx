"use client";

import { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContentStore } from "@/store/content-store";
import { AddContentDialog } from "@/components/content/add-content-dialog";

export function Header() {
  const { searchQuery, setSearchQuery, currentView } = useContentStore();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const viewTitles: Record<string, string> = {
    inbox: "Inbox",
    reading: "Reading List",
    podcasts: "Podcasts",
    archive: "Archive",
    favorites: "Favorites",
    folder: "Folder",
    tag: "Tag",
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="text-lg font-semibold">{viewTitles[currentView] || "Content Hub"}</h1>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Add Button */}
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </header>

      <AddContentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </>
  );
}
