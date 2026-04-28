import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "이용약관 — ARA",
  description: "ARA 이용약관 (Terms of Service)",
};

export default function LicensePage() {
  return (
    <FooterLegalPageShell
      title="이용약관"
      withCard={false}
      mainMaxClass="max-w-3xl"
      showTitle={false}
      showBreadcrumb={false}
      contentTopClass="-mt-8 sm:-mt-10"
    >
      <section className="space-y-8 px-2 pb-10 sm:px-0">
        <header className="px-1 py-2">
          <h1 className="text-[clamp(1.52rem,3.6vw,2.2rem)] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900">
            이용약관
          </h1>
        </header>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 1 조 (목적)</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <p>ARA는 AI 기반 영상 생성 및 편집, 콘텐츠 거래 기능을 제공하는 플랫폼입니다.</p>
            <p>
              본 약관은 ARA(이하 &quot;당사&quot;, &quot;저희&quot; 또는 &quot;우리&quot;)가 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
            <p>서비스를 이용하시면 본 이용약관에 동의하신 것으로 간주됩니다.</p>
            <p>약관 내용을 확인하신 후 서비스를 이용해 주세요.</p>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 2 조 (크레딧 기반 이용 정책)</h2>
          <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <p>
              ARA는 선불 크레딧 기반(Prepaid Credit System)으로 서비스를 제공합니다.
              <br />
              이용자는 크레딧을 구매하여 AI 영상 생성 및 편집 기능을 이용할 수 있습니다.
            </p>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">1. 서비스 이용 구조</span>
              <br />
              이용자는 크레딧을 구매하여 계정에 충전할 수 있습니다.
              <br />
              충전된 크레딧은 사용 시점에 따라 차감됩니다.
              <br />
              모든 기능은 크레딧 기반으로 제공됩니다.
            </p>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">2. 크레딧 사용 범위</span>
              <br />
              크레딧은 다음 기능 이용 시 차감됩니다:
            </p>
            <ul className="-mt-1 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
              <li>• AI 영상 생성</li>
              <li>• 영상 편집 및 스타일 변환</li>
              <li>• 얼굴 / 배경 / 객체 변환</li>
              <li>• 고화질 렌더링</li>
              <li>• 기타 ARA AI 기능</li>
            </ul>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">3. 크레딧 유효기간</span>
              <br />
              구매한 크레딧은 소멸되지 않으며 계정에 영구 보관됩니다.
              <br />
              단, 회사 정책 변경 시 사전 공지 후 조정될 수 있습니다.
            </p>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">4. 크레딧 할인 정책</span>
              <br />
              크레딧은 대량 구매 시 할인 혜택이 적용됩니다.
              <br />
              할인율은 구매 수량 및 프로모션 정책에 따라 달라질 수 있습니다.
            </p>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">5. 환불 정책</span>
              <br />
              이미 사용된 크레딧은 환불되지 않습니다.
              <br />
              미사용 크레딧에 한해 관련 법령 및 결제 정책에 따라 환불이 제한될 수 있습니다.
            </p>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">6. 이용 제한</span>
              <br />
              다음의 경우 서비스 이용이 제한될 수 있습니다:
            </p>
            <ul className="-mt-1 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
              <li>• 불법 콘텐츠 제작 및 유통</li>
              <li>• 타인의 권리 침해</li>
              <li>• 시스템 악용 또는 비정상적인 사용</li>
              <li>• 서비스 안정성을 해치는 행위</li>
            </ul>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 3 조 (콘텐츠 권리 및 사용 범위)</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 이용자는 생성된 콘텐츠를 본 약관 범위 내에서 사용할 권리를 가집니다.</li>
            <li>• 콘텐츠의 저작권은 원칙적으로 이용자에게 귀속되나, 사용 권한은 해당 라이선스 범위에 따릅니다.</li>
            <li>• 라이선스 종료 이후에도 이미 게시된 콘텐츠는 유지할 수 있으나, 새로운 활용은 해당 시점의 라이선스를 따라야 합니다.</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 4 조 (외부 URL 연동 및 소유권 확인)</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 이용자가 외부 플랫폼의 영상(URL)을 등록할 경우, 해당 콘텐츠에 대한 정당한 권리를 보유해야 합니다.</li>
            <li>• 회사는 소유권 확인을 위해 다음과 같은 인증 방식을 요구할 수 있습니다: OAuth 기반 계정 연동</li>
            <li>• 이용자는 등록한 콘텐츠가 제3자의 권리를 침해하지 않음을 보증합니다.</li>
            <li>• 권리 침해가 발생한 경우, 해당 책임은 이용자에게 있습니다.</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 5 조 (금지 사항)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">다음 행위는 엄격히 금지됩니다:</p>
          <ul className="mt-2 space-y-2 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 불법 콘텐츠 제작 및 유통 (도박, 성인물, 마약, 테러, 혐오 표현 등)</li>
            <li>• 타인의 저작물 무단 사용 또는 도용</li>
            <li>• 동의 없는 실존 인물의 얼굴/음성/신체를 이용한 AI 합성</li>
            <li>• 시스템 해킹, API 무단 사용, 자동화 공격</li>
            <li>• 생성 콘텐츠 및 기술을 AI 학습 데이터로 사용하는 행위</li>
            <li>• 서비스 내 콘텐츠의 무단 재판매 또는 재배포</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 6 조 (책임 및 면책 조항)</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 이용자는 자신의 콘텐츠 제작 및 사용에 대한 모든 책임을 부담합니다.</li>
            <li>• 회사는 이용자가 생성하거나 업로드한 콘텐츠의 적법성을 보증하지 않습니다.</li>
            <li>• 외부 플랫폼 정책 변경으로 인한 수익 제한, 삭제 등에 대해 회사는 책임을 지지 않습니다.</li>
            <li>• 이용자 간 또는 제3자와의 분쟁은 당사자 간 해결을 원칙으로 합니다.</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 7 조 (손해배상 및 책임 제한)</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>
              • 이용자의 약관 위반으로 인해 회사가 제3자로부터 법적 분쟁, 손해배상 청구 또는 비용을 부담하게 되는 경우,
              <br />
              회사는 해당 범위 내에서 이용자에게 구상권을 행사할 수 있습니다.
            </li>
            <li>• 회사는 서비스 이용과 관련하여 발생한 간접 손해(기대 수익 손실, 데이터 손실 등)에 대해 책임을 지지 않습니다.</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 8 조 (수사기관 협조)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 관련 법령에 따라 적법한 요청이 있는 경우, 이용자의 서비스 이용 기록 및 관련 정보를 수사기관에 제공할 수 있습니다.
          </p>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 9 조 (크레딧 정책)</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 매월 지급되는 크레딧은 해당 월 말일에 소멸되며 이월되지 않습니다.</li>
            <li>• 추가 구매한 크레딧은 별도 정책에 따릅니다.</li>
            <li>• 크레딧은 환불되지 않습니다.</li>
            <li>• 크레딧 사용 기준은 서비스 내 정책에 따릅니다.</li>
          </ul>
        </article>

        <article className="border-t border-b border-white/15 pb-6 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 10 조 (약관 변경)</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 회사는 서비스 운영 및 법적 기준 변경에 따라 본 약관을 수정할 수 있습니다.</li>
            <li>• 변경된 약관은 서비스 내 공지 후 효력이 발생합니다.</li>
          </ul>
        </article>
      </section>
    </FooterLegalPageShell>
  );
}
