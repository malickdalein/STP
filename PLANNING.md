# Personal Content Hub - App Planning Document

> A unified app to collect, organize, and consume podcasts, articles, tweets, and links with a clean reading experience.

---

## Vision Statement

A personal "read-it-later" and "listen-later" app that combines the best of Instapaper, Pocket, and podcast apps into one unified content hub with cloud sync across devices.

---

## Core Features

### 1. Content Collection (Inbox)

| Content Type | Source Methods |
|--------------|----------------|
| **Articles/Links** | Manual URL paste, Browser extension, RSS feeds |
| **Podcasts** | RSS feed subscription, Manual episode URL, Search & discover |
| **Tweets/Threads** | URL paste, Browser extension |
| **Videos** | YouTube/Vimeo URLs (save for later) |

### 2. Reader Mode (Instapaper-style)

- **Clean typography** - Distraction-free reading
- **Customizable** - Font size, theme (light/dark/sepia), line spacing
- **Progress tracking** - Remember scroll position
- **Estimated read time** - Show reading time for articles
- **Offline support** - Cache content for offline reading

### 3. Podcast Player

- **Playback controls** - Speed adjustment (0.5x - 3x), skip 15s/30s
- **Queue management** - Up next, add to queue
- **Progress sync** - Resume where you left off on any device
- **Sleep timer** - Auto-stop after duration
- **Chapter support** - Navigate by chapters if available

### 4. Organization System

- **Inbox** - New/unprocessed items
- **Folders/Collections** - User-created groupings
- **Tags** - Flexible categorization
- **Archive** - Completed items
- **Favorites** - Quick access to starred items
- **Search** - Full-text search across all content

### 5. Cloud Sync

- **Multi-device** - Access from any browser
- **Real-time sync** - Changes appear instantly
- **Conflict resolution** - Handle offline edits gracefully

---

## User Experience Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONTENT HUB                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   Inbox     │   Reading   │  Podcasts   │  Collections │ Archive │
│   (new)     │   List      │   Queue     │  & Tags      │         │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTENT VIEW                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Article: Clean reader mode with progress bar           │    │
│  │  Podcast: Player with waveform and chapters             │    │
│  │  Tweet:   Thread view with media                        │    │
│  │  Video:   Embedded player with notes                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Content Item (Base)

```typescript
interface ContentItem {
  id: string;
  type: 'article' | 'podcast' | 'tweet' | 'video' | 'link';
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;

  // Metadata
  author?: string;
  source?: string;        // Domain or podcast name
  publishedAt?: Date;
  addedAt: Date;

  // Organization
  folderId?: string;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;

  // Progress
  status: 'unread' | 'in_progress' | 'completed';
  progress: number;       // 0-100 percentage
  lastAccessedAt?: Date;

  // Sync
  updatedAt: Date;
  syncVersion: number;
}
```

### Article Extension

```typescript
interface Article extends ContentItem {
  type: 'article';
  content: string;        // Parsed/cleaned HTML
  textContent: string;    // Plain text for search
  wordCount: number;
  estimatedReadTime: number;  // in minutes
  scrollPosition?: number;
}
```

### Podcast Episode

```typescript
interface PodcastEpisode extends ContentItem {
  type: 'podcast';
  audioUrl: string;
  duration: number;       // in seconds
  currentTime: number;    // playback position
  podcastId: string;      // Reference to podcast feed
  episodeNumber?: number;
  chapters?: Chapter[];
}

interface Podcast {
  id: string;
  feedUrl: string;
  title: string;
  author: string;
  artwork: string;
  description: string;
  episodes: PodcastEpisode[];
  lastChecked: Date;
}

interface Chapter {
  title: string;
  startTime: number;
  endTime?: number;
}
```

### Tweet/Thread

```typescript
interface Tweet extends ContentItem {
  type: 'tweet';
  tweetId: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  media?: MediaItem[];
  thread?: Tweet[];       // For thread support
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}
```

### Collections & Tags

```typescript
interface Folder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;      // For nested folders
  createdAt: Date;
  updatedAt: Date;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
  itemCount: number;
}
```

### User Settings

```typescript
interface UserSettings {
  // Reader preferences
  reader: {
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    fontFamily: 'serif' | 'sans-serif' | 'mono';
    theme: 'light' | 'dark' | 'sepia' | 'auto';
    lineSpacing: 'compact' | 'normal' | 'relaxed';
  };

  // Podcast preferences
  podcast: {
    defaultSpeed: number;
    skipForward: number;  // seconds
    skipBack: number;
    autoPlay: boolean;
    sleepTimerDefault?: number;
  };

  // Sync preferences
  sync: {
    autoSync: boolean;
    syncInterval: number; // minutes
    offlineEnabled: boolean;
  };
}
```

