import { beforeEach, describe, expect, jest, test } from "bun:test";

const random = jest.fn(() => Math.random());

describe("Export Loadingsessions", () => {
  beforeEach(() => {
    console.log("before each");
  });

  test("Math.Random works", () => {
    const val = random();
    expect(val).not.fail();
  });
});
