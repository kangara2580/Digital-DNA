"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient:
  | ReturnType<typeof createClient>
  | null
  | undefined = undefined;

export function getSupabaseBrowserClient() {
  // 브라우저에서 Supabase 클라이언트를 매번 새로 만들면
  // auth 이벤트/저장소 읽기 타이밍이 꼬여 세션이 비는 케이스가 생길 수 있어요.
  // 그래서 싱글톤으로 유지합니다.
  if (browserClient !== undefined) return browserClient;

  if (!url || !anonKey) {
    browserClient = null;
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // 브라우저 환경에서는 localStorage를 명시합니다.
      storage: window.localStorage,
    },
  });

  return browserClient;
}
