import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "로그인 — REELS MARKET",
};

function LoginFallback() {
  return (
    <main className="mx-auto min-h-[50vh] max-w-md px-4 py-16 text-center text-zinc-400">
      불러오는 중…
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen text-[var(--foreground)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,242,234,0.08),#02040a)]">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
