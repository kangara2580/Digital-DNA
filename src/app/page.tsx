import { CategoryBar } from "@/components/CategoryBar";
import { FloatingHelp } from "@/components/FloatingHelp";
import { HeroSearch } from "@/components/HeroSearch";
import { Sidebar } from "@/components/Sidebar";
import { VideoFeed } from "@/components/VideoFeed";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1600px] px-6 pb-16 pt-10 sm:px-8">
          <HeroSearch />
          <div className="mt-10">
            <CategoryBar />
          </div>
          <div className="mt-6">
            <VideoFeed />
          </div>
        </div>
        <FloatingHelp />
      </main>
    </div>
  );
}