---

## Technical Architecture

### Option A: Modern Serverless Stack (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│         Next.js 14 / React + TypeScript + Tailwind              │
│                    Deployed on Vercel                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Realtime + Storage)              │
│  OR                                                              │
│  Firebase (Firestore + Auth + Functions + Storage)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  • Mercury Parser API (article extraction)                       │
│  • Podcast Index API (podcast search/discovery)                  │
│  • Twitter/X API (tweet fetching) - or use embeds               │
│  • RSS Parser (podcast feeds)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Option B: Full-Stack Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                      FULL-STACK APP                              │
│              Next.js 14 with App Router + Server Actions         │
│                    + Prisma ORM + PostgreSQL                     │
│            Deployed on Vercel / Railway / Render                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Recommendations

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router, SSR, API routes |
| **TypeScript** | Type safety and better DX |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Beautiful, accessible components |
| **Zustand** | Lightweight state management |
| **TanStack Query** | Data fetching and caching |

### Backend / Database
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL, Auth, Realtime subscriptions, Storage |
| **Prisma** | Type-safe database ORM (if using custom backend) |

### Content Processing
| Technology | Purpose |
|------------|---------|
| **@mozilla/readability** | Article content extraction (like Instapaper) |
| **rss-parser** | Parse podcast RSS feeds |
| **cheerio** | HTML parsing and cleaning |

### Audio/Media
| Technology | Purpose |
|------------|---------|
| **Howler.js** | Audio playback with advanced controls |
| **wavesurfer.js** | Optional: Waveform visualization |

### Browser Extension
| Technology | Purpose |
|------------|---------|
| **Plasmo** | Modern browser extension framework |
| **WXT** | Alternative extension framework |

---

## Implementation Phases

### Phase 1: Foundation (MVP)
**Goal:** Basic saving and reading functionality

- [ ] Project setup (Next.js, TypeScript, Tailwind, shadcn/ui)
- [ ] Database schema and Supabase setup
- [ ] User authentication (email/password, OAuth)
- [ ] Basic UI layout (sidebar, content list, reader view)
- [ ] Manual URL adding
- [ ] Article extraction and reader mode
- [ ] Basic organization (inbox, archive, favorites)

### Phase 2: Podcasts
**Goal:** Full podcast support

- [ ] Podcast RSS feed subscription
- [ ] Episode listing and management
- [ ] Audio player with standard controls
- [ ] Playback speed, skip controls
- [ ] Progress tracking and sync
- [ ] Podcast discovery (optional: integrate Podcast Index)

### Phase 3: Enhanced Organization
**Goal:** Better content management

- [ ] Folders/Collections
- [ ] Tags system
- [ ] Full-text search
- [ ] Filters and sorting
- [ ] Bulk actions

### Phase 4: Browser Extension
**Goal:** One-click saving from anywhere

- [ ] Chrome extension
- [ ] Firefox extension
- [ ] Quick save popup
- [ ] Highlight and save selection

### Phase 5: Advanced Features
**Goal:** Power user features

- [ ] RSS feed imports (auto-add articles)
- [ ] Tweet/thread support
- [ ] Reading statistics
- [ ] Export/backup
- [ ] Keyboard shortcuts
- [ ] Mobile-optimized PWA

---

## UI/UX Wireframes

### Main Layout
```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo]  [Search...]                    [Add +]  [Settings]  [User]│
├──────────┬─────────────────────────────────────────────────────────┤
│          │                                                          │
│  INBOX   │  ┌────────────────────────────────────────────────────┐ │
│  (12)    │  │  Article Title Here                                │ │
│          │  │  source.com · 5 min read · 2 hours ago             │ │
│  Reading │  │  Preview text of the article goes here...          │ │
│  List    │  └────────────────────────────────────────────────────┘ │
│          │  ┌────────────────────────────────────────────────────┐ │
│  Podcasts│  │  🎧 Podcast Episode Title                          │ │
│  (3)     │  │  Podcast Name · 45 min · Yesterday                 │ │
│          │  └────────────────────────────────────────────────────┘ │
│  ────────│  ┌────────────────────────────────────────────────────┐ │
│  FOLDERS │  │  Another Article                                   │ │
│  > Work  │  │  another-source.com · 12 min read                  │ │
│  > Tech  │  └────────────────────────────────────────────────────┘ │
│  > Learn │                                                          │
│          │                                                          │
│  ────────│                                                          │
│  Archive │                                                          │
│          │                                                          │
├──────────┴─────────────────────────────────────────────────────────┤
│  🎧 Now Playing: Podcast Episode · 12:34 / 45:00  [◀][▶▶][▶]      │
└────────────────────────────────────────────────────────────────────┘
```

