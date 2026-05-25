/**
 * Tests for Polar configuration (src/lib/polarConfig.ts)
 * - Credit pack lookup
 * - Product ID resolution
 * - Site URL generation
 * - Polar client creation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @polar-sh/sdk
vi.mock("@polar-sh/sdk", () => {
  return {
    Polar: class MockPolar {
      config: any;
      checkouts = { create: vi.fn() };
      constructor(config: any) {
        this.config = config;
      }
    },
  };
});

import {
  getCreditPack,
  getCreditPackProductId,
  getSiteUrl,
  getPolarEnvStatus,
  createPolarClient,
  creditPacks,
} from "@/lib/polarConfig";

describe("Polar Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("creditPacks", () => {
    it("should have 3 credit packs", () => {
      expect(creditPacks).toHaveLength(3);
    });

    it("should have starter, creator, and studio packs", () => {
      const keys = creditPacks.map((p) => p.key);
      expect(keys).toContain("starter");
      expect(keys).toContain("creator");
      expect(keys).toContain("studio");
    });

    it("should have increasing credits", () => {
      const starter = creditPacks.find((p) => p.key === "starter")!;
      const creator = creditPacks.find((p) => p.key === "creator")!;
      const studio = creditPacks.find((p) => p.key === "studio")!;
      expect(starter.credits).toBeLessThan(creator.credits);
      expect(creator.credits).toBeLessThan(studio.credits);
    });

    it("should have increasing prices", () => {
      const starter = creditPacks.find((p) => p.key === "starter")!;
      const creator = creditPacks.find((p) => p.key === "creator")!;
      const studio = creditPacks.find((p) => p.key === "studio")!;
      expect(starter.priceUsd).toBeLessThan(creator.priceUsd);
      expect(creator.priceUsd).toBeLessThan(studio.priceUsd);
    });

    it("each pack should have a productEnvName", () => {
      for (const pack of creditPacks) {
        expect(pack.productEnvName).toBeTruthy();
        expect(pack.productEnvName).toMatch(/^POLAR_CREDITS_/);
      }
    });
  });

  describe("getCreditPack", () => {
    it("should return the starter pack", () => {
      const pack = getCreditPack("starter");
      expect(pack).not.toBeNull();
      expect(pack!.key).toBe("starter");
      expect(pack!.credits).toBe(2200);
    });

    it("should return the creator pack", () => {
      const pack = getCreditPack("creator");
      expect(pack).not.toBeNull();
      expect(pack!.key).toBe("creator");
    });

    it("should return null for invalid key", () => {
      expect(getCreditPack("invalid")).toBeNull();
    });

    it("should return null for null", () => {
      expect(getCreditPack(null)).toBeNull();
    });

    it("should return null for undefined", () => {
      expect(getCreditPack(undefined)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(getCreditPack("")).toBeNull();
    });
  });

  describe("getCreditPackProductId", () => {
    it("should return product ID from env", () => {
      process.env.POLAR_CREDITS_STARTER_PRODUCT_ID = "prod_123";
      const pack = getCreditPack("starter")!;
      expect(getCreditPackProductId(pack)).toBe("prod_123");
    });

    it("should return null when env var is not set", () => {
      delete process.env.POLAR_CREDITS_STARTER_PRODUCT_ID;
      const pack = getCreditPack("starter")!;
      expect(getCreditPackProductId(pack)).toBeNull();
    });

    it("should return null for empty string env var", () => {
      process.env.POLAR_CREDITS_STARTER_PRODUCT_ID = "";
      const pack = getCreditPack("starter")!;
      expect(getCreditPackProductId(pack)).toBeNull();
    });

    it("should trim whitespace", () => {
      process.env.POLAR_CREDITS_STARTER_PRODUCT_ID = "  prod_456  ";
      const pack = getCreditPack("starter")!;
      expect(getCreditPackProductId(pack)).toBe("prod_456");
    });
  });

  describe("getSiteUrl", () => {
    it("should return NEXT_PUBLIC_SITE_URL when set", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink";
      expect(getSiteUrl()).toBe("https://ara.pink");
    });

    it("should fallback to SITE_URL", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.SITE_URL = "https://example.com";
      expect(getSiteUrl()).toBe("https://example.com");
    });

    it("should fallback to VERCEL_PROJECT_PRODUCTION_URL", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.SITE_URL;
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.vercel.app";
      expect(getSiteUrl()).toBe("https://myapp.vercel.app");
    });

    it("should default to https://ara.pink", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.SITE_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      expect(getSiteUrl()).toBe("https://ara.pink");
    });

    it("should strip trailing slash", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://ara.pink/";
      expect(getSiteUrl()).toBe("https://ara.pink");
    });

    it("should prepend https:// for bare domains", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "ara.pink";
      expect(getSiteUrl()).toBe("https://ara.pink");
    });
  });

  describe("getPolarEnvStatus", () => {
    it("should report missing tokens", () => {
      delete process.env.POLAR_ACCESS_TOKEN;
      delete process.env.POLAR_WEBHOOK_SECRET;
      const status = getPolarEnvStatus();
      expect(status.hasAccessToken).toBe(false);
      expect(status.hasWebhookSecret).toBe(false);
    });

    it("should report present tokens", () => {
      process.env.POLAR_ACCESS_TOKEN = "tok_123";
      process.env.POLAR_WEBHOOK_SECRET = "whsec_123";
      const status = getPolarEnvStatus();
      expect(status.hasAccessToken).toBe(true);
      expect(status.hasWebhookSecret).toBe(true);
    });

    it("should default to sandbox server", () => {
      delete process.env.POLAR_SERVER;
      const status = getPolarEnvStatus();
      expect(status.server).toBe("sandbox");
    });

    it("should use production when set", () => {
      process.env.POLAR_SERVER = "production";
      const status = getPolarEnvStatus();
      expect(status.server).toBe("production");
    });

    it("should list configured product keys", () => {
      process.env.POLAR_CREDITS_STARTER_PRODUCT_ID = "prod_1";
      process.env.POLAR_CREDITS_CREATOR_PRODUCT_ID = "prod_2";
      delete process.env.POLAR_CREDITS_STUDIO_PRODUCT_ID;
      const status = getPolarEnvStatus();
      expect(status.configuredProductKeys).toContain("starter");
      expect(status.configuredProductKeys).toContain("creator");
      expect(status.configuredProductKeys).not.toContain("studio");
    });
  });

  describe("createPolarClient", () => {
    it("should throw when POLAR_ACCESS_TOKEN is not set", () => {
      delete process.env.POLAR_ACCESS_TOKEN;
      expect(() => createPolarClient()).toThrow("POLAR_ACCESS_TOKEN is required");
    });

    it("should create client when token is set", () => {
      process.env.POLAR_ACCESS_TOKEN = "tok_123";
      const client = createPolarClient();
      expect(client).toBeDefined();
    });
  });
});
