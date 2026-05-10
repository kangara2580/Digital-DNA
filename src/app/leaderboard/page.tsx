import { LeaderboardClient } from "@/components/LeaderboardClient";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.leaderboard",
    descriptionKey: "meta.leaderboardDescription",
  });
}

export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height,4.5rem))] bg-transparent">
      <LeaderboardClient />
    </div>
  );
}
