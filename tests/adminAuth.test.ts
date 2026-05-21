/**
 * Tests for admin auth utility (src/lib/adminAuth.ts)
 * - hasAdminPolicyConfigured
 * - getAdminAccess in development mode (no Supabase)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: () => ({
    getAll: () => [],
  }),
}));

// Mock supabase ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error("no session") }),
    },
  }),
}));

// Mock cookie options
vi.mock("@/lib/supabaseCookieOptions", () => ({
  getSupabaseAuthCookieOptions: () => ({}),
}));

import { hasAdminPolicyConfigured, getAdminAccess } from "@/lib/adminAuth";

describe("Admin Auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("hasAdminPolicyConfigured", () => {
    it("should return false when no env vars set", () => {
      delete process.env.ADMIN_EMAILS;
      delete process.env.ADMIN_USER_IDS;
      expect(hasAdminPolicyConfigured()).toBe(false);
    });

    it("should return true when ADMIN_EMAILS is set", () => {
      process.env.ADMIN_EMAILS = "admin@ara.pink";
      expect(hasAdminPolicyConfigured()).toBe(true);
    });

    it("should return true when ADMIN_USER_IDS is set", () => {
      process.env.ADMIN_USER_IDS = "user_123";
      expect(hasAdminPolicyConfigured()).toBe(true);
    });

    it("should return false when values are empty strings", () => {
      process.env.ADMIN_EMAILS = "";
      process.env.ADMIN_USER_IDS = "";
      expect(hasAdminPolicyConfigured()).toBe(false);
    });

    it("should handle comma-separated emails", () => {
      process.env.ADMIN_EMAILS = "admin1@ara.pink, admin2@ara.pink";
      expect(hasAdminPolicyConfigured()).toBe(true);
    });
  });

  describe("getAdminAccess", () => {
    it("should grant development access when Supabase not configured", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.NODE_ENV = "development";

      const access = await getAdminAccess();
      expect(access.ok).toBe(true);
      if (access.ok) {
        expect(access.mode).toBe("development");
      }
    });

    it("should deny access in production when Supabase not configured", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.NODE_ENV = "production";

      const access = await getAdminAccess();
      expect(access.ok).toBe(false);
    });

    it("should grant development access when admin policy not configured (dev)", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "key";
      delete process.env.ADMIN_EMAILS;
      delete process.env.ADMIN_USER_IDS;
      process.env.NODE_ENV = "development";

      const access = await getAdminAccess();
      expect(access.ok).toBe(true);
      if (access.ok) {
        expect(access.mode).toBe("development");
      }
    });

    it("should deny access in production when admin policy not configured", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "key";
      delete process.env.ADMIN_EMAILS;
      delete process.env.ADMIN_USER_IDS;
      process.env.NODE_ENV = "production";

      const access = await getAdminAccess();
      expect(access.ok).toBe(false);
      if (!access.ok) {
        expect(access.mode).toBe("not_configured");
      }
    });

    it("should grant development access when no session found (dev)", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "key";
      process.env.ADMIN_EMAILS = "admin@ara.pink";
      process.env.NODE_ENV = "development";

      const access = await getAdminAccess();
      expect(access.ok).toBe(true);
      if (access.ok) {
        expect(access.mode).toBe("development");
      }
    });
  });
});
