"use client";

import Link from "next/link";
import { ProfileColorAvatar } from "@/components/ProfileColorAvatar";
import {
  type ReviewAuthorProfile,
  reviewAuthorFeedHref,
} from "@/lib/reviewAuthorProfileShared";

export function ReviewUserIdentity({
  author,
  size = "md",
}: {
  author: ReviewAuthorProfile;
  size?: "md" | "sm";
}) {
  const dim = size === "sm" ? "h-6 w-6" : size === "md" ? "h-9 w-9" : "h-7 w-7";
  const nameCls =
    size === "sm"
      ? "truncate text-[11px] font-bold"
      : "truncate text-[13px] font-bold";
  const initial = author.displayName.slice(0, 1).toUpperCase();
  const href = reviewAuthorFeedHref(author.userId);
  const uploadUrl =
    author.avatarKind === "upload" && author.avatarCustom
      ? author.avatarCustom
      : null;

  return (
    <Link
      href={href}
      className={`group inline-flex min-w-0 max-w-full items-center transition-opacity hover:opacity-90 ${size === "sm" ? "gap-1.5" : "gap-2.5"}`}
      onClick={(e) => e.stopPropagation()}
    >
      {uploadUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={uploadUrl}
          alt=""
          className={`${dim} shrink-0 rounded-full object-cover ring-1 ring-white/20 [html[data-theme='light']_&]:ring-zinc-200`}
        />
      ) : (
        <ProfileColorAvatar
          hex={author.profileColor}
          initial={initial}
          sizeClass={dim}
          className="ring-1 ring-white/20 [html[data-theme='light']_&]:ring-zinc-200"
          label={`${author.displayName} 프로필`}
        />
      )}
      <span
        className={`${nameCls} text-zinc-200 group-hover:underline [html[data-theme='light']_&]:text-zinc-900`}
      >
        {author.displayName}
      </span>
    </Link>
  );
}
