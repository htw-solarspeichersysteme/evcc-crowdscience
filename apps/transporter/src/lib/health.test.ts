import { describe, expect, test } from "bun:test";

import { healthcheckResponse } from "./health";

describe("healthcheckResponse", () => {
  test("returns 200 when mqtt is connected", async () => {
    const response = healthcheckResponse(true);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      mqtt: "connected",
    });
  });

  test("returns 503 when mqtt is disconnected", async () => {
    const response = healthcheckResponse(false);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "unhealthy",
      mqtt: "disconnected",
    });
  });
});
