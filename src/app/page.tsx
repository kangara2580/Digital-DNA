import { FloatingHelp } from "@/components/FloatingHelp";
import { Highlight24 } from "@/components/Highlight24";
import { MallTopNav } from "@/components/MallTopNav";
import { Sidebar } from "@/components/Sidebar";
import { VideoFeed } from "@/components/VideoFeed";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <MallTopNav />
      <Sidebar />
      <main className="min-w-0 pb-20 pt-1 md:pl-[148px]">
        <div className="mx-auto max-w-[1800px] px-0 sm:px-0">
          <VideoFeed />
        </div>
        <Highlight24 />
        <FloatingHelp />
      </main>
    </div>
  );
}
