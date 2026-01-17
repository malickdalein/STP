import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { ContentItem, Article, Folder, Tag, ViewMode, UserSettings, AIAnalysis } from "@/types";

interface ContentState {
  items: ContentItem[];
  folders: Folder[];
  tags: Tag[];
  settings: UserSettings;

  // View state
  currentView: ViewMode;
  currentFolderId?: string;
  currentTagId?: string;
  selectedItemId?: string;
  searchQuery: string;

  // Actions
  addItem: (item: Omit<ContentItem, "id" | "addedAt" | "updatedAt" | "status" | "progress" | "isFavorite" | "isArchived" | "tags">) => string;
  updateItem: (id: string, updates: Partial<ContentItem>) => void;
  deleteItem: (id: string) => void;

  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;

  addFolder: (name: string) => string;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

  addTag: (name: string) => string;
  addTagToItem: (itemId: string, tagName: string) => void;
  removeTagFromItem: (itemId: string, tagName: string) => void;

  setCurrentView: (view: ViewMode, id?: string) => void;
  setSelectedItem: (id?: string) => void;
  setSearchQuery: (query: string) => void;

  updateSettings: (settings: Partial<UserSettings>) => void;

  // AI Actions
  updateAIAnalysis: (id: string, analysis: AIAnalysis) => void;
  applyAISuggestedTags: (id: string) => void;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      items: [],
      folders: [],
      tags: [],
      settings: {
        reader: {
          fontSize: "medium",
          fontFamily: "serif",
          theme: "light",
          lineSpacing: "normal",
        },
        podcast: {
          defaultSpeed: 1,
          skipForward: 30,
          skipBack: 15,
        },
        ai: {
          provider: "openai",
          autoSummarize: false,
          autoTag: false,
        },
      },

      currentView: "inbox",
      currentFolderId: undefined,
      currentTagId: undefined,
      selectedItemId: undefined,
      searchQuery: "",

      addItem: (item) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newItem: ContentItem = {
          ...item,
          id,
          addedAt: now,
          updatedAt: now,
          status: "unread",
          progress: 0,
          isFavorite: false,
          isArchived: false,
          tags: [],
        };
        set((state) => ({ items: [newItem, ...state.items] }));
        return id;
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          selectedItemId: state.selectedItemId === id ? undefined : state.selectedItemId,
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, isFavorite: !item.isFavorite, updatedAt: new Date().toISOString() }
              : item
          ),
        }));
      },

      toggleArchive: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, isArchived: !item.isArchived, updatedAt: new Date().toISOString() }
              : item
          ),
        }));
      },

      updateProgress: (id, progress) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  progress,
                  status: progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "unread",
                  lastAccessedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        }));
      },

      addFolder: (name) => {
        const id = uuidv4();
        const newFolder: Folder = {
          id,
          name,
          itemCount: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ folders: [...state.folders, newFolder] }));
        return id;
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...updates } : folder
          ),
        }));
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          items: state.items.map((item) =>
            item.folderId === id ? { ...item, folderId: undefined } : item
          ),
        }));
      },

      addTag: (name) => {
        const existing = get().tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing.id;

        const id = uuidv4();
        const newTag: Tag = { id, name, itemCount: 0 };
        set((state) => ({ tags: [...state.tags, newTag] }));
        return id;
      },

      addTagToItem: (itemId, tagName) => {
        const tagId = get().addTag(tagName);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId && !item.tags.includes(tagName)
              ? { ...item, tags: [...item.tags, tagName] }
              : item
          ),
        }));
      },

      removeTagFromItem: (itemId, tagName) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, tags: item.tags.filter((t) => t !== tagName) }
              : item
          ),
        }));
      },

      setCurrentView: (view, id) => {
        set({
          currentView: view,
          currentFolderId: view === "folder" ? id : undefined,
          currentTagId: view === "tag" ? id : undefined,
          selectedItemId: undefined,
        });
      },

      setSelectedItem: (id) => {
        set({ selectedItemId: id });
        if (id) {
          const item = get().items.find((i) => i.id === id);
          if (item && item.status === "unread") {
            get().updateItem(id, { status: "in_progress" });
          }
        }
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            reader: { ...state.settings.reader, ...newSettings.reader },
            podcast: { ...state.settings.podcast, ...newSettings.podcast },
            ai: { ...state.settings.ai, ...newSettings.ai },
          },
        }));
      },

      updateAIAnalysis: (id, analysis) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  aiAnalysis: {
                    ...item.aiAnalysis,
                    ...analysis,
                    generatedAt: new Date().toISOString(),
                  },
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        }));
      },

      applyAISuggestedTags: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item?.aiAnalysis?.suggestedTags) {
          const newTags = item.aiAnalysis.suggestedTags.filter(
            (tag) => !item.tags.includes(tag)
          );
          if (newTags.length > 0) {
            newTags.forEach((tag) => get().addTagToItem(id, tag));
          }
        }
      },
    }),
    {
      name: "content-hub-storage",
    }
  )
);

// Selectors
export const useFilteredItems = () => {
  const { items, currentView, currentFolderId, currentTagId, searchQuery } = useContentStore();

  let filtered = items;

  // Filter by view
  switch (currentView) {
    case "inbox":
      filtered = filtered.filter((item) => !item.isArchived);
      break;
    case "reading":
      filtered = filtered.filter((item) => item.type === "article" && !item.isArchived);
      break;
    case "podcasts":
      filtered = filtered.filter((item) => item.type === "podcast" && !item.isArchived);
      break;
    case "archive":
      filtered = filtered.filter((item) => item.isArchived);
      break;
    case "favorites":
      filtered = filtered.filter((item) => item.isFavorite && !item.isArchived);
      break;
    case "folder":
      filtered = filtered.filter((item) => item.folderId === currentFolderId && !item.isArchived);
      break;
    case "tag":
      const tag = useContentStore.getState().tags.find((t) => t.id === currentTagId);
      if (tag) {
        filtered = filtered.filter((item) => item.tags.includes(tag.name) && !item.isArchived);
      }
      break;
  }

  // Filter by search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.source?.toLowerCase().includes(query)
    );
  }

  return filtered;
};
