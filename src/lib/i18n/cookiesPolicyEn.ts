import type { CookiesSection } from "@/lib/i18n/cookiesPolicyKo";

export const COOKIES_POLICY_EN = {
  quote: "We remember your creative flow and tune the experience around it.",
  intro:
    "Digital DNA uses cookies so you can use the platform faster and more comfortably. Cookies are small pieces of data stored in your browser.",
  sections: [
    {
      title: "1. Essential",
      subtitle: "(required)",
      lead: "Cookies required to operate the service.",
      items: [
        {
          strong: "Seamless access:",
          text: "Keeps you signed in so you can move between pages without losing your work.",
        },
        {
          strong: "Security & trust:",
          text: "Helps prevent abusive sign-ins and protects payment-related data.",
        },
      ],
    },
    {
      title: "2. Performance & insights",
      subtitle: "(analytics)",
      lead: "Cookies that help us improve the product.",
      items: [
        {
          strong: "Trend analysis:",
          text: "Shows which sources are popular so we can surface clips that match your taste.",
        },
        {
          strong: "Optimized UI:",
          text: "Helps us find friction in the product and improve the interface.",
        },
      ],
    },
    {
      title: "3. Preferences",
      subtitle: "(personalization)",
      lead: "Cookies that remember your workspace.",
      items: [
        {
          strong: "Personalized view:",
          text: "Keeps dark mode, language, and other choices you set for each visit.",
        },
      ],
    },
  ] satisfies CookiesSection[],
};
