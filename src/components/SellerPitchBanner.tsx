import Link from "next/link";
import { Download, Link2, PencilRuler, PlayCircle, Tag, WandSparkles } from "lucide-react";

export function SellerPitchBanner() {
  return (
    <section
      className="relative bg-reels-void/50"
      aria-labelledby="seller-pitch-heading"
    >
      <div className="relative mx-auto max-w-[1800px] px-4 pb-[14px] pt-[44px] sm:px-6 sm:pb-[20px] sm:pt-[60px] lg:px-8 lg:pb-[24px] lg:pt-[76px]">
        <div className="relative mx-auto w-full max-w-[1600px] overflow-visible rounded-2xl bg-transparent px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_50%,rgba(58,143,255,0.12)_0%,rgba(3,10,25,0)_72%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[26%] top-[8%] h-72 w-72 rounded-full bg-white/18 blur-[110px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-[8%] top-[64%] h-24 w-24 rounded-full bg-[#caeeff]/28 blur-3xl"
            aria-hidden
          />

          <div className="hidden">
            <p className="text-center text-[clamp(1.3rem,2.8vw,1.95rem)] font-semibold tracking-tight text-zinc-100">
              이렇게 이용해 보세요
            </p>
            <ol className="hidden">
              <li className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="relative rounded-xl border border-white/30 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span
                    className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block"
                    aria-hidden
                  />
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-start"><Link2 className="h-4 w-4" />1. 등록</p>
                  <p>
                    플랫폼 URL을 불러오시거나
                    <br />
                    직접 영상을 올려 주세요.
                  </p>
                </div>
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-white/40 bg-[#0b1220] text-lg font-semibold text-zinc-100 shadow-[0_0_0_4px_rgba(7,15,31,0.95)]">
                  A
                </div>
                <div className="hidden lg:block" />
              </li>
              <li className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="hidden lg:block" />
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-white/40 bg-[#0b1220] text-lg font-semibold text-zinc-100 shadow-[0_0_0_4px_rgba(7,15,31,0.95)]">
                  B
                </div>
                <div className="relative rounded-xl border border-white/30 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span
                    className="pointer-events-none absolute -left-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-white/30 bg-[#070f1f] lg:block"
                    aria-hidden
                  />
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-end"><WandSparkles className="h-4 w-4" />2. 재창작</p>
                  <p>ARA AI로 배경, 얼굴, 몸을 자연스럽게 편집해 2차 창작까지 완성해 보세요.</p>
                </div>
              </li>
              <li className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="relative rounded-xl border border-white/30 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span
                    className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block"
                    aria-hidden
                  />
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-start"><WandSparkles className="h-4 w-4" />3. 재창작</p>
                  <p>ARA AI로 배경, 얼굴, 몸을 자연스럽게 편집해 2차 창작까지 완성해 보세요.</p>
                </div>
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-white/40 bg-[#0b1220] text-lg font-semibold text-zinc-100 shadow-[0_0_0_4px_rgba(7,15,31,0.95)]">
                  C
                </div>
                <div className="hidden lg:block" />
              </li>
            </ol>

            <div className="relative mx-auto mt-8 w-full max-w-[1280px] sm:mt-10">
              <div
                className="pointer-events-none absolute bottom-8 left-1/2 top-8 hidden w-px -translate-x-1/2 bg-white/28 lg:block"
                aria-hidden
              />
              <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
                <div className="relative border border-white/28 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block" aria-hidden />
                  <p className="font-semibold text-white">1. 등록</p>
                  <p>플랫폼 URL을 불러오시거나 직접 영상을 올려 주세요.</p>
                </div>
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">A</div>
                <div className="hidden lg:block" />
                <div className="hidden lg:block" />
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">B</div>
                <div className="relative border border-white/28 bg-white/[0.03] px-5 py-4 text-center lg:text-right">
                  <span className="pointer-events-none absolute -left-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-white/30 bg-[#070f1f] lg:block" aria-hidden />
                  <p className="font-semibold text-white">2. 거래</p>
                  <p>필요한 영상을 구매하시거나 내 영상을 판매하실 수 있어요.</p>
                </div>
                <div className="relative border border-white/28 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block" aria-hidden />
                  <p className="font-semibold text-white">3. 재창작</p>
                  <p>ARA AI로 배경, 얼굴, 몸을 자연스럽게 편집해 2차 창작까지 완성해 보세요.</p>
                </div>
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">C</div>
                <div className="hidden lg:block" />
              </div>
            </div>

            <div className="mt-14 text-center sm:mt-16">
              <p className="mt-3 text-[clamp(2.1rem,5.6vw,4rem)] font-black tracking-[0.1em] text-white [text-shadow:0_0_22px_rgba(143,208,255,0.22)]">
                ARA
              </p>
            </div>
          </div>

          <div className="hidden">
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">1. 등록</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cyan-300" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">플랫폼 URL을 불러오시거나 직접 영상을 올려 주세요.</p></div>
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">2. 거래</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cyan-300" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">필요한 영상을 구매하시거나 내 영상을 판매하실 수 있어요.</p></div>
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">3. 재창작</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cyan-300" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">ARA AI로 배경, 얼굴, 몸을 자연스럽게 편집해 2차 창작까지 완성해 보세요.</p></div>
          </div>

          <div className="relative mt-4 sm:mt-6">
            <div className="mx-auto mt-7 w-full max-w-[1120px] sm:mt-8">
              <div className="space-y-5 sm:space-y-6">
                <p className="mb-4 text-center text-[clamp(1.9rem,4vw,2.9rem)] font-semibold tracking-tight text-zinc-100 sm:mb-6">
                  단 3단계로
                </p>
                <div className="relative overflow-hidden rounded-[22px] border border-white/28 bg-white/[0.03] px-5 py-6 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.45)] sm:px-6 sm:py-7 lg:px-7 lg:py-8">
                  <div className="pointer-events-none absolute inset-y-8 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#62beff]/80 to-transparent lg:block" aria-hidden />
                  <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                    <section className="space-y-5">
                      <p className="pt-1 text-left text-[clamp(1.2rem,2.5vw,1.45rem)] font-medium tracking-tight text-zinc-300">
                        원하는 영상 AI로 재창작해서 사용하기
                      </p>
                      <p className="pb-1 text-left text-[18px] font-extrabold tracking-tight text-white sm:text-[20px]">사용자</p>
                      <ol className="relative space-y-4">
                        <div
                          className="pointer-events-none absolute bottom-5 left-5 top-5 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"
                          aria-hidden
                        />
                        <li className="flex items-start gap-3">
                          <span className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/22 bg-[#0b1324] text-white">
                            <PlayCircle className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-[16px] font-bold text-white">1. 영상 선택</p>
                            <p className="mt-1 text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">마켓에서 원하는 영상을 찾아보세요.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/22 bg-[#0b1324] text-white">
                            <PencilRuler className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-[16px] font-bold text-white">2. AI로 커스터마이징</p>
                            <p className="mt-1 text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">배경, 얼굴, 스타일을 자유롭게 변경하세요.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/22 bg-[#0b1324] text-white">
                            <Download className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-[16px] font-bold text-white">3. 다운로드 &amp; 활용</p>
                            <p className="mt-1 text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">완성된 영상을 다운로드해 바로 활용하세요.</p>
                          </div>
                        </li>
                      </ol>
                    </section>

                    <section className="space-y-5">
                      <p className="pt-1 text-right text-[clamp(1.2rem,2.5vw,1.45rem)] font-medium tracking-tight text-zinc-300">
                        원하는 영상 판매해서 수익 만들기
                      </p>
                      <p className="pb-1 text-right text-[18px] font-extrabold tracking-tight text-white sm:text-[20px]">크리에이터</p>
                      <ol className="relative space-y-4">
                        <div
                          className="pointer-events-none absolute bottom-5 right-5 top-5 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"
                          aria-hidden
                        />
                        <li className="flex items-start justify-end gap-3 text-right">
                          <span className="relative z-10 order-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/22 bg-[#0b1324] text-white">
                            <Link2 className="h-5 w-5" />
                          </span>
                          <div className="max-w-[520px]">
                            <p className="text-[16px] font-bold text-white">1. 영상 등록</p>
                            <p className="mt-1 text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">직접 업로드 또는 URL을 붙여넣어 영상을 등록하세요.</p>
                          </div>
                        </li>
                        <li className="flex items-start justify-end gap-3 text-right">
                          <span className="relative z-10 order-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/22 bg-[#0b1324] text-white">
                            <Tag className="h-5 w-5" />
                          </span>
                          <div className="max-w-[520px]">
                            <p className="text-[16px] font-bold text-white">2. 가격 설정</p>
                            <p className="mt-1 text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">원하는 가격을 설정하세요.</p>
                          </div>
                        </li>
                        <li className="flex items-start justify-end gap-3 text-right">
                          <span className="relative z-10 order-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/22 bg-[#0b1324] text-white">
                            <WandSparkles className="h-5 w-5" />
                          </span>
                          <div className="max-w-[520px]">
                            <p className="text-[16px] font-bold text-white">3. 판매 시작</p>
                            <p className="mt-1 text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">플랫폼에 공개하면 누구나 구매할 수 있습니다.</p>
                          </div>
                        </li>
                      </ol>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-[5.8rem] flex flex-col items-center gap-7 text-center lg:text-center sm:mt-[6.3rem]">
            <div className="min-w-0 lg:w-auto lg:flex-none">
              <div className="flex items-center justify-center gap-4">
                <div className="min-w-0">
                  <div className="mt-[20px] flex justify-center">
                    <Link
                      href="/"
                      className="pointer-events-auto relative inline-flex min-w-[188px] items-center justify-center overflow-hidden rounded-full border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_18%,rgba(9,12,18,0.86)_58%,rgba(10,12,17,0.96)_100%)] px-7 py-2.5 text-[1.65rem] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-300 hover:border-white/55 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(255,255,255,0.18),0_14px_34px_rgba(0,0,0,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                    >
                      <span
                        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/75 to-transparent"
                        aria-hidden
                      />
                      <span
                        className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
                        aria-hidden
                      />
                      <span className="relative z-10">시작하기</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
