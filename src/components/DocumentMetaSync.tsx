"use client";

import { useEffect } from "react";

type Props = {
  title: string;
  description: string;
};

/**
 * Corrects `<title>` and meta description when a route convention (e.g. global
 * `not-found`) does not merge locale-specific metadata in all Next versions.
 */
export function DocumentMetaSync({ title, description }: Props) {
  useEffect(() => {
    document.title = title;
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute("content", description);
  }, [title, description]);
  return null;
}
