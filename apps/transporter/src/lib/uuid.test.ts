import { describe, expect, test } from "bun:test";

import { isUuidV7 } from "./uuid";

describe("isUuidV7", () => {
  describe("valid UUIDv7", () => {
    test("accepts valid UUIDv7 lowercase", () => {
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a515")).toBe(true);
    });

    test("accepts valid UUIDv7 uppercase", () => {
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a515")).toBe(true);
    });

    test("accepts valid UUIDv7 mixed case", () => {
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a515")).toBe(true);
    });

    test("accepts various valid UUIDv7 with correct version (7) and variant bits (8-b)", () => {
      expect(isUuidV7("ffffffff-ffff-7fff-8fff-ffffffffffff")).toBe(true);
      expect(isUuidV7("00000000-0000-7000-8000-000000000000")).toBe(true);
      expect(isUuidV7("12345678-90ab-7cde-9f01-234567890abc")).toBe(true);
    });

    test("accepts variant bits 9 and a in third part", () => {
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a515")).toBe(true);
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a515")).toBe(true);
    });

    test("accepts variant bit b in third part", () => {
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a515")).toBe(true);
    });
  });

  describe("invalid UUIDs", () => {
    test("rejects UUIDv4 (wrong version)", () => {
      expect(isUuidV7("12345678-1234-4234-a234-123456789012")).toBe(false);
    });

    test("rejects UUIDv1 (wrong version)", () => {
      expect(isUuidV7("550e8400-e29b-11d4-a716-446655440000")).toBe(false);
    });

    test("rejects UUID with wrong variant bits", () => {
      expect(isUuidV7("019a4a4f-474e-7000-45fa-abe87e05a515")).toBe(false); // variant bit 4
      expect(isUuidV7("019a4a4f-474e-7000-c5fa-abe87e05a515")).toBe(false); // variant bit c
      expect(isUuidV7("019a4a4f-474e-7000-d5fa-abe87e05a515")).toBe(false); // variant bit d
      expect(isUuidV7("019a4a4f-474e-7000-f5fa-abe87e05a515")).toBe(false); // variant bit f
    });

    test("rejects malformed UUIDs", () => {
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a51")).toBe(false); // too short
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a5155")).toBe(false); // too long
      expect(isUuidV7("019a4a4f474e700095faabe87e05a515")).toBe(false); // missing hyphens
      expect(isUuidV7("019a4a4f-474e-7000-95fa")).toBe(false); // incomplete
    });

    test("rejects empty and null-like strings", () => {
      expect(isUuidV7("")).toBe(false);
      expect(isUuidV7("   ")).toBe(false);
    });

    test("rejects non-hex characters", () => {
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a51g")).toBe(false);
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a51!")).toBe(false);
      expect(isUuidV7("019a4a4f-474e-7000-95fa-abe87e05a51 ")).toBe(false);
    });

    test("rejects partial UUIDs", () => {
      expect(isUuidV7("019a4a4f-474e-7000-95fa")).toBe(false);
      expect(isUuidV7("019a4a4f")).toBe(false);
    });
  });
});
