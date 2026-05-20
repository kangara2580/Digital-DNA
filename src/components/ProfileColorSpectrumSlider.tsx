"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  PROFILE_COLOR_BLACK,
  normalizeProfileColorHex,
  positionFromProfileColor,
  profileColorAtPosition,
  PROFILE_SPECTRUM_GRADIENT,
} from "@/lib/profileColorSpectrum";

type Props = {
  valueHex: string;
  onChange: (hex: string) => void;
  className?: string;
};

function positionFromPointer(clientX: number, track: HTMLElement): number {
  const rect = track.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
}

export function ProfileColorSpectrumSlider({ valueHex, onChange, className = "" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const normalized = normalizeProfileColorHex(valueHex) ?? PROFILE_COLOR_BLACK;
  const position = useMemo(() => positionFromProfileColor(normalized), [normalized]);

  const applyPosition = useCallback(
    (t: number) => {
      onChange(profileColorAtPosition(t));
    },
    [onChange],
  );

  const onTrackPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      applyPosition(positionFromPointer(clientX, track));
    },
    [applyPosition],
  );

  const thumbLeft = `${position * 100}%`;

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={trackRef}
        className="relative h-3 w-full cursor-pointer rounded-full"
        style={{ background: PROFILE_SPECTRUM_GRADIENT }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onTrackPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          onTrackPointer(e.clientX);
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(position * 100)}
          onChange={(e) => applyPosition(Number(e.target.value) / 100)}
          aria-label="프로필 색상"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position * 100)}
          className="profile-spectrum-range absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 z-[2] block h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_6px_rgba(0,0,0,0.35)] [html[data-theme='light']_&]:border-white"
          style={{
            left: thumbLeft,
            backgroundColor: normalized,
          }}
        />
      </div>
    </div>
  );
}
