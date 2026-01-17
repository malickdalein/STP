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
  Hash,
  Settings,
  Sparkles,
} from "lucide-react";

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
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? "bg-[var(--accent)] text-white font-medium shadow-sm"
          : "text-[var(--ink-light)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
      )}
    >
      <span className={cn(
        "transition-transform duration-200",
        !active && "group-hover:scale-110"
      )}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-medium tabular-nums",
          active
            ? "bg-white/20 text-white"
            : "bg-[var(--border)] text-[var(--ink-muted)]"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-3">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
        {children}
      </span>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
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
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
        <div className="relative flex h-9 w-9 items-center justify-center">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] shadow-sm" />
          <Sparkles className="relative h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-lg font-medium tracking-tight text-[var(--ink)]">
            Readwise
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--ink-muted)]">
            Content Hub
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1 stagger-children">
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

        <div className="my-5" />

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
            <div className="my-5" />
            <SectionLabel>Collections</SectionLabel>
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
            <div className="my-5" />
            <SectionLabel>Tags</SectionLabel>
            <div className="space-y-1">
              {tags.map((tag) => (
                <NavItem
                  key={tag.id}
                  icon={<Hash className="h-4 w-4" />}
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

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-3">
        <NavItem
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          onClick={() => {}}
        />
      </div>
    </aside>
  );
}
