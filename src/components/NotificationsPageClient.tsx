"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatListingPriceWon } from "@/lib/gemDisplay";
import type { SiteLocale } from "@/lib/sitePreferences";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  status: string; // "PENDING" | "ACCEPTED"
  oldPrice: number;
  newPrice: number;
  createdAt: string;
  video: {
    id: string;
    title: string;
    poster: string;
    price: number;
  };
};

export function NotificationsPageClient({ userId }: { userId: string }) {
  const { locale } = useTranslation();
  const loc = locale as SiteLocale;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?sellerId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      setError("알림을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // silent fail
    }
  };

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      // Fetch CSRF token first
      const csrfRes = await fetch("/api/csrf-token");
      const csrfData = await csrfRes.json();

      const res = await fetch(`/api/notifications/${id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfData.csrfToken,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "accept_failed");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: "ACCEPTED", read: true } : n,
        ),
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "제안 수락에 실패했습니다.",
      );
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400">불러오는 중...</div>
    );
  }

  if (error) {
    return <div className="py-12 text-center text-red-400">{error}</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 py-16 text-center text-zinc-500 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-400">
        아직 알림이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`rounded-xl border p-4 transition ${
            notif.read
              ? "border-white/5 bg-white/[0.01] [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50"
              : "border-[#FF2D8D]/30 bg-[#FF2D8D]/5"
          }`}
          onClick={() => !notif.read && handleMarkRead(notif.id)}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF2D8D]/10 text-lg">
              {notif.type === "PRICE_SUGGEST" ? "💡" : "🔔"}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{notif.title}</span>
                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-[#FF2D8D]" />
                )}
                {notif.status === "ACCEPTED" && (
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                    수락됨
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                {notif.body}
              </p>

              {/* Video info */}
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                {notif.video.poster && (
                  <img
                    src={notif.video.poster}
                    alt=""
                    className="h-8 w-6 rounded object-cover"
                  />
                )}
                <span className="truncate">{notif.video.title}</span>
              </div>

              {/* Price change */}
              {notif.type === "PRICE_SUGGEST" && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-zinc-500 line-through">
                    {formatListingPriceWon(loc, notif.oldPrice) ?? "—"}
                  </span>
                  <span className="text-[#FF2D8D] font-semibold">
                    → {formatListingPriceWon(loc, notif.newPrice) ?? "—"}
                  </span>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-xs text-zinc-500">
                {new Date(notif.createdAt).toLocaleString("ko-KR")}
              </div>

              {/* Accept button for pending */}
              {notif.status === "PENDING" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(notif.id);
                  }}
                  disabled={acceptingId === notif.id}
                  className="mt-3 rounded-lg bg-[#FF2D8D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0267d] disabled:opacity-50"
                >
                  {acceptingId === notif.id ? "처리 중..." : "제안 수락"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
