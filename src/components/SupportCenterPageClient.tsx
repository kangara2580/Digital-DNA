"use client";

import { useEffect, useMemo, useState } from "react";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  popular?: boolean;
  category: "핵심" | "결제/환불" | "저작권" | "기능" | "계정";
};

const FAQS: FAQItem[] = [
  {
    id: "credit-what",
    question: "크레딧은 무엇인가요?",
    answer: "크레딧은 ARA의 AI 영상 생성 및 편집 기능을 이용할 때 차감되는 선불형 이용 단위입니다.",
    popular: true,
    category: "핵심",
  },
  {
    id: "credit-expire",
    question: "크레딧은 소멸되나요?",
    answer: "기본 정책은 약관/정책 페이지를 따릅니다. 사용 전 관련 정책을 반드시 확인해 주세요.",
    popular: true,
    category: "핵심",
  },
  {
    id: "refund-possible",
    question: "환불이 가능한가요?",
    answer:
      "유료 결제 후 7일 이내에 크레딧을 전혀 사용하지 않은 경우에 한해 청약철회가 가능합니다. 일부라도 사용했거나 7일이 경과한 경우 환불이 어렵습니다. 단순 변심 환불 시 결제·송금 수수료를 공제할 수 있습니다. 유·무료 크레딧 구분·유효기간은 약관 및 정책 페이지를 확인해 주세요.",
    popular: true,
    category: "핵심",
  },
  {
    id: "commercial-use",
    question: "생성된 영상은 상업적으로 사용 가능한가요?",
    answer: "상업적 이용 범위는 현재 약관 및 정책에 따르며, 플랜/정책 변경 시 공지됩니다.",
    popular: true,
    category: "핵심",
  },
  {
    id: "refund-if-unsatisfied",
    question: "결과물이 마음에 안 들면 환불되나요?",
    answer: "AI 결과는 입력 조건에 따라 달라지며, 생성 후 차감된 크레딧은 환불되지 않습니다.",
    popular: true,
    category: "핵심",
  },
  {
    id: "buy-credit",
    question: "크레딧은 어떻게 구매하나요?",
    answer: "서비스 내 결제 경로에서 원하는 크레딧을 선택해 구매할 수 있습니다.",
    category: "결제/환불",
  },
  {
    id: "refund-used-credit",
    question: "사용된 크레딧은 환불되나요?",
    answer: "아니요. 사용된 크레딧은 환불되지 않습니다.",
    category: "결제/환불",
  },
  {
    id: "refund-unused-credit",
    question: "미사용 크레딧 환불 기준은?",
    answer:
      "약관에 따르면 결제 후 7일 이내·전액 미사용인 유료 크레딧에 한해 청약철회가 가능하며, 단순 변심 시 수수료 공제 후 환불될 수 있습니다. 그 외에는 환불이 제한될 수 있으니 약관 및 정책 페이지를 참고해 주세요.",
    category: "결제/환불",
  },
  {
    id: "copyright-owner",
    question: "생성된 영상의 권리는 누구에게 있나요?",
    answer: "권리 및 사용 범위는 약관 및 정책을 따르며, 정책 개정 시 공지사항으로 안내됩니다.",
    category: "저작권",
  },
  {
    id: "url-upload",
    question: "URL 영상 업로드는 가능한가요?",
    answer: "가능하지만 본인이 권리를 보유한 콘텐츠만 등록할 수 있으며, 권리 침해 시 책임은 이용자에게 있습니다.",
    category: "저작권",
  },
  {
    id: "generation-time",
    question: "영상 생성 시간은 얼마나 걸리나요?",
    answer: "입력 조건, 길이, 서버 상황에 따라 달라지며 보통 수십 초~수분이 소요됩니다.",
    category: "기능",
  },
  {
    id: "quality-level",
    question: "화질은 어떻게 되나요?",
    answer: "기본/고화질 옵션 및 기능별 설정에 따라 결과 화질이 달라집니다.",
    category: "기능",
  },
  {
    id: "login-method",
    question: "로그인 방법",
    answer: "현재 지원되는 간편 로그인 계정으로 로그인할 수 있습니다.",
    category: "계정",
  },
  {
    id: "delete-account",
    question: "계정 삭제",
    answer: "계정 삭제는 고객센터 문의를 통해 요청할 수 있습니다. 확인 절차 후 처리됩니다.",
    category: "계정",
  },
];

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SupportCenterPageClient() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const normalized = debouncedQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return FAQS;
    return FAQS.filter((f) => (f.question + f.answer).toLowerCase().includes(normalized));
  }, [normalized]);

  const ordered = useMemo(() => {
    const popular = filtered.filter((f) => f.popular);
    const others = filtered.filter((f) => !f.popular);
    return [...popular, ...others];
  }, [filtered]);

  return (
    <section className="space-y-8 px-2 pb-10 sm:px-0">
      <header className="px-1 py-2">
        <h1 className="text-[clamp(1.45rem,3.4vw,2.1rem)] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900">
          고객센터
        </h1>
      </header>

      <section className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
        <h2 className="text-[clamp(1.35rem,3.2vw,1.8rem)] font-extrabold text-white [html[data-theme='light']_&]:text-zinc-900">FAQ</h2>
        <p className="mt-2 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          문의 전 FAQ를 먼저 확인해 주세요.
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="질문 검색 (예: 환불, 크레딧, 상업적 이용)"
          className="mt-4 w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-500 focus:border-white/40 focus:outline-none [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-900"
        />
        <div className="mt-4 divide-y divide-white/10 border-y border-white/10 [html[data-theme='light']_&]:divide-zinc-200 [html[data-theme='light']_&]:border-zinc-200">
          {ordered.map((f) => {
            const opened = openId === f.id;
            return (
              <div key={f.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(opened ? null : f.id)}
                  className="flex w-full items-start justify-between gap-3 px-2 py-3 text-left"
                >
                  <span className="text-[14px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {f.popular ? "🔥 " : ""}
                    {f.question}
                  </span>
                  <span className="text-zinc-500">{opened ? "−" : "+"}</span>
                </button>
                {opened ? (
                  <div className="px-2 pb-4 text-[13px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
                    {f.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {ordered.length === 0 ? (
          <p className="mt-4 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            검색 결과가 없습니다. 고객센터 이메일로 문의해 주세요.
          </p>
        ) : null}
      </section>

      <section className="border-t border-white/15 pt-6 [html[data-theme='light']_&]:border-zinc-200">
        <h2 className="text-base font-bold text-white [html[data-theme='light']_&]:text-zinc-900">문의 접수</h2>
        <p className="mt-2 text-[14px] text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
          이메일 문의: <span className="font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">support@ara.com</span>
        </p>
        <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          제출 내용을 검토하고 가능한 한 빨리 응답해 드리겠습니다.
        </p>
      </section>
    </section>
  );
}
