import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "약관 및 정책 — ARA",
  description: "Digital DNA의 AI·콘텐츠 서비스(ARA) 이용약관 및 관련 정책 안내",
};

const body =
  "mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600";

const lbl =
  "font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800";

const h2 =
  "text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900";

export default function LicensePage() {
  return (
    <FooterLegalPageShell
      title="약관 및 정책"
      withCard={false}
      mainMaxClass="max-w-3xl"
      showTitle={false}
      showBreadcrumb={false}
      contentTopClass="-mt-8 sm:-mt-10"
    >
      <section className="space-y-8 px-2 pb-10 sm:px-0">
        <header className="px-1 py-2">
          <h1 className="text-[clamp(1.52rem,3.6vw,2.2rem)] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900">
            약관 및 정책
          </h1>
        </header>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 1 조 (목적)</h2>
          <div className={body}>
            <p>
              본 약관은 Digital DNA(이하 &quot;당사&quot;)가 제공하는 AI 기반 영상 생성, 편집 및 콘텐츠 거래
              서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 당사와 이용자 간의 권리, 의무 및 책임사항을 규정함을
              목적으로 합니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 2 조 (크레딧 기반 이용 정책)</h2>
          <div className={body}>
            <p>
              당사는 선불 크레딧 시스템으로 서비스를 제공하며, 크레딧은 다음과 같이 구분됩니다.
            </p>
            <p>
              <span className={lbl}>유료 크레딧:</span> 이용자가 직접 결제하여 구매한 크레딧으로, 상법상
              소멸시효에 따라 구매일로부터 5년간 유효합니다.
            </p>
            <p>
              <span className={lbl}>무료 크레딧:</span> 이벤트, 프로모션, 정기 구독권 등에 의해 무상으로 지급된
              크레딧으로, 해당 지급 시 공지된 유효기간(예: 해당 월 말일) 내에만 사용 가능하며 이월되지 않고
              소멸합니다.
            </p>
            <p>
              <span className={lbl}>차감 원칙:</span> 서비스 이용 시 유효기간이 짧은 무료 크레딧이 우선
              차감됩니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 3 조 (청약철회 및 환불)</h2>
          <div className={body}>
            <p>
              <span className={lbl}>환불 조건:</span> 유료 결제 후 7일 이내에 사용 내역이 전혀 없는 크레딧에
              한해 청약철회가 가능합니다.
            </p>
            <p>
              <span className={lbl}>환불 불가:</span> 디지털 콘텐츠 특성상 결제 후 크레딧을 일부라도 사용하거나,
              결제 후 7일이 경과한 경우에는 환불이 불가합니다.
            </p>
            <p>
              <span className={lbl}>환불 수수료:</span> 이용자의 단순 변심에 의한 환불 시 결제 대행 수수료 및 송금
              수수료를 공제한 금액이 환불될 수 있습니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 4 조 (콘텐츠 권리 및 사용 범위)</h2>
          <div className={body}>
            <p>
              <span className={lbl}>저작권 귀속:</span> 생성된 콘텐츠의 저작권은 원칙적으로 이용자에게
              귀속됩니다.
            </p>
            <p>
              <span className={lbl}>당사의 사용권:</span> 이용자는 본 서비스를 통해 생성하거나 게시한 콘텐츠를
              당사가 서비스 홍보, AI 모델의 성능 개선 및 마케팅 목적으로 무상 활용(복제, 전시, 배포 등)하는 것에
              동의합니다.
            </p>
            <p>
              <span className={lbl}>라이선스 준수:</span> 이용자는 생성물을 본 약관 및 당사가 정한 라이선스
              범위 내에서만 사용해야 합니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 5 조 (이용자의 의무 및 금지 사항)</h2>
          <div className={body}>
            <p>
              다음 행위는 엄격히 금지되며, 위반 시 서비스 이용 제한 및 법적 책임을 물을 수 있습니다.
            </p>
            <p>
              <span className={lbl}>초상권 및 명예훼손:</span> 실존 인물의 동의 없는 얼굴, 음성 합성 등을 통한
              딥페이크 제작 및 유포.
            </p>
            <p>
              <span className={lbl}>불법 콘텐츠:</span> 도박, 성인물, 마약, 테러, 혐오 표현 등 관련 법령에
              위배되는 콘텐츠 제작.
            </p>
            <p>
              <span className={lbl}>권리 침해:</span> 타인의 저작물 무단 사용 및 시스템 해킹, API 무단 사용 행위.
            </p>
            <p>
              <span className={lbl}>보증:</span> 이용자는 등록하거나 생성한 콘텐츠가 제3자의 지식재산권 및
              초상권을 침해하지 않음을 보증해야 합니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 6 조 (책임 및 면책 조항)</h2>
          <div className={body}>
            <p>
              <span className={lbl}>기술 제공자의 지위:</span> 당사는 AI 생성 기술 및 플랫폼을 제공할 뿐이며,
              이용자가 생성하거나 업로드한 콘텐츠의 적법성을 보증하지 않습니다.
            </p>
            <p>
              <span className={lbl}>책임 귀속:</span> 생성물로 인해 발생하는 모든 법적 분쟁(초상권, 저작권 침해
              등)에 대한 책임은 전적으로 이용자에게 있습니다.
            </p>
            <p>
              <span className={lbl}>외부 플랫폼:</span> 외부 플랫폼(YouTube, TikTok 등)의 정책 변경으로 인한 수익
              제한이나 콘텐츠 삭제에 대해 당사는 책임을 지지 않습니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 7 조 (손해배상 및 구상권)</h2>
          <div className={body}>
            <p>
              이용자의 약관 위반으로 인하여 당사가 제3자로부터 법적 청구 또는 손해배상 책임을 부담하게 될 경우,
              당사는 해당 비용 및 손해에 대하여 이용자에게 구상권을 행사할 수 있습니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 8 조 (수사기관 협조)</h2>
          <div className={body}>
            <p>
              당사는 관련 법령에 따라 적법한 절차에 의한 요청이 있는 경우, 이용자의 서비스 이용 기록 및 관련
              정보를 수사기관에 제공할 수 있습니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 9 조 (개인정보 보호 및 보안)</h2>
          <div className={body}>
            <p>당사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.</p>
            <p>
              이용자는 자신의 계정 및 비밀번호에 대한 관리 책임을 가지며, 본인의 부주의로 인해 발생하는 도용 및
              정보 유출에 대해 당사는 책임을 지지 않습니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 10 조 (서비스의 중단 및 변경)</h2>
          <div className={body}>
            <p>
              당사는 시스템 점검, 교체, 고장 또는 운영상 상당한 이유가 있는 경우 서비스의 전부 또는 일부를
              일시적으로 중단할 수 있습니다.
            </p>
            <p>
              사업 종목의 전환, 사업의 포기, 업체 간의 통합 등의 이유로 서비스를 제공할 수 없게 되는 경우, 당사는
              사전에 공지하고 유료 크레딧의 처리 방안을 안내합니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 11 조 (약관 외 준칙)</h2>
          <div className={body}>
            <p>
              본 약관에 명시되지 않은 사항은 전기통신기본법, 전기통신사업법, 저작권법 및 기타 관련 법령의 규정에
              따릅니다.
            </p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 12 조 (재판권 및 준거법)</h2>
          <div className={body}>
            <p>
              당사와 이용자 간에 발생한 분쟁에 관한 소송은 당사의 본사 소재지를 관할하는 법원을 합의 관할 법원으로
              합니다.
            </p>
            <p>당사와 이용자 간에 제기된 소송에는 대한민국 법을 적용합니다.</p>
          </div>
        </article>

        <article className="border-t border-b border-white/15 pb-6 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className={h2}>제 13 조 (약관 변경)</h2>
          <div className={body}>
            <p>
              당사는 서비스 운영 및 법적 기준의 변경에 따라 본 약관을 수정할 수 있습니다.
            </p>
            <p>변경된 약관은 서비스 내 공지사항을 통해 게시하며, 게시 후 효력이 발생합니다.</p>
          </div>
        </article>
      </section>
    </FooterLegalPageShell>
  );
}