### Reader View
```
┌────────────────────────────────────────────────────────────────────┐
│  [← Back]                              [Archive] [Favorite] [More] │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                     Article Title Here                              │
│                                                                     │
│              By Author Name · source.com · Jan 15, 2025            │
│                         5 min read                                  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│      Lorem ipsum dolor sit amet, consectetur adipiscing elit.       │
│      Sed do eiusmod tempor incididunt ut labore et dolore magna    │
│      aliqua. Ut enim ad minim veniam, quis nostrud exercitation.   │
│                                                                     │
│      Duis aute irure dolor in reprehenderit in voluptate velit     │
│      esse cillum dolore eu fugiat nulla pariatur.                  │
│                                                                     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  Progress: ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  25%   │
└────────────────────────────────────────────────────────────────────┘
```

### Podcast Player (Expanded)
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    ┌─────────────────┐                              │
│                    │                 │                              │
│                    │   [Artwork]     │                              │
│                    │                 │                              │
│                    └─────────────────┘                              │
│                                                                     │
│                 Episode Title Goes Here                             │
│                      Podcast Name                                   │
│                                                                     │
│     ░░░░░░░░░░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
│              12:34                              45:00               │
│                                                                     │
│           [⏮ 15s]    [⏸ Pause]    [15s ⏭]                         │
│                                                                     │
│              Speed: [1x ▼]    Sleep: [Off ▼]                       │
│                                                                     │
│  Chapters:                                                          │
│  ────────────────────────────────────────────────────────────────  │
│  ▶ 0:00  - Introduction                                            │
│    5:30  - Main Topic                                               │
│    25:00 - Guest Interview                                          │
│    40:00 - Closing Thoughts                                         │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Add Content Modal
```
┌─────────────────────────────────────────────────────┐
│  Add Content                                    [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Article] [Podcast] [Tweet] [RSS Feed]             │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Paste URL here...                             │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Save to:  [Inbox ▼]                               │
│                                                     │
│  Tags:     [+ Add tag]                             │
│                                                     │
│                              [Cancel]  [Save]       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## API Routes Structure

```
/api
├── /auth
│   ├── login
│   ├── register
│   └── logout
├── /items
│   ├── GET    /           - List all items (with filters)
│   ├── POST   /           - Add new item
│   ├── GET    /:id        - Get single item
│   ├── PATCH  /:id        - Update item
│   ├── DELETE /:id        - Delete item
│   └── POST   /:id/parse  - Re-parse content
├── /podcasts
│   ├── GET    /           - List subscribed podcasts
│   ├── POST   /subscribe  - Subscribe to feed
│   ├── DELETE /:id        - Unsubscribe
│   └── POST   /:id/refresh - Refresh feed
├── /folders
│   ├── GET    /           - List folders
│   ├── POST   /           - Create folder
│   ├── PATCH  /:id        - Update folder
│   └── DELETE /:id        - Delete folder
├── /tags
│   ├── GET    /           - List tags
│   └── POST   /           - Create tag
├── /search
│   └── GET    /?q=        - Full-text search
└── /settings
    ├── GET    /           - Get user settings
    └── PATCH  /           - Update settings
```

---

## Competitive Analysis

| Feature | Instapaper | Pocket | Overcast | Your App |
|---------|------------|--------|----------|----------|
| Articles | ✅ | ✅ | ❌ | ✅ |
| Podcasts | ❌ | ❌ | ✅ | ✅ |
| Tweets | ❌ | ✅ | ❌ | ✅ |
| Reader mode | ✅ | ✅ | ❌ | ✅ |
| Browser ext | ✅ | ✅ | ❌ | ✅ |
| RSS feeds | ❌ | ❌ | ✅ | ✅ |
| Cloud sync | ✅ | ✅ | ✅ | ✅ |
| Free | Limited | Limited | Limited | ✅ |

**Your unique value:** One app for ALL content types instead of juggling multiple apps.

---

## Open Questions to Consider

1. **Monetization?** - Keep it personal/free, or plan for future paid features?
2. **Sharing?** - Should you be able to share collections publicly?
3. **AI features?** - Summarization, auto-tagging, recommendations?
4. **Mobile native?** - Start with PWA, add native apps later?
5. **Import/Export?** - Support importing from Instapaper, Pocket, etc.?

---

## Next Steps

1. **Validate the concept** - Is this the feature set you want?
2. **Set up the project** - Initialize Next.js with the recommended stack
3. **Design the database** - Create Supabase tables
4. **Build the MVP** - Phase 1 features first
5. **Iterate** - Add features based on actual usage

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Mozilla Readability](https://github.com/mozilla/readability)
- [Podcast Index API](https://podcastindex.org/)
- [Plasmo Extension Framework](https://www.plasmo.com/)
