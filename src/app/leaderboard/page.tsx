import { LeaderboardClient } from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height,4.5rem))] bg-transparent">
      <LeaderboardClient />
    </div>
  );
}
