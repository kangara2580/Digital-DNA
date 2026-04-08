import Link from "next/link";
import { DEMO_FACE_PROFILES } from "@/data/demoFaceProfiles";

export const metadata = {
  title: "마이페이지 — REELS MARKET",
};

export default function MyPage() {
  return (
    <main className="mx-auto min-h-[50vh] max-w-3xl px-4 py-12 text-zinc-100 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-extrabold tracking-tight">마이페이지</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-zinc-500">
        판매 수익·정산·내 클립 관리는 여기로 모을 예정입니다. 창작 탭에서 쓸{" "}
        <strong className="text-zinc-300">프로필 얼굴</strong>은 아래에 등록해 두세요 (데모 이미지).
      </p>

      <section className="mt-10 reels-glass-card rounded-2xl p-5 sm:p-6" aria-labelledby="profiles-heading">
        <h2 id="profiles-heading" className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          창작용 프로필 사진
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
          AI 리스킨 시 Gemini가 이 얼굴을 모션에 입힙니다.{" "}
          <Link href="/create?videoId=1" className="text-reels-cyan/90 hover:underline">
            창작 스튜디오
          </Link>
          에서도 동일 세트를 선택할 수 있어요.
        </p>
        <ul className="mt-4 flex flex-wrap gap-4">
          {DEMO_FACE_PROFILES.map((p) => (
            <li key={p.id} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt=""
                className="mx-auto h-20 w-20 rounded-full border border-white/12 object-cover"
              />
              <p className="mt-1.5 text-[11px] font-medium text-zinc-500">{p.label}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
