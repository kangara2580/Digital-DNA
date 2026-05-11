import { notFound, redirect } from "next/navigation";

/**
 * TEMP(창작 스튜디오 UI/UX 작업용)
 * — `npm run dev` 일 때만 동작. 프로덕션 빌드에서는 404.
 * — 열기: http://localhost:3000/dev/studio-ui → `/create?studioUiPreview=1`
 * — 작업 끝나면 이 파일(`src/app/dev/studio-ui/page.tsx`)과 `dev` 폴더를 삭제하면 됩니다.
 */
export default function DevStudioUiShortcutPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  redirect("/create?studioUiPreview=1");
}
