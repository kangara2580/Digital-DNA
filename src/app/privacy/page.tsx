import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "개인정보처리방침 — ARA",
  description: "ARA 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <FooterLegalPageShell
      title="개인정보처리방침"
      withCard={false}
      mainMaxClass="max-w-3xl"
      showBreadcrumb={false}
      showTitle={false}
      contentTopClass="-mt-8 sm:-mt-10"
    >
      <section className="space-y-8 px-2 pb-10 sm:px-0">
        <header className="px-1 py-2">
          <h1 className="text-[clamp(1.52rem,3.6vw,2.2rem)] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900">
            개인정보 처리방침
          </h1>
          <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            최종 업데이트: 2026년 4월 28일
          </p>
        </header>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 1 조 (총칙)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            ARA(이하 “회사”)는 이용자의 개인정보 보호를 중요하게 생각하며 「개인정보 보호법」 등 관련 법령을 준수합니다.
            <br />
            본 개인정보 처리방침은 회사가 제공하는 AI 기반 영상 생성 및 콘텐츠 거래 서비스 이용 과정에서 개인정보가 어떻게 수집, 이용,
            <br />
            보호되는지를 설명합니다.
          </p>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 2 조 (수집하는 개인정보 항목)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집할 수 있습니다.
          </p>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">1. 간편 로그인 정보 (OAuth 기반)</span>
              <br />
              본 서비스는 이메일/비밀번호 기반 회원가입을 제공하지 않으며, 외부 계정을 통한 간편 로그인 방식을 사용합니다.
            </p>
            <ul className="-mt-1 space-y-1 pl-4">
              <li>• Google 계정 고유 식별자 및 프로필 정보</li>
              <li>• Kakao 계정 고유 식별자 및 프로필 정보</li>
              <li>• (추후) Apple 등 추가 로그인 제공자 정보</li>
            </ul>

            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">2. 기본 사용자 정보</span>
            </p>
            <ul className="-mt-1 space-y-1 pl-4">
              <li>• 서비스 내부 사용자 고유 ID (ARA User ID)</li>
              <li>• 닉네임 또는 표시명</li>
              <li>• 프로필 이미지 (선택 또는 공개 정보)</li>
              <li>• 로그인 기록 및 접속 정보 (IP, 기기 정보, 접속 시간 등)</li>
            </ul>

            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">3. 서비스 이용 정보</span>
            </p>
            <ul className="-mt-1 space-y-1 pl-4">
              <li>• 영상 생성 및 편집 기록</li>
              <li>• 업로드된 콘텐츠 및 URL 정보</li>
              <li>• 크레딧 사용 내역</li>
              <li>• 다운로드 및 저장 기록</li>
            </ul>

            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">4. 결제 정보</span>
            </p>
            <ul className="-mt-1 space-y-1 pl-4">
              <li>• 크레딧 구매 및 결제 내역</li>
              <li>• 결제 승인 정보</li>
              <li>• 결제 대행사(PG사)를 통한 거래 정보</li>
            </ul>
            <p>※ 카드 정보 등 민감 결제 정보는 회사가 직접 저장하지 않습니다.</p>

            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">5. 외부 콘텐츠(URL) 정보</span>
            </p>
            <p>이용자가 외부 플랫폼 링크를 등록할 경우 다음 정보가 수집될 수 있습니다:</p>
            <ul className="-mt-1 space-y-1 pl-4">
              <li>• 등록된 영상 URL</li>
              <li>• 콘텐츠 메타데이터 (제목, 썸네일 등)</li>
              <li>• 업로드 기록 및 사용 내역</li>
            </ul>
          </div>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 3 조 (개인정보 이용 목적)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 수집한 개인정보를 다음 목적을 위해 사용합니다:
          </p>
          <ul className="mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 회원 식별 및 서비스 제공</li>
            <li>• AI 영상 생성 및 편집 기능 제공</li>
            <li>• 크레딧 관리 및 결제 처리</li>
            <li>• 서비스 이용 기록 관리</li>
            <li>• 부정 이용 방지 및 보안 유지</li>
            <li>• 고객 문의 대응</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 4 조 (개인정보 보유 및 이용 기간)</h2>
          <ul className="mt-3 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 회원 탈퇴 시 개인정보는 지체 없이 삭제됩니다.</li>
            <li>• 단, 아래 정보는 관련 법령에 따라 일정 기간 보관됩니다:</li>
            <li className="pl-3">- 결제 및 거래 기록: 5년</li>
            <li className="pl-3">- 서비스 이용 로그: 3개월 ~ 1년</li>
            <li className="pl-3">- 부정 이용 관련 기록: 필요 시 별도 보관</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 5 조 (개인정보 제3자 제공)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 원칙적으로 개인정보를 외부에 제공하지 않습니다.
            <br />
            단, 다음 경우에 한해 제공될 수 있습니다:
          </p>
          <ul className="mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 이용자의 동의가 있는 경우</li>
            <li>• 법령에 따른 수사기관 요청</li>
            <li>• 결제 처리 목적의 외부 결제 대행사(PG사)</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 6 조 (외부 플랫폼 및 연동 정보)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 서비스 제공 및 기능 개선을 위해 외부 플랫폼 정보를 활용할 수 있습니다.
          </p>
          <ul className="mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 계정 식별 및 로그인 인증</li>
            <li>• 서비스 이용 분석</li>
            <li>• 콘텐츠 업로드 기능 제공</li>
          </ul>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 외부 플랫폼 콘텐츠를 임의로 공개하거나 재배포하지 않습니다.
          </p>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 7 조 (개인정보 보호 조치)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 개인정보 보호를 위해 다음과 같은 조치를 시행합니다:
          </p>
          <ul className="mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 데이터 암호화 저장</li>
            <li>• 접근 권한 최소화</li>
            <li>• 보안 서버 운영</li>
            <li>• 침입 탐지 및 보안 시스템 운영</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 8 조 (쿠키 및 로그 데이터)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 서비스 개선 및 안정적인 운영을 위해 쿠키 및 로그 데이터를 사용할 수 있습니다.
          </p>
          <ul className="mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 서비스 이용 분석</li>
            <li>• 오류 개선 및 성능 향상</li>
            <li>• 사용자 경험 개선</li>
          </ul>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
            <br />
            단, 쿠키 비활성화 시 일부 기능이 제한될 수 있습니다.
          </p>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 9 조 (크레딧 시스템 관련 정보)</h2>
          <ul className="mt-3 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 크레딧은 선불 충전 방식으로 제공됩니다.</li>
            <li>• 구매한 크레딧은 계정에 유지되며 사용 시 차감됩니다.</li>
            <li>• 크레딧 사용 내역은 서비스 내에서 관리됩니다.</li>
            <li>• 크레딧은 환불 정책에 따라 제한될 수 있습니다.</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 10 조 (개인정보 파기 절차)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            개인정보는 이용 목적 달성 시 지체 없이 파기됩니다.
          </p>
          <ul className="mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 전자 데이터: 복구 불가능한 방식으로 삭제</li>
            <li>• 물리적 데이터: 분쇄 또는 소각 처리</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 11 조 (이용자의 권리)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            이용자는 언제든지 다음 권리를 행사할 수 있습니다:
          </p>
          <ul className="mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 개인정보 조회</li>
            <li>• 수정</li>
            <li>• 삭제</li>
            <li>• 처리 정지 요청</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 12 조 (개인정보 보호 책임자)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            회사는 개인정보 보호 관련 문의를 처리하기 위해 책임자를 지정합니다.
          </p>
          <ul className="mt-2 space-y-1 pl-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <li>• 개인정보 보호 책임자: ARA 운영팀</li>
            <li>• 문의 이메일: support@ara.com (예시)</li>
          </ul>
        </article>

        <article className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 13 조 (정책 변경)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            본 개인정보 처리방침은 법령 변경 또는 서비스 운영 정책에 따라 변경될 수 있으며, 변경 시 사전 공지합니다.
          </p>
        </article>

        <article className="border-y border-white/15 pb-6 pt-6 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">제 14 조 (환불 정책)</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            ARA는 선불 크레딧 기반 서비스로 운영되며, 환불 정책은 다음과 같습니다.
          </p>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">1. 크레딧 환불 기준</span>
              <br />
              사용된 크레딧은 환불이 불가능합니다.
              <br />
              미사용 크레딧에 한하여 일정 조건 충족 시 환불 신청이 가능합니다.
              <br />
              부분 사용된 경우, 남은 크레딧에 대해서만 환불이 적용될 수 있습니다.
            </p>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">2. 디지털 콘텐츠 특성</span>
              <br />
              AI 영상 생성 결과물은 즉시 소비되는 디지털 콘텐츠로 간주됩니다.
              <br />
              생성된 결과물 및 사용된 크레딧에 대해서는 환불이 제공되지 않습니다.
            </p>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">3. 환불 제한 사항</span>
              <br />
              다음 경우 환불이 제한될 수 있습니다:
            </p>
            <ul className="-mt-1 space-y-1 pl-4">
              <li>• 크레딧 일부라도 사용된 경우</li>
              <li>• 프로모션 또는 할인 구매 건</li>
              <li>• 부정 사용 또는 정책 위반이 의심되는 경우</li>
            </ul>
            <p>
              <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-800">4. 예외 처리</span>
              <br />
              다음 경우에는 예외적으로 환불이 검토될 수 있습니다:
            </p>
            <ul className="-mt-1 space-y-1 pl-4">
              <li>• 시스템 오류로 인한 중복 결제</li>
              <li>• 크레딧 미지급 또는 기술적 오류</li>
            </ul>
          </div>
        </article>
      </section>
    </FooterLegalPageShell>
  );
}
