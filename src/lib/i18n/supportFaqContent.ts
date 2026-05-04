import type { SiteLocale } from "@/lib/sitePreferences";

export type SupportFaqCategory = "core" | "payment" | "copyright" | "features" | "account";

export type SupportFaqItem = {
  id: string;
  popular?: boolean;
  category: SupportFaqCategory;
  question: Record<SiteLocale, string>;
  answer: Record<SiteLocale, string>;
};

export const SUPPORT_FAQ_ITEMS: SupportFaqItem[] = [
  {
    id: "credit-what",
    popular: true,
    category: "core",
    question: { ko: "크레딧은 무엇인가요?", en: "What are credits?" },
    answer: {
      ko: "크레딧은 ARA의 AI 영상 생성 및 편집 기능을 이용할 때 차감되는 선불형 이용 단위입니다.",
      en: "Credits are prepaid units that are consumed when you use ARA’s AI video generation and editing features.",
    },
  },
  {
    id: "credit-expire",
    popular: true,
    category: "core",
    question: { ko: "크레딧은 소멸되나요?", en: "Do credits expire?" },
    answer: {
      ko: "기본 정책은 약관/정책 페이지를 따릅니다. 사용 전 관련 정책을 반드시 확인해 주세요.",
      en: "Expiration rules follow the Terms & Policies page. Please review them before you buy or spend credits.",
    },
  },
  {
    id: "refund-possible",
    popular: true,
    category: "core",
    question: { ko: "환불이 가능한가요?", en: "Can I get a refund?" },
    answer: {
      ko:
        "유료 결제 후 7일 이내에 크레딧을 전혀 사용하지 않은 경우에 한해 청약철회가 가능합니다. 일부라도 사용했거나 7일이 경과한 경우 환불이 어렵습니다. 단순 변심 환불 시 결제·송금 수수료를 공제할 수 있습니다. 유·무료 크레딧 구분·유효기간은 약관 및 정책 페이지를 확인해 주세요.",
      en:
        "You may withdraw a paid credit purchase within seven days only if no credits from that purchase have been used. After any use or after seven days, refunds are generally unavailable. Simple-change-of-mind refunds may be reduced by payment fees. Free vs. paid credit rules are in Terms & Policies.",
    },
  },
  {
    id: "commercial-use",
    popular: true,
    category: "core",
    question: {
      ko: "생성된 영상은 상업적으로 사용 가능한가요?",
      en: "Can I use generated videos commercially?",
    },
    answer: {
      ko: "상업적 이용 범위는 현재 약관 및 정책에 따르며, 플랜/정책 변경 시 공지됩니다.",
      en: "Commercial use follows the current Terms & Policies. If plans or rules change, we post a notice.",
    },
  },
  {
    id: "refund-if-unsatisfied",
    popular: true,
    category: "core",
    question: {
      ko: "결과물이 마음에 안 들면 환불되나요?",
      en: "What if I don’t like the AI output?",
    },
    answer: {
      ko: "AI 결과는 입력 조건에 따라 달라지며, 생성 후 차감된 크레딧은 환불되지 않습니다.",
      en: "Outputs vary with inputs and settings. Credits spent on a generation are not refunded after the job runs.",
    },
  },
  {
    id: "buy-credit",
    category: "payment",
    question: { ko: "크레딧은 어떻게 구매하나요?", en: "How do I buy credits?" },
    answer: {
      ko: "서비스 내 결제 경로에서 원하는 크레딧을 선택해 구매할 수 있습니다.",
      en: "Use the in-app purchase flow to choose a credit pack and check out.",
    },
  },
  {
    id: "refund-used-credit",
    category: "payment",
    question: { ko: "사용된 크레딧은 환불되나요?", en: "Are spent credits refundable?" },
    answer: {
      ko: "아니요. 사용된 크레딧은 환불되지 않습니다.",
      en: "No. Credits that have already been spent are not refunded.",
    },
  },
  {
    id: "refund-unused-credit",
    category: "payment",
    question: { ko: "미사용 크레딧 환불 기준은?", en: "Rules for unused credits?" },
    answer: {
      ko:
        "약관에 따르면 결제 후 7일 이내·전액 미사용인 유료 크레딧에 한해 청약철회가 가능하며, 단순 변심 시 수수료 공제 후 환불될 수 있습니다. 그 외에는 환불이 제한될 수 있으니 약관 및 정책 페이지를 참고해 주세요.",
      en:
        "Unused paid credits may be withdrawable within seven days if none were used; fees may apply. Other cases may be non-refundable—see Terms & Policies.",
    },
  },
  {
    id: "copyright-owner",
    category: "copyright",
    question: {
      ko: "생성된 영상의 권리는 누구에게 있나요?",
      en: "Who owns rights to generated videos?",
    },
    answer: {
      ko: "권리 및 사용 범위는 약관 및 정책을 따르며, 정책 개정 시 공지사항으로 안내됩니다.",
      en: "Rights and usage follow the Terms & Policies. Updates are announced in notices.",
    },
  },
  {
    id: "url-upload",
    category: "copyright",
    question: { ko: "URL 영상 업로드는 가능한가요?", en: "Can I register a video URL?" },
    answer: {
      ko: "가능하지만 본인이 권리를 보유한 콘텐츠만 등록할 수 있으며, 권리 침해 시 책임은 이용자에게 있습니다.",
      en:
        "Yes, but you may list only content you have the rights to. You are responsible if your upload infringes someone else’s rights.",
    },
  },
  {
    id: "generation-time",
    category: "features",
    question: {
      ko: "영상 생성 시간은 얼마나 걸리나요?",
      en: "How long does generation take?",
    },
    answer: {
      ko: "입력 조건, 길이, 서버 상황에 따라 달라지며 보통 수십 초~수분이 소요됩니다.",
      en: "Typically seconds to a few minutes, depending on settings, length, and server load.",
    },
  },
  {
    id: "quality-level",
    category: "features",
    question: { ko: "화질은 어떻게 되나요?", en: "What about resolution or quality?" },
    answer: {
      ko: "기본/고화질 옵션 및 기능별 설정에 따라 결과 화질이 달라집니다.",
      en: "Quality depends on the options you pick in each feature (standard vs. higher tiers, etc.).",
    },
  },
  {
    id: "login-method",
    category: "account",
    question: { ko: "로그인 방법", en: "How do I sign in?" },
    answer: {
      ko: "현재 지원되는 간편 로그인 계정으로 로그인할 수 있습니다.",
      en: "Use one of the supported social sign-in providers shown on the login screen.",
    },
  },
  {
    id: "delete-account",
    category: "account",
    question: { ko: "계정 삭제", en: "Account deletion" },
    answer: {
      ko: "계정 삭제는 고객센터 문의를 통해 요청할 수 있습니다. 확인 절차 후 처리됩니다.",
      en: "Contact the help center to request account deletion. We complete a verification flow before processing.",
    },
  },
];

export function supportFaqCategoryLabel(locale: SiteLocale, cat: SupportFaqCategory): string {
  const map: Record<SupportFaqCategory, Record<SiteLocale, string>> = {
    core: { ko: "핵심", en: "Essentials" },
    payment: { ko: "결제/환불", en: "Billing & refunds" },
    copyright: { ko: "저작권", en: "Copyright" },
    features: { ko: "기능", en: "Product" },
    account: { ko: "계정", en: "Account" },
  };
  return map[cat][locale];
}
