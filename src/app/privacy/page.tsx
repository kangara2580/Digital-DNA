import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";

export const metadata = {
  title: "개인정보처리방침 — ARA",
  description:
    "Digital DNA 개인정보 처리방침 — 수집·이용·보관·제3자 제공 및 보안 안내.",
};

export default function PrivacyPage() {
  return (
    <FooterLegalPageShell title="개인정보처리방침" withCard={false} mainMaxClass="max-w-3xl">
      <div className="mt-10 space-y-12">
        <blockquote className="border-l-4 border-reels-cyan/70 pl-5 text-[17px] font-semibold leading-relaxed text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
          우리는 당신의 데이터보다 당신의 창의성을 더 소중히 여깁니다.
        </blockquote>

        <p className="text-[15px] leading-[1.85] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          Digital DNA는 사용자의 소중한 개인정보를 안전하게 보호하며, 서비스 제공에 꼭 필요한 정보만을 최소한으로
          수집합니다.
        </p>

        <section className="space-y-4 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            1. 수집하는 정보{" "}
            <span className="text-[14px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              (What we collect)
            </span>
          </h2>
          <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            서비스의 원활한 이용을 위해 아래의 정보를 수집합니다.
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                계정 정보:
              </strong>{" "}
              이메일 주소, 프로필 이미지 (로그인 및 본인 확인용)
            </li>
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                소셜 로그인(Google):
              </strong>{" "}
              Google 계정으로 로그인·회원가입을 선택하면 Google이 제공하는 식별자·이메일·이름 등이
              Supabase 인증 처리를 위해 전달되며, 본인 확인·계정 연결 목적에만 사용됩니다.
            </li>
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                서비스 이용 기록:
              </strong>{" "}
              결제 내역, 소스 다운로드 기록 (구매 내역 증빙 및 라이선스 관리용)
            </li>
            <li>
              <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                자동 수집 정보:
              </strong>{" "}
              접속 로그, 쿠키, 기기 정보 (서비스 최적화 및 보안 강화용)
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            2. 정보의 활용{" "}
            <span className="text-[14px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              (How we use it)
            </span>
          </h2>
          <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            수집된 정보는 오직 다음의 목적으로만 사용됩니다.
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            <li>구매한 릴스 소스에 대한 라이선스 권한 증명 및 관리</li>
            <li>사용자 맞춤형 콘텐츠 추천 및 트렌드 분석</li>
            <li>불법 복제 및 부정 이용 방지를 위한 보안 모니터링</li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            3. 정보의 보관 및 파기{" "}
            <span className="text-[14px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              (Storage &amp; Retention)
            </span>
          </h2>
          <ul className="list-disc space-y-3 pl-5 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            <li>
              사용자의 개인정보는 원칙적으로 서비스 탈퇴 시 지체 없이 파기됩니다.
            </li>
            <li>
              단, 관련 법령 및 결제 내역 증빙을 위해 필요한 경우 일정 기간 안전하게 보관 후 파기됩니다.
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            4. 제3자 제공 및 보안{" "}
            <span className="text-[14px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              (Security)
            </span>
          </h2>
          <ul className="list-disc space-y-3 pl-5 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            <li>
              우리는 사용자의 동의 없이 개인정보를 외부에 판매하거나 제공하지 않습니다.
            </li>
            <li>
              소셜 로그인 시 인증 제공자(Google LLC 등)가 본인 확인을 위해 정보를 처리할 수
              있습니다. 자세한 내용은 해당 서비스의 개인정보처리방침을 참고해 주세요.
            </li>
            <li>
              인기순위·미리보기 등에 공개 SNS 영상 URL(TikTok, YouTube, Instagram 등)을 표시할
              때, 해당 플랫폼이 제공하는 oEmbed·임베드 응답을 서버가 불러와 썸네일·공개 조회·좋아요
              지표 등을 보여줄 수 있습니다. 이 과정에서 이용자의 SNS 계정 로그인 정보는 수집하지
              않으며, 입력·설정된 공개 URL만 처리합니다.
            </li>
            <li>모든 데이터는 최신 보안 기술을 통해 암호화되어 관리됩니다.</li>
          </ul>
        </section>
      </div>
    </FooterLegalPageShell>
  );
}
