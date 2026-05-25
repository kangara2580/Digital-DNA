/**
 * Tests for rate limiting (src/lib/rateLimit.ts)
 * - IP-based throttling
 * - Window expiration
 * - Prefix isolation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js
vi.mock("next/server", () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    _headers: Record<string, string>;

    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this._headers = init?.headers ?? {};
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      const res = new MockNextResponse(data, init);
      (res as any)._jsonData = data;
      return res;
    }
  }

  class MockNextRequest {
    headers: Map<string, string>;

    constructor(url: string, init?: { headers?: Record<string, string> }) {
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

import { checkRateLimit } from "@/lib/rateLimit";
import { NextRequest } from "next/server";

function makeRequest(ip = "127.0.0.1"): any {
  return new NextRequest("https://ara.pink/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("Rate Limiting", () => {
  // Note: The store is module-level, so we can't easily reset it between tests.
  // We use unique prefixes per test to isolate them.

  it("should allow first request", () => {
    const req = makeRequest("10.0.0.1");
    const result = checkRateLimit(req, {
      windowMs: 60_000,
      maxRequests: 5,
      prefix: "test-allow-first",
    });
    expect(result.ok).toBe(true);
  });

  it("should allow requests up to the limit", () => {
    const opts = { windowMs: 60_000, maxRequests: 3, prefix: "test-up-to-limit" };
    for (let i = 0; i < 3; i++) {
      const req = makeRequest("10.0.0.2");
      const result = checkRateLimit(req, opts);
      expect(result.ok).toBe(true);
    }
  });

  it("should block requests exceeding the limit", () => {
    const opts = { windowMs: 60_000, maxRequests: 2, prefix: "test-exceed" };
    const req1 = makeRequest("10.0.0.3");
    const req2 = makeRequest("10.0.0.3");
    const req3 = makeRequest("10.0.0.3");

    expect(checkRateLimit(req1, opts).ok).toBe(true);
    expect(checkRateLimit(req2, opts).ok).toBe(true);
    const result = checkRateLimit(req3, opts);
    expect(result.ok).toBe(false);
  });

  it("should return 429 status when blocked", () => {
    const opts = { windowMs: 60_000, maxRequests: 1, prefix: "test-429" };
    const req = makeRequest("10.0.0.4");

    checkRateLimit(req, opts);
    const result = checkRateLimit(req, opts);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(429);
    }
  });

  it("should return retryAfter in error body", () => {
    const opts = { windowMs: 60_000, maxRequests: 1, prefix: "test-retry-after" };
    const req = makeRequest("10.0.0.5");

    checkRateLimit(req, opts);
    const result = checkRateLimit(req, opts);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const data = (result.response as any)._jsonData;
      expect(data.error).toBe("too_many_requests");
      expect(data.retryAfter).toBeGreaterThan(0);
    }
  });

  it("should isolate by prefix", () => {
    const optsA = { windowMs: 60_000, maxRequests: 1, prefix: "test-prefix-a" };
    const optsB = { windowMs: 60_000, maxRequests: 1, prefix: "test-prefix-b" };
    const req = makeRequest("10.0.0.6");

    checkRateLimit(req, optsA);
    const resultA = checkRateLimit(req, optsA);
    const resultB = checkRateLimit(req, optsB);

    expect(resultA.ok).toBe(false); // exceeded for prefix A
    expect(resultB.ok).toBe(true); // first for prefix B
  });

  it("should isolate by IP", () => {
    const opts = { windowMs: 60_000, maxRequests: 1, prefix: "test-ip-isolate" };

    checkRateLimit(makeRequest("10.0.0.7"), opts);
    const result1 = checkRateLimit(makeRequest("10.0.0.7"), opts);
    const result2 = checkRateLimit(makeRequest("10.0.0.8"), opts);

    expect(result1.ok).toBe(false); // same IP, exceeded
    expect(result2.ok).toBe(true); // different IP, fresh
  });

  it("should use x-real-ip as fallback", () => {
    const opts = { windowMs: 60_000, maxRequests: 1, prefix: "test-real-ip" };
    const req = new (NextRequest as any)("https://ara.pink/api/test", {
      headers: { "x-real-ip": "10.0.0.9" },
    });

    expect(checkRateLimit(req, opts).ok).toBe(true);
    expect(checkRateLimit(req, opts).ok).toBe(false);
  });

  it("should use 'unknown' when no IP headers present", () => {
    const opts = { windowMs: 60_000, maxRequests: 1, prefix: "test-unknown-ip" };
    const req = new (NextRequest as any)("https://ara.pink/api/test", { headers: {} });

    expect(checkRateLimit(req, opts).ok).toBe(true);
    expect(checkRateLimit(req, opts).ok).toBe(false);
  });
});
