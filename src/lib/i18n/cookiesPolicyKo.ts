export type CookiesSection = {
  title: string;
  subtitle?: string;
  lead?: string;
  items?: { strong: string; text: string }[];
  footnote?: string;
};

export const COOKIES_POLICY_KO = {
  quote: "당신의 창의적 흐름을 기억하고 최적화합니다.",
  intro:
    "Digital DNA는 사용자가 플랫폼을 더 빠르고 쾌적하게 이용할 수 있도록 쿠키(Cookie)를 사용합니다. 쿠키는 사용자의 브라우저에 저장되는 작은 데이터 조각입니다.",
  sections: [
    {
      title: "1. Essential",
      subtitle: "(필수 항목)",
      lead: "서비스 운영을 위해 반드시 필요한 쿠키입니다.",
      items: [
        {
          strong: "Seamless Access:",
          text: "로그인 상태를 유지하고, 페이지를 이동해도 중단 없이 작업을 이어가게 돕습니다.",
        },
        {
          strong: "Security & Trust:",
          text: "부정 로그인을 방지하고 사용자의 결제 정보를 안전하게 보호합니다.",
        },
      ],
    },
    {
      title: "2. Performance & Insights",
      subtitle: "(성능 분석)",
      lead: "더 나은 서비스를 만들기 위한 분석용 쿠키입니다.",
      items: [
        {
          strong: "Trend Analysis:",
          text: "어떤 동영상 소스가 가장 인기 있는지 분석하여, 당신의 취향에 맞는 트렌디한 소스를 우선적으로 추천합니다.",
        },
        {
          strong: "Optimized UI:",
          text: "사용자가 사이트 내에서 겪는 불편함을 찾아내어 더 직관적인 디자인으로 개선하는 기초 자료가 됩니다.",
        },
      ],
    },
    {
      title: "3. Preferences",
      subtitle: "(개인화 설정)",
      lead: "당신의 작업 환경을 기억하는 쿠키입니다.",
      items: [
        {
          strong: "Personalized View:",
          text: "다크 모드 설정, 언어 선택 등 당신이 지정한 최적의 작업 환경을 접속할 때마다 그대로 유지해 줍니다.",
        },
      ],
    },
  ] satisfies CookiesSection[],
};
