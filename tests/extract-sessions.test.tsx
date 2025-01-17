import { beforeEach, describe, expect, jest, test } from "bun:test";

describe("Export Functionality", () => {
  beforeEach(() => {
    console.log("before each");
  });

  test("Math.Random works", () => {
    const val = 1;
    expect(val).not.fail();
  });
});
