"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ContentList } from "@/components/content/content-list";
import { ReaderView } from "@/components/content/reader-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContentStore } from "@/store/content-store";

export default function Home() {
  const { selectedItemId } = useContentStore();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          {/* Content List */}
          <div className="w-full max-w-xl flex-shrink-0 overflow-hidden border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <ScrollArea className="h-full">
              <ContentList />
            </ScrollArea>
          </div>

          {/* Reader/Detail View */}
          <div className="hidden flex-1 overflow-hidden lg:block">
            <ReaderView />
          </div>
        </div>
      </div>

      {/* Mobile Reader Overlay */}
      {selectedItemId && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <ReaderView />
        </div>
      )}
    </div>
  );
}
