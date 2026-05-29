import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export async function reviewAuthHeaders(): Promise<HeadersInit> {
  const supabase = getSupabaseBrowserClient();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function reviewFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const auth = await reviewAuthHeaders();
  return fetch(input, {
    ...init,
    credentials: "include",
    headers: { ...auth, ...(init?.headers as Record<string, string> | undefined) },
  });
}
