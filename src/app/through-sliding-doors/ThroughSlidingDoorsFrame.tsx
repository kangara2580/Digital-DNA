"use client";

import { useEffect, useState } from "react";

export function ThroughSlidingDoorsFrame() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    setSrc(`/tsd-mirror/index.html?fresh=${Date.now()}`);
  }, []);

  return (
    <main style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#7db5c5" }}>
      {src ? (
        <iframe
          key={src}
          title="Through Sliding Doors"
          src={src}
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
            background: "#7db5c5",
          }}
          allow="autoplay; fullscreen"
        />
      ) : null}
    </main>
  );
}
