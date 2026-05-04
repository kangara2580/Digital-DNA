"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";

export function NoticeComposer() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session, loading } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("body", body);
      form.set("pinned", pinned ? "true" : "false");
      images.forEach((file) => form.append("images", file));

      const res = await fetch("/api/notices", {
        method: "POST",
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: form,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok) {
        setError(json.error ?? t("notice.postFail"));
        return;
      }
      setDone(t("notice.posted"));
      setTitle("");
      setBody("");
      setImages([]);
      setShowImagePicker(false);
      setPinned(false);
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-b border-white/15 pb-6 [html[data-theme='light']_&]:border-zinc-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[clamp(1.25rem,2.8vw,1.75rem)] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900">
            {t("notice.pageTitle")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-white/20 px-3 py-2 text-[13px] font-semibold text-white transition hover:border-white/35 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-900"
        >
          {open ? t("notice.close") : t("notice.write")}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("notice.titlePh")}
            className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-500 focus:border-white/40 focus:outline-none [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-900"
            maxLength={120}
            required
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("notice.bodyPlaceholder")}
            className="min-h-[180px] w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-[14px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-white/40 focus:outline-none [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-900"
            required
          />
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowImagePicker((v) => !v)}
              className="rounded-md border border-white/20 px-3 py-1.5 text-[12px] font-semibold text-zinc-200 transition hover:border-white/35 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-800"
            >
              {showImagePicker ? t("notice.imageAttachClose") : t("notice.imageAttach")}
            </button>
            {showImagePicker ? (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files ?? []))}
                className="block w-full text-[13px] text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-zinc-900 [html[data-theme='light']_&]:text-zinc-700"
              />
            ) : null}
            {images.length > 0 ? (
              <p className="text-[12px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                {t("notice.imagesAttachedCount", { n: images.length })}
              </p>
            ) : null}
          </div>
          <label className="inline-flex items-center gap-2 text-[13px] text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 accent-zinc-300 [html[data-theme='light']_&]:accent-zinc-700"
            />
            {t("notice.pin")}
          </label>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting || loading}
              className="rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t("notice.submitting") : t("notice.publish")}
            </button>
            {error ? <p className="text-[12px] text-reels-crimson">{error}</p> : null}            {done ? <p className="text-[12px] text-emerald-400">{done}</p> : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
