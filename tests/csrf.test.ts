/**
 * Tests for CSRF protection (src/lib/csrf.ts)
 * - Token generation
 * - Double-submit cookie validation
 * - Origin check
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to mock Next.js imports before importing the module
vi.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    body: unknown;
    _cookies = new Map<string, { value: string; options?: Record<string, unknown> }>();

    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      const res = new MockNextResponse(data, init);
      (res as any)._jsonData = data;
      return res;
    }

    get cookies() {
      const self = this;
      return {
        set(name: string, value: string, options?: Record<string, unknown>) {
          self._cookies.set(name, { value, options });
        },
        get(name: string) {
          return self._cookies.get(name);
        },
      };
    }
  }

  class MockNextRequest {
    headers: Map<string, string>;
    _cookies: Map<string, string>;

    constructor(url: string, init?: { headers?: Record<string, string>; cookies?: Record<string, string> }) {
      this.headers = new Map(Object.entries(init?.headers ?? {}));
      this._cookies = new Map(Object.entries(init?.cookies ?? {}));
    }

    get cookies() {
      const self = this;
      return {
        get(name: string) {
          const v = self._cookies.get(name);
          return v ? { value: v } : undefined;
        },
      };
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

// Mock crypto module
vi.mock("crypto", () => ({
  randomBytes: (size: number) => ({
    toString: (encoding: string) => "a".repeat(size * 2), // predictable hex output
  }),
}));

// Now import the module
import { generateCsrfTokenResponse, validateCsrf } from "@/lib/csrf";
import { NextRequest } from "next/server";

describe("CSRF Protection", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateCsrfTokenResponse", () => {
    it("should return a response with csrfToken in body", () => {
      const res = generateCsrfTokenResponse() as any;
      expect(res._jsonData).toBeDefined();
      expect(res._jsonData.csrfToken).toBe("a".repeat(64));
    });

    it("should set csrf_token cookie", () => {
      const res = generateCsrfTokenResponse() as any;
      const cookie = res._cookies.get("csrf_token");
      expect(cookie).toBeDefined();
      expect(cookie.value).toBe("a".repeat(64));
    });

    it("should set cookie as httpOnly", () => {
      const res = generateCsrfTokenResponse() as any;
      const cookie = res._cookies.get("csrf_token");
      expect(cookie.options.httpOnly).toBe(true);
    });

    it("should set sameSite to lax", () => {
      const res = generateCsrfTokenResponse() as any;
      const cookie = res._cookies.get("csrf_token");
      expect(cookie.options.sameSite).toBe("lax");
    });

    it("should set secure=true when SITE_URL is https", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const res = generateCsrfTokenResponse() as any;
      const cookie = res._cookies.get("csrf_token");
      expect(cookie.options.secure).toBe(true);
    });

    it("should set secure=true in production", () => {
      process.env.NODE_ENV = "production";
      const res = generateCsrfTokenResponse() as any;
      const cookie = res._cookies.get("csrf_token");
      expect(cookie.options.secure).toBe(true);
    });

    it("should set maxAge to 3600 seconds", () => {
      const res = generateCsrfTokenResponse() as any;
      const cookie = res._cookies.get("csrf_token");
      expect(cookie.options.maxAge).toBe(3600);
    });
  });

  describe("validateCsrf", () => {
    function makeRequest(opts: {
      origin?: string;
      referer?: string;
      csrfCookie?: string;
      csrfHeader?: string;
    }) {
      const headers: Record<string, string> = {};
      if (opts.origin) headers.origin = opts.origin;
      if (opts.referer) headers.referer = opts.referer;
      if (opts.csrfHeader) headers["x-csrf-token"] = opts.csrfHeader;

      const cookies: Record<string, string> = {};
      if (opts.csrfCookie) cookies.csrf_token = opts.csrfCookie;

      return new NextRequest("https://ara.pink/api/test", { headers, cookies } as any);
    }

    it("should return ok when tokens match and origin matches", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const req = makeRequest({
        origin: "https://ara.pink",
        csrfCookie: "abc123",
        csrfHeader: "abc123",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(true);
    });

    it("should fail when cookie token is missing", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const req = makeRequest({
        origin: "https://ara.pink",
        csrfHeader: "abc123",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result.response as any)._jsonData.error).toBe("csrf_token_missing");
      }
    });

    it("should fail when header token is missing", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const req = makeRequest({
        origin: "https://ara.pink",
        csrfCookie: "abc123",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result.response as any)._jsonData.error).toBe("csrf_token_missing");
      }
    });

    it("should fail when tokens do not match", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const req = makeRequest({
        origin: "https://ara.pink",
        csrfCookie: "abc123",
        csrfHeader: "xyz789",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result.response as any)._jsonData.error).toBe("csrf_token_mismatch");
      }
    });

    it("should fail when origin does not match site URL", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const req = makeRequest({
        origin: "https://evil.com",
        csrfCookie: "abc123",
        csrfHeader: "abc123",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result.response as any)._jsonData.error).toBe("csrf_origin_mismatch");
      }
    });

    it("should check referer when origin is absent", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const req = makeRequest({
        referer: "https://evil.com/page",
        csrfCookie: "abc123",
        csrfHeader: "abc123",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(false);
    });

    it("should pass when referer matches site URL", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const req = makeRequest({
        referer: "https://ara.pink/some/page",
        csrfCookie: "abc123",
        csrfHeader: "abc123",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(true);
    });

    it("should pass when SITE_URL is not set (no origin check)", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.SITE_URL;
      const req = makeRequest({
        csrfCookie: "abc123",
        csrfHeader: "abc123",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(true);
    });

    it("should fail on invalid origin URL", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      const req = makeRequest({
        origin: "not-a-valid-url",
        csrfCookie: "abc123",
        csrfHeader: "abc123",
      });
      const result = validateCsrf(req);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result.response as any)._jsonData.error).toBe("csrf_invalid_origin");
      }
    });
  });
});
