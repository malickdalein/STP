export type ContentType = "article" | "podcast" | "tweet" | "video" | "link";
export type ContentStatus = "unread" | "in_progress" | "completed";

export interface ContentItem {
  id: string;
  type: ContentType;
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;

  // Metadata
  author?: string;
  source?: string;
  publishedAt?: string;
  addedAt: string;

  // Organization
  folderId?: string;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;

  // Progress
  status: ContentStatus;
  progress: number;
  lastAccessedAt?: string;

  // Sync
  updatedAt: string;
}

export interface Article extends ContentItem {
  type: "article";
  content: string;
  textContent: string;
  wordCount: number;
  estimatedReadTime: number;
  scrollPosition?: number;
}

export interface PodcastEpisode extends ContentItem {
  type: "podcast";
  audioUrl: string;
  duration: number;
  currentTime: number;
  podcastName?: string;
  episodeNumber?: number;
}

export interface Tweet extends ContentItem {
  type: "tweet";
  tweetId: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  tweetContent: string;
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  itemCount: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  itemCount: number;
}

export type ViewMode = "inbox" | "reading" | "podcasts" | "archive" | "favorites" | "folder" | "tag";

export interface UserSettings {
  reader: {
    fontSize: "small" | "medium" | "large" | "xlarge";
    fontFamily: "serif" | "sans-serif" | "mono";
    theme: "light" | "dark" | "sepia";
    lineSpacing: "compact" | "normal" | "relaxed";
  };
  podcast: {
    defaultSpeed: number;
    skipForward: number;
    skipBack: number;
  };
}

export const defaultSettings: UserSettings = {
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
};
