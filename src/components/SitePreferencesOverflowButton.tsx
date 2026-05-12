"use client";

import { MoreVertical } from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { SitePreferencesMenu } from "@/components/SitePreferencesMenu";
import { useTranslation } from "@/hooks/useTranslation";

/** `ReelsLeftRail` 네비 항목과 동일 톤(복제 — 순환 참조 방지) */
const railNavItemLink =
  "group flex w-full max-w-full flex-col items-center gap-1 rounded-xl px-2 py-2 no-underline outline-none transition-[background-color,transform] duration-200 hover:bg-white/[0.08] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--reels-abyss)] [html[data-theme='light']_&]:hover:bg-zinc-100/85";

const railNavItemLinkOpen =
  "bg-white/[0.05] hover:bg-white/[0.1] [html[data-theme='light']_&]:bg-zinc-100/55 [html[data-theme='light']_&]:hover:bg-zinc-100/90";

const railIconBtn =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-transparent text-zinc-300 transition-[color,transform] duration-200 group-hover:text-zinc-100 group-active:scale-[0.96] motion-reduce:transition-none motion-reduce:group-active:scale-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:group-hover:text-black";

const railItemLabelBase =
  "max-w-[3.75rem] cursor-pointer text-center text-[10px] font-medium leading-[1.2] tracking-tight transition-colors duration-200 group-hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:group-hover:text-zinc-950";

const topNavMoreBtnClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25 text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] motion-reduce:transition-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-100";

type Props = {
  /** 레일: 아이콘+「더보기」 / 상단: 아이콘만(좁은 화면) */
  variant: "rail" | "topNav";
};

export function SitePreferencesOverflowButton({ variant }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelBox, setPanelBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const placePanel = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 268;
    const margin = 8;
    let left = variant === "rail" ? rect.right + margin : rect.left;
    if (left + width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - width - margin);
    }
    const estHeight = 200;
    let top = rect.bottom + margin;
    if (top + estHeight > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - margin - estHeight);
    }
    setPanelBox({ top, left, width });
  }, [variant]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelBox(null);
      return;
    }
    placePanel();
  }, [open, placePanel]);

  useEffect(() => {
    if (!open) return;
    const onWin = () => placePanel();
    window.addEventListener("resize", onWin);
    return () => window.removeEventListener("resize", onWin);
  }, [open, placePanel]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const n = e.target as Node;
      if (btnRef.current?.contains(n) || panelRef.current?.contains(n)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel =
    open && mounted && panelBox ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-label={t("rail.moreAria")}
        style={{
          position: "fixed",
          top: panelBox.top,
          left: panelBox.left,
          width: panelBox.width,
          zIndex: 120,
        }}
        className="rounded-2xl border border-white/15 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
      >
        <SitePreferencesMenu layout="stack" />
      </div>
    ) : null;

  const isRail = variant === "rail";

  return (
    <Fragment>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("rail.moreAria")}
        className={
          isRail
            ? `${railNavItemLink} ${open ? railNavItemLinkOpen : ""}`
            : topNavMoreBtnClass
        }
      >
        <span className={isRail ? railIconBtn : "inline-flex items-center justify-center"}>
          <MoreVertical
            className={isRail ? "h-[30px] w-[30px]" : "h-[22px] w-[22px]"}
            strokeWidth={isRail ? 1.75 : 2}
            aria-hidden
          />
        </span>
        {isRail ? (
          <span className={`${railItemLabelBase} text-white/88`}>{t("rail.more")}</span>
        ) : null}
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </Fragment>
  );
}
