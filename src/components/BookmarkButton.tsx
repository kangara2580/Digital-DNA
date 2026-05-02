"use client";

import { Bookmark } from "lucide-react";
import type { FeedVideo } from "@/data/videos";
import { useWishlist } from "@/context/WishlistContext";

type Props = {
  video: FeedVideo;
  /** false면 토글하지 않음 — 로그인 게이트·모달 등 */
  beforeToggle: () => boolean;
  /** 찜 미선택 시 버튼 루트 클래스 */
  buttonClassNameBase: string;
  /** 찜 상태일 때 `buttonClassNameBase`에 덧붙일 클래스 */
  buttonClassWhenBookmarked: string;
  iconClassWhenBookmarked: string;
  iconClassWhenDefault: string;
};

/**
 * 찜(bookmark/wishlist) 토글 — 낙관적 업데이트·서버 재조합은 WishlistProvider에서 처리.
 */
export function BookmarkButton({
  video,
  beforeToggle,
  buttonClassNameBase,
  buttonClassWhenBookmarked,
  iconClassWhenBookmarked,
  iconClassWhenDefault,
}: Props) {
  const { isSaved, toggle } = useWishlist();
  const bookmarked = isSaved(video.id);

  return (
    <button
      type="button"
      title={bookmarked ? "찜 해제" : "찜하기"}
      onClick={(e) => {
        e.preventDefault();
        if (!beforeToggle()) return;
        toggle(video);
      }}
      className={`${buttonClassNameBase}${bookmarked ? ` ${buttonClassWhenBookmarked}` : ""}`}
      aria-label={bookmarked ? "찜 해제" : "찜하기"}
      aria-pressed={bookmarked}
    >
      <Bookmark
        strokeWidth={2.25}
        className={bookmarked ? iconClassWhenBookmarked : iconClassWhenDefault}
      />
    </button>
  );
}
