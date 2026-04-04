export function SellerPitchBanner() {
  return (
    <section
      className="border-t border-slate-200/90 bg-gradient-to-b from-slate-50 via-white to-white"
      aria-label="판매자 안내"
    >
      <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 sm:py-14 md:py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[17px] font-medium leading-[1.65] tracking-tight text-slate-800 sm:text-[19px] md:text-[21px] md:leading-[1.6]">
            당신의 폰 속에 잠든{" "}
            <span className="font-bold text-[#0f172a]">&apos;망한 영상&apos;</span>
            , 누군가에겐{" "}
            <span className="font-bold text-[#0f172a]">간절한 한 조각</span>
            입니다.
          </p>
          <p className="mt-3 text-[17px] font-medium leading-[1.65] tracking-tight text-slate-800 sm:mt-4 sm:text-[19px] md:text-[21px] md:leading-[1.6]">
            지금 바로{" "}
            <span className="font-bold text-[#0f172a]">500원</span>에
            팔아보세요.
          </p>
        </div>
      </div>
    </section>
  );
}
