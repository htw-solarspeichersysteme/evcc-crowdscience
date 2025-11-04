import { describe, expect, test } from "bun:test";

import { toLineProtocol } from "./influxdb";

describe("toLineProtocol", () => {
  describe("basic line protocol generation", () => {
    test("generates line with measurement, instance tag, and numeric value", () => {
      const metric = {
        measurement: "loadpoints",
        field: "chargePower",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "500",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'loadpoints,instance=019f547a-re3b6-7000-b65b-0347fa593d64,componentId=1 chargePower="500" 1762170321',
      );
    });

    test("generates line with site measurement", () => {
      const metric = {
        measurement: "site",
        field: "battery",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: "3",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'site,instance=019f547a-re3b6-7000-b65b-0347fa593d64 battery="3" 1762170321',
      );
    });

    test("generates line with battery measurement", () => {
      const metric = {
        measurement: "battery",
        field: "soc",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "50",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'battery,instance=019f547a-re3b6-7000-b65b-0347fa593d64,componentId=1 soc="50" 1762170321',
      );
    });
  });

  describe("string vs numeric value handling", () => {
    test("quotes string values", () => {
      const metric = {
        measurement: "loadpoints",
        field: "mode",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "pv",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain('mode="pv"');
    });

    test("handles numeric string values as numbers", () => {
      const metric = {
        measurement: "battery",
        field: "power",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: 2000,
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain("power=2000");
      expect(result).not.toContain('"2000"');
    });

    test("handles boolean-like strings", () => {
      const metric = {
        measurement: "battery",
        field: "controllable",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "true",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain('controllable="true"');
    });
  });

  describe("multiple tags handling", () => {
    test("includes all tags except field", () => {
      const metric = {
        measurement: "loadpoints",
        field: "chargePower",
        tags: { componentId: "1", vehicleId: "456" },
      };
      const result = toLineProtocol({
        metric,
        value: "500",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain("instance=");
      expect(result).toContain("componentId=1");
      expect(result).toContain("vehicleId=456");
      expect(result).toContain("chargePower=");
    });

    test("does not include value or field in tags section", () => {
      const metric = {
        measurement: "site",
        field: "battery",
        tags: { value: "shouldIgnore" },
      };
      const result = toLineProtocol({
        metric,
        value: "3",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).not.toContain("value=");
    });
  });

  describe("complex scenarios", () => {
    test("handles PV metrics from real MQTT output", () => {
      const metric = {
        measurement: "pv",
        field: "power",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "200",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'pv,instance=019f547a-re3b6-7000-b65b-0347fa593d64,componentId=1 power="200" 1762170321',
      );
    });

    test("handles updated signal", () => {
      const metric = {
        measurement: "updated",
        field: "updated",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: "1762170351",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170351",
      });

      expect(result).toContain("updated=");
      expect(result).toContain("1762170351");
    });

    test("handles grid metrics", () => {
      const metric = {
        measurement: "grid",
        field: "power",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: "300",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'grid,instance=019f547a-re3b6-7000-b65b-0347fa593d64 power="300" 1762170321',
      );
    });
  });

  describe("undefined value handling", () => {
    test("includes measurement without field value when value is undefined", () => {
      const metric = {
        measurement: "site",
        field: "battery",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: undefined,
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain("site,instance=");
      expect(result).toContain("1762170321");
    });
  });

  describe("timestamp formatting", () => {
    test("includes correct timestamp", () => {
      const metric = {
        measurement: "battery",
        field: "soc",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "50",
        instanceId: "test-instance",
        timestamp: "1234567890",
      });

      expect(result.endsWith("1234567890")).toBe(true);
    });

    test("handles different timestamp formats", () => {
      const metric = {
        measurement: "site",
        field: "power",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: "100",
        instanceId: "test-instance",
        timestamp: "9999999999999",
      });

      expect(result.endsWith("9999999999999")).toBe(true);
    });
  });
});
