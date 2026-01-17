"use client";

import { cn } from "@/lib/utils";
import { useContentStore } from "@/store/content-store";
import {
  Inbox,
  BookOpen,
  Headphones,
  Archive,
  Star,
  Folder,
  Tag,
  Plus,
  Settings,
  ChevronRight,
} from "lucide-react";
import type { ViewMode } from "@/types";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, count, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-neutral-400">{count}</span>
      )}
    </button>
  );
}

export function Sidebar() {
  const { items, folders, tags, currentView, currentFolderId, currentTagId, setCurrentView } =
    useContentStore();

  const counts = {
    inbox: items.filter((i) => !i.isArchived).length,
    reading: items.filter((i) => i.type === "article" && !i.isArchived).length,
    podcasts: items.filter((i) => i.type === "podcast" && !i.isArchived).length,
    archive: items.filter((i) => i.isArchived).length,
    favorites: items.filter((i) => i.isFavorite && !i.isArchived).length,
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="font-semibold">Content Hub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          <NavItem
            icon={<Inbox className="h-4 w-4" />}
            label="Inbox"
            count={counts.inbox}
            active={currentView === "inbox"}
            onClick={() => setCurrentView("inbox")}
          />
          <NavItem
            icon={<BookOpen className="h-4 w-4" />}
            label="Reading List"
            count={counts.reading}
            active={currentView === "reading"}
            onClick={() => setCurrentView("reading")}
          />
          <NavItem
            icon={<Headphones className="h-4 w-4" />}
            label="Podcasts"
            count={counts.podcasts}
            active={currentView === "podcasts"}
            onClick={() => setCurrentView("podcasts")}
          />
        </div>

        <div className="my-4 border-t border-neutral-200 dark:border-neutral-800" />

        <div className="space-y-1">
          <NavItem
            icon={<Star className="h-4 w-4" />}
            label="Favorites"
            count={counts.favorites}
            active={currentView === "favorites"}
            onClick={() => setCurrentView("favorites")}
          />
          <NavItem
            icon={<Archive className="h-4 w-4" />}
            label="Archive"
            count={counts.archive}
            active={currentView === "archive"}
            onClick={() => setCurrentView("archive")}
          />
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <>
            <div className="my-4 border-t border-neutral-200 dark:border-neutral-800" />
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Folders
              </span>
            </div>
            <div className="space-y-1">
              {folders.map((folder) => (
                <NavItem
                  key={folder.id}
                  icon={<Folder className="h-4 w-4" />}
                  label={folder.name}
                  count={items.filter((i) => i.folderId === folder.id && !i.isArchived).length}
                  active={currentView === "folder" && currentFolderId === folder.id}
                  onClick={() => setCurrentView("folder", folder.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <div className="my-4 border-t border-neutral-200 dark:border-neutral-800" />
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Tags
              </span>
            </div>
            <div className="space-y-1">
              {tags.map((tag) => (
                <NavItem
                  key={tag.id}
                  icon={<Tag className="h-4 w-4" />}
                  label={tag.name}
                  count={items.filter((i) => i.tags.includes(tag.name) && !i.isArchived).length}
                  active={currentView === "tag" && currentTagId === tag.id}
                  onClick={() => setCurrentView("tag", tag.id)}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Settings */}
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <NavItem
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          onClick={() => {}}
        />
      </div>
    </aside>
  );
}
