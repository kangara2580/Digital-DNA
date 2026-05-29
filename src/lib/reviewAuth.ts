import { REVIEW_BODY_MAX, REVIEW_BODY_MIN } from "@/lib/reviewConstants";
import { getCurrentUser } from "@/lib/serverSession";
import { requireBearerUser, type ServerAuthUser } from "@/lib/serverAuth";

export type ReviewAuthUser = {
  id: string;
  email: string | null;
  nickname: string;
};

function nicknameFromUser(user: {
  email: string | null;
  user_metadata?: Record<string, unknown>;
  name?: string | null;
}): string {
  const meta = user.user_metadata;
  if (meta && typeof meta.nickname === "string" && meta.nickname.trim()) {
    return meta.nickname.trim().slice(0, 30);
  }
  if (user.name?.trim()) return user.name.trim().slice(0, 30);
  if (user.email) return user.email.split("@")[0]?.slice(0, 30) ?? "guest";
  return "guest";
}

export async function requireReviewUser(
  request: Request,
): Promise<
  | { ok: true; user: ReviewAuthUser }
  | { ok: false; status: 401 | 403 | 503; error: string }
> {
  const bearer = await requireBearerUser(request);
  if (bearer.ok) {
    return {
      ok: true,
      user: {
        id: bearer.user.id,
        email: bearer.user.email,
        nickname: nicknameFromUser(bearer.user),
      },
    };
  }

  const session = await getCurrentUser();
  if (!session) {
    return { ok: false, status: 401, error: "login_required" };
  }

  return {
    ok: true,
    user: {
      id: session.id,
      email: session.email,
      nickname: nicknameFromUser({
        email: session.email,
        name: session.name,
      }),
    },
  };
}

export function parseReviewInput(body: unknown): {
  rating: number;
  reviewBody: string;
  nickname?: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const rating =
    typeof o.rating === "number"
      ? Math.min(5, Math.max(1, Math.round(o.rating)))
      : 0;
  const reviewBody = typeof o.body === "string" ? o.body.trim() : "";
  if (
    !rating ||
    reviewBody.length < REVIEW_BODY_MIN ||
    reviewBody.length > REVIEW_BODY_MAX
  ) {
    return null;
  }
  const nickname =
    typeof o.nickname === "string" ? o.nickname.trim().slice(0, 30) : undefined;
  return { rating, reviewBody, nickname };
}
