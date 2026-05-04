import type { PrivacyArticle } from "@/lib/i18n/privacyPolicyKo";

/** English privacy policy — mirrors the Korean structure; written for clarity for international readers. Official interpretation follows the Korean version where they differ. */
export const PRIVACY_ARTICLES_EN: PrivacyArticle[] = [
  {
    title: "Article 1 (General)",
    blocks: [
      {
        type: "p",
        text:
          "ARA (“we,” “us,” or “the Company”) is committed to protecting your privacy. We process personal information in line with the Personal Information Protection Act and other applicable laws in Korea. This Privacy Policy describes what we collect, why we collect it, and how we protect it when you use our short-form video marketplace and related AI creation features.",
      },
    ],
  },
  {
    title: "Article 2 (Information We Collect)",
    blocks: [
      { type: "p", text: "We may collect the following types of information to operate the service:" },
      { type: "sub", text: "1. Social sign-in data (OAuth)" },
      {
        type: "p",
        text: "We do not offer traditional email/password registration. Accounts are created through supported third-party providers.",
      },
      {
        type: "ul",
        items: [
          "Google account identifiers and profile information",
          "Kakao account identifiers and profile information",
          "(Future) Additional providers such as Apple, where enabled",
        ],
      },
      { type: "sub", text: "2. Basic profile information" },
      {
        type: "ul",
        items: [
          "Internal ARA user ID",
          "Nickname or display name",
          "Profile image (optional or as provided by the identity provider)",
          "Sign-in and access logs (IP address, device information, timestamps, etc.)",
        ],
      },
      { type: "sub", text: "3. Service usage information" },
      {
        type: "ul",
        items: [
          "Video generation and editing history",
          "Uploaded content and related URLs",
          "Credit usage history",
          "Download and save activity",
        ],
      },
      { type: "sub", text: "4. Billing information" },
      {
        type: "ul",
        items: [
          "Credit purchases and payment records",
          "Payment authorization metadata",
          "Transaction records processed by our payment partners",
        ],
      },
      {
        type: "p",
        text: "We do not store full card numbers or other sensitive payment credentials on our servers.",
      },
      { type: "sub", text: "5. External platform (URL) information" },
      {
        type: "p",
        text: "When you register a link to an external platform, we may collect:",
      },
      {
        type: "ul",
        items: [
          "The video URL you submit",
          "Content metadata (title, thumbnail, etc.)",
          "Upload and usage history associated with that link",
        ],
      },
    ],
  },
  {
    title: "Article 3 (Purpose of Use)",
    blocks: [
      { type: "p", text: "We use personal information for the following purposes:" },
      {
        type: "ul",
        items: [
          "Identifying members and providing the service",
          "Operating AI video generation and editing features",
          "Managing credits and processing payments",
          "Maintaining service usage records",
          "Preventing abuse and maintaining security",
          "Responding to customer inquiries",
        ],
      },
    ],
  },
  {
    title: "Article 4 (Retention)",
    blocks: [
      {
        type: "ul",
        items: [
          "When you delete your account, we delete associated personal information without undue delay, subject to legal exceptions.",
          "The following may be retained for periods required by law:",
          "- Payment and transaction records: up to 5 years",
          "- Service access logs: roughly 3 months to 1 year",
          "- Records related to suspected abuse: as needed for investigation",
        ],
      },
    ],
  },
  {
    title: "Article 5 (Sharing with Third Parties)",
    blocks: [
      {
        type: "p",
        text: "We do not sell your personal information. We may share it only in these cases:",
      },
      {
        type: "ul",
        items: [
          "When you have given consent",
          "When required by lawful requests from public authorities",
          "With payment service providers to complete transactions you initiate",
        ],
      },
    ],
  },
  {
    title: "Article 6 (External Services and Integrations)",
    blocks: [
      {
        type: "p",
        text: "We may rely on external platforms to deliver features and to improve the product.",
      },
      {
        type: "ul",
        items: [
          "Account identification and authentication",
          "Product analytics",
          "Content upload workflows",
        ],
      },
      {
        type: "p",
        text: "If you choose English as the display language, we may machine-translate user-written text such as purchase reviews so they can be shown in English. Only the text needed for translation is sent to the translation provider (for example MyMemory or another vendor we integrate). We design this flow so nicknames and account identifiers are not bundled with that text. Machine translations are for convenience only and may be inaccurate.",
      },
      {
        type: "p",
        text: "We do not republish external platform content on our own beyond what the service requires.",
      },
    ],
  },
  {
    title: "Article 7 (Safeguards)",
    blocks: [
      { type: "p", text: "We apply administrative, technical, and organizational measures such as:" },
      {
        type: "ul",
        items: [
          "Encrypting certain data at rest",
          "Limiting access on a need-to-know basis",
          "Operating secured infrastructure",
          "Monitoring for intrusion and abuse",
        ],
      },
    ],
  },
  {
    title: "Article 8 (Cookies and Logs)",
    blocks: [
      {
        type: "p",
        text: "We may use cookies and server logs to keep the service reliable and to understand how it is used.",
      },
      {
        type: "ul",
        items: [
          "Usage analytics",
          "Error monitoring and performance tuning",
          "Improving the experience",
        ],
      },
      {
        type: "p",
        text: "You can block cookies in your browser; some features may not work correctly if you do.",
      },
    ],
  },
  {
    title: "Article 9 (Credits)",
    blocks: [
      {
        type: "ul",
        items: [
          "Credits are sold on a prepaid basis.",
          "Purchased credits remain on your account until consumed.",
          "Usage history is available inside the product.",
          "Refunds follow the refund rules described in this policy and in our Terms & Policies.",
        ],
      },
    ],
  },
  {
    title: "Article 10 (Deletion Procedures)",
    blocks: [
      {
        type: "p",
        text: "When retention is no longer justified, we delete or anonymize personal information promptly.",
      },
      {
        type: "ul",
        items: [
          "Electronic records: deleted in an unrecoverable manner where feasible",
          "Physical media: destroyed in line with internal procedures",
        ],
      },
    ],
  },
  {
    title: "Article 11 (Your Rights)",
    blocks: [
      { type: "p", text: "You may request to:" },
      {
        type: "ul",
        items: ["Access your personal information", "Correct inaccurate data", "Delete data", "Restrict certain processing"],
      },
    ],
  },
  {
    title: "Article 12 (Privacy Contact)",
    blocks: [
      { type: "p", text: "Questions about privacy can be directed to our privacy contact:" },
      {
        type: "ul",
        items: ["Privacy officer: ARA Operations", "Email: support@ara.com (example)"],
      },
    ],
  },
  {
    title: "Article 13 (Policy Updates)",
    blocks: [
      {
        type: "p",
        text: "We may update this Privacy Policy when laws or our practices change. When we do, we will post a notice in advance when practicable.",
      },
    ],
  },
  {
    title: "Article 14 (Refund Rules)",
    blocks: [
      {
        type: "p",
        text: "ARA runs on prepaid credits. Refunds are handled as follows:",
      },
      { type: "sub", text: "1. Credit refunds" },
      {
        type: "p",
        text: "Credits that have already been spent are not refundable. Unused balances may be refundable only when the conditions below are met. If you partially used a purchase, only the remaining unused portion may qualify.",
      },
      { type: "sub", text: "2. Digital nature of outputs" },
      {
        type: "p",
        text: "Generated AI outputs are treated as instantly delivered digital content. We do not refund credits already consumed to create a result.",
      },
      { type: "sub", text: "3. Limits" },
      { type: "p", text: "Refunds may be denied when:" },
      {
        type: "ul",
        items: [
          "Any portion of the credits has been used",
          "The purchase was promotional or discounted under non-refundable terms",
          "We detect suspected abuse or policy violations",
        ],
      },
      { type: "sub", text: "4. Exceptions" },
      { type: "p", text: "We may review exceptions such as:" },
      {
        type: "ul",
        items: ["Duplicate charges caused by a system error", "Credits not granted due to a technical failure"],
      },
    ],
  },
];
