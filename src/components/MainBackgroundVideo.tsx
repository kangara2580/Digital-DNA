"use client";

export function MainBackgroundVideo() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "var(--background)" }}
      aria-hidden
    />
  );
}
