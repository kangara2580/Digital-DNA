import type { PrivacyArticle } from "@/lib/i18n/privacyPolicyKo";
import { LEGAL_CONTACT_EMAIL, LICENSE_EFFECTIVE_DATE_KO } from "@/lib/i18n/licensePolicyKo";
import {
  LEGAL_BUSINESS_DETAILS_PLACEHOLDER_EN,
  LEGAL_OPERATOR_NAME,
  LEGAL_SERVICE_NAME,
  LEGAL_SETTLEMENT_HOLD_DAYS,
  LEGAL_SETTLEMENT_MIN_GEMS,
} from "@/lib/legalOperator";

/** English Terms & Policies — informational translation. Where Korean law applies, the Korean version prevails for mandatory consumer rights. */
export const LICENSE_EFFECTIVE_DATE_EN = "May 20, 2026";

export const LICENSE_ARTICLES_EN: PrivacyArticle[] = [
  {
    id: "preamble",
    title: "Overview",
    blocks: [
      {
        type: "p",
        text:
          `These Terms & Policies govern ${LEGAL_OPERATOR_NAME} (service: ${LEGAL_SERVICE_NAME}; “we”, “us”, or the “Company”) and your use of our short-form video marketplace, AI customization studio (face/background editing), and prepaid gem credits (“Services”). By signing up, paying, listing content for sale, buying videos, or running AI edits, you agree to these Terms.`,
      },
      {
        type: "p",
        text:
          "Personal data is handled under our Privacy Policy (/privacy). If these Terms and the Privacy Policy conflict regarding privacy, the Privacy Policy controls.",
      },
      { type: "p", text: `Effective date: ${LICENSE_EFFECTIVE_DATE_EN}` },
    ],
  },
  {
    id: "definitions",
    title: "Article 1 (Definitions)",
    blocks: [
      {
        type: "ul",
        items: [
          '"Services": browsing, purchasing, selling, AI studio, gem top-ups, payouts, support, and related features',
          '"Member": a user with an account',
          '"Seller": a member who lists content for sale',
          '"Buyer": a member who spends gems to obtain a license to use seller content',
          '"Gems": prepaid service units shown as 💎 in the product (also referred to as “credits” in these Terms)',
          '"Content": videos, images, thumbnails, metadata, AI outputs, and related materials',
          '"AI Output": results produced by our AI tools from your inputs (profiles, reference faces, purchased source clips, etc.)',
          '"Face Data": face images you upload for AI profile/studio features and derivatives processed for those features',
        ],
      },
    ],
  },
  {
    id: "operator",
    title: "Article 2 (Operator & support)",
    blocks: [
      {
        type: "p",
        text:
          "We publish legally required business information in the Help Center (/contact), checkout receipts, or notices.",
      },
      {
        type: "ul",
        items: [
          `Operator: ${LEGAL_OPERATOR_NAME}`,
          `Service: ${LEGAL_SERVICE_NAME}`,
          `Legal & privacy contact: ${LEGAL_CONTACT_EMAIL}`,
          "Website: ara.pink (and other official domains we announce)",
          LEGAL_BUSINESS_DETAILS_PLACEHOLDER_EN,
        ],
      },
    ],
  },
  {
    id: "effect",
    title: "Article 3 (Agreement)",
    blocks: [
      {
        type: "p",
        text:
          "You must agree to these Terms to use the Services. We provide links at signup, checkout, listing upload, purchases, and AI runs; completing those actions constitutes acceptance.",
      },
      {
        type: "p",
        text:
          "If you do not agree, stop using the Services and delete your account. Past transactions remain governed by the Terms in effect at that time.",
      },
    ],
  },
  {
    id: "changes",
    title: "Article 4 (Changes)",
    blocks: [
      {
        type: "p",
        text:
          "We may update these Terms without violating mandatory law. We announce changes, effective dates, and reasons via notices or this page.",
      },
      {
        type: "p",
        text:
          "Changes unfavorable to members (stricter refunds, broader duties, reduced service scope) are announced at least 30 days in advance. You may object and withdraw before the effective date.",
      },
      {
        type: "p",
        text:
          "Other changes are generally announced 7 days in advance. Urgent legal/security changes may be announced afterward. Continued use after the effective date constitutes acceptance.",
      },
    ],
  },
  {
    id: "service",
    title: "Article 5 (What we provide)",
    blocks: [
      {
        type: "p",
        text: "Key Services include:",
      },
      {
        type: "ul",
        items: [
          "A marketplace to discover, buy, and sell short video clips",
          "AI customization on purchased clips (face/background/segments/text—features may roll out in stages)",
          "Gem top-ups and consumption for paid features",
          "Seller analytics and KRW settlements per our policies",
          "Wishlist, cart, notifications, leaderboards, and related tools",
        ],
      },
      {
        type: "p",
        text:
          "We act as an e-commerce intermediary/platform provider. We do not warrant that every listing is lawful or accurate, except to the extent required by applicable law and these Terms.",
      },
    ],
  },
  {
    id: "membership",
    title: "Article 6 (Accounts & eligibility)",
    blocks: [
      {
        type: "p",
        text:
          "Accounts are created via email/password, Google, Kakao, or other login methods we support.",
      },
      {
        type: "p",
        text:
          "You must be at least 14 years old. Paid purchases, listings, or payouts by users under 19 may require guardian consent where Korean law requires it; we may request proof.",
      },
      {
        type: "p",
        text:
          "One person, one account. You are responsible for credential security. We are not liable for losses caused by your negligence absent our intent or gross negligence.",
      },
    ],
  },
  {
    id: "account-deletion",
    title: "Article 6-2 (Account deletion & withdrawal)",
    blocks: [
      {
        type: "p",
        text:
          "You may request account deletion via Settings or other flows we provide. We will deactivate or delete your account per law and our Privacy Policy, while retaining records we must keep for transactions, disputes, or legal cooperation.",
      },
      {
        type: "ul",
        items: [
          "Unused paid/free gems, pending seller balances, and purchased access may expire, be held, paid out, or refunded only where policy/law allows",
          `Seller balances move from “on hold” to “available” after ${LEGAL_SETTLEMENT_HOLD_DAYS} days from sale; payout requests require at least ${LEGAL_SETTLEMENT_MIN_GEMS} gems and a registered bank account—see Assets › Settlement`,
          "Deletion may be delayed while refunds, fraud reviews, or IP disputes are open",
          "Re-registration may link prior enforcement history",
        ],
      },
      {
        type: "p",
        text: `Questions: ${LEGAL_CONTACT_EMAIL} or Help Center (/contact).`,
      },
    ],
  },
  {
    id: "restrict",
    title: "Article 7 (Restrictions & suspension)",
    blocks: [
      {
        type: "p",
        text:
          "We may limit or suspend accounts and remove content, with notice when practicable or afterward when urgent, if you:",
      },
      {
        type: "ul",
        items: [
          "Violate these Terms, the Privacy Policy, or law",
          "Infringe portrait, copyright, or privacy rights via content or AI outputs",
          "Create or spread deepfakes, fraud, hate, illegal adult content, gambling, or drugs",
          "Abuse payments/gems, hack, or misuse APIs",
          "Cause serious operational harm through disputes, chargebacks, or abuse",
        ],
      },
      {
        type: "p",
        text:
          "Handling of remaining gems, payouts, and purchased access follows law, these Terms, and case-by-case notices.",
      },
    ],
  },
  {
    id: "gems",
    title: "Article 8 (Gems / prepaid credits)",
    blocks: [
      {
        type: "ul",
        items: [
          "Paid gems: purchased for money; generally valid for five years under Korean commercial prescription rules, subject to refund limits below",
          "Promotional gems: free grants with announced expiry; non-rollover, non-cash",
          "Spend order: promotional gems with nearest expiry are spent first",
          "Gems are not cash or cryptocurrency; trading gems between users is prohibited unless we explicitly allow it",
          "Payments run through PG partners (e.g., Toss, Polar). We do not store full card numbers",
        ],
      },
    ],
  },
  {
    id: "refund-gems",
    title: "Article 9 (Gem refunds & withdrawal)",
    blocks: [
      {
        type: "ul",
        items: [
          "You may withdraw a paid gem purchase within seven days only if none of the gems from that purchase were used",
          "No refund after any use, after seven days, or where promo terms prohibit refunds",
          "Change-of-mind refunds may be reduced by payment/remittance fees",
          "Duplicate charges or failed delivery may be corrected after verification",
        ],
      },
      { type: "p", text: "See Help Center (/contact) for refund requests." },
    ],
  },
  {
    id: "purchase-video",
    title: "Article 10 (Buying videos / digital content)",
    blocks: [
      {
        type: "ul",
        items: [
          "Buying with gems grants a license, not ownership of copyright",
          "Once download/stream/studio access starts, statutory withdrawal rights for digital content may be limited where you were informed and consented",
          "Duplicate purchases may be blocked or skipped",
          "AI edits may cost additional gems; quality depends on inputs and models",
          "Video purchase refunds are generally unavailable after provision unless we or the seller failed to deliver access",
        ],
      },
    ],
  },
  {
    id: "marketplace",
    title: "Article 11 (Marketplace role)",
    blocks: [
      {
        type: "p",
        text:
          "We may review listings, adjust ranking/placement, and remove content for legal, safety, or quality reasons. We do not guarantee listing accuracy but will act on credible infringement reports.",
      },
    ],
  },
  {
    id: "seller",
    title: "Article 12 (Seller obligations)",
    blocks: [
      {
        type: "ul",
        items: [
          "You own or have permission for all rights in listed content",
          "No infringement of third-party IP, portrait, or platform rules (YouTube, TikTok, Instagram, etc.)",
          "No false advertising, impersonation, or illegal/harmful material",
          "Honest pricing, categories, AI flags, and edition/stock info",
          "Do not imply rights beyond the license buyers receive",
        ],
      },
      {
        type: "p",
        text:
          "Checking rights/original/promotion liability boxes at upload means you accept seller terms here.",
      },
    ],
  },
  {
    id: "buyer-license",
    title: "Article 13 (Buyer license scope)",
    blocks: [
      {
        type: "ul",
        items: [
          "Use within ARA studio, downloads, and channels we permit for secondary creation",
          "Personal/non-commercial channel use is allowed within the license scope unless the listing says otherwise",
          "Commercial use (ads, paid distribution, brand deals, relicensing for profit) only if the listing marks commercial use allowed or we/seller expressly permit it",
          "You must not use purchases to synthesize third-party faces/voices without consent",
          "No resale, relicensing, torrenting, or NFT minting unless we explicitly allow it",
          "Honor attribution/source obligations where required",
        ],
      },
    ],
  },
  {
    id: "settlement",
    title: "Article 14 (Seller payouts)",
    blocks: [
      {
        type: "p",
        text:
          "Seller proceeds from gem sales are settled in KRW after platform fees (about 15%) and applicable taxes/fees.",
      },
      {
        type: "ul",
        items: [
          `Sales stay “on hold” for ${LEGAL_SETTLEMENT_HOLD_DAYS} calendar days (unless the UI states otherwise), then become “available”`,
          `Payout requests require at least ${LEGAL_SETTLEMENT_MIN_GEMS} available gems and a registered bank account`,
          "Bank transfers may take several business days after approval",
          "We may hold or cancel payouts during fraud, refund, IP, tax, or legal reviews",
        ],
      },
      {
        type: "p",
        text: "Latest fee/hold/minimum rules: Assets › Settlement (/assets/settlement) and notices.",
      },
    ],
  },
  {
    id: "review",
    title: "Article 15 (Moderation)",
    blocks: [
      {
        type: "p",
        text:
          "We may reject, limit, or delete content that fails specs, violates Articles 12/17/18, is subject to takedown notices, or harms service integrity.",
      },
    ],
  },
  {
    id: "ai-general",
    title: "Article 16 (AI services & limits)",
    blocks: [
      {
        type: "ul",
        items: [
          "AI outputs are probabilistic and not guaranteed",
          "Inputs may be processed on cloud/third-party AI providers per our Privacy Policy",
          "We prohibit generating/storing/distributing unlawful outputs and may remove them",
        ],
      },
    ],
  },
  {
    id: "ai-face",
    title: "Article 17 (AI face profile & references)",
    blocks: [
      {
        type: "ul",
        items: [
          "Upload only your face or faces you are legally authorized to use",
          "Third-party faces require explicit prior consent (written/electronic) or legal permission",
          "No unauthorized use of celebrities, public figures, coworkers, customers, or minors without guardian consent",
          "Face Data is processed to run the Services and may be deleted per the Privacy Policy when you withdraw/delete",
        ],
      },
      {
        type: "p",
        text:
          "Do not upload someone else’s photo to impersonate them in AI videos for sale or distribution. Violations may lead to permanent bans and legal referral.",
      },
    ],
  },
  {
    id: "ai-prohibited",
    title: "Article 18 (Deepfakes & portrait rights)",
    blocks: [
      {
        type: "ul",
        items: [
          "No non-consensual deepfakes or synthetic media of real people for sexual, violent, fraudulent, defamatory, electoral, or deceptive purposes",
          "No putting third-party faces into purchased templates for distribution/sale",
          "No scraping others’ photos into ARA for AI processing",
          "Cooperate with reports, rights-holder notices, and lawful law-enforcement requests",
        ],
      },
    ],
  },
  {
    id: "warranty",
    title: "Article 19 (Your representations)",
    blocks: [
      {
        type: "p",
        text:
          "You represent that your uploads, listings, purchases, and AI inputs/outputs have necessary rights and consents and comply with law and these Terms.",
      },
    ],
  },
  {
    id: "ip",
    title: "Article 20 (Intellectual property)",
    blocks: [
      {
        type: "ul",
        items: [
          "Our UI, brand, software, and databases remain ours or our licensors’",
          "Copyright in your content generally stays with you or your licensors",
          "You grant us a non-exclusive, royalty-free license to host, display, transcode, promote (minimum necessary), secure, and resolve disputes involving your content",
        ],
      },
    ],
  },
  {
    id: "prohibited",
    title: "Article 21 (Prohibited conduct)",
    blocks: [
      {
        type: "ul",
        items: [
          "Account/gem/purchase/payout theft",
          "Bots, scraping, price manipulation, fake transactions",
          "Hacking or bypassing access controls",
          "Illegal/hateful/harassing content",
          "Impersonation or defamation",
        ],
      },
    ],
  },
  {
    id: "disclaimer",
    title: "Article 22 (Disclaimers)",
    blocks: [
      {
        type: "ul",
        items: [
          "No liability for force majeure or third-party outages absent intent/gross negligence",
          "Intermediary liability only as required by law",
          "No liability for downstream platform policy changes",
          "Beta/free features provided as-is",
        ],
      },
    ],
  },
  {
    id: "indemnity",
    title: "Article 23 (Indemnity)",
    blocks: [
      {
        type: "p",
        text:
          "You will indemnify us for third-party claims caused by your breach, including reasonable legal fees, and we may seek contribution from you.",
      },
    ],
  },
  {
    id: "privacy-security",
    title: "Article 24 (Privacy)",
    blocks: [
      { type: "p", text: "See our Privacy Policy for details." },
    ],
  },
  {
    id: "law-enforcement",
    title: "Article 25 (Law enforcement & takedowns)",
    blocks: [
      {
        type: "p",
        text:
          "We may preserve/disclose records and suspend content when legally required or upon valid infringement notices.",
      },
    ],
  },
  {
    id: "suspension",
    title: "Article 26 (Service changes)",
    blocks: [
      {
        type: "p",
        text:
          "We may suspend for maintenance and wind down Services with notice, describing handling of unused paid gems and pending payouts.",
      },
    ],
  },
  {
    id: "dispute",
    title: "Article 27 (Disputes & governing law)",
    blocks: [
      {
        type: "p",
        text:
          "Parties will negotiate in good faith. Korean law governs. Exclusive jurisdiction for lawsuits against the Company is the court with jurisdiction over our principal place of business, unless mandatory consumer law lets consumers sue in their home jurisdiction.",
      },
    ],
  },
  {
    id: "misc",
    title: "Article 28 (Miscellaneous)",
    blocks: [
      {
        type: "p",
        text:
          "Unsettled matters follow Korean e-commerce, terms regulation, network, copyright, privacy, and content industry laws.",
      },
    ],
  },
  {
    id: "supplement",
    title: "Supplementary provisions",
    blocks: [
      { type: "p", text: `1. Effective ${LICENSE_EFFECTIVE_DATE_EN}.` },
      {
        type: "p",
        text: "2. Applies to existing members from the effective date, subject to prior notices for earlier conduct.",
      },
    ],
  },
];
