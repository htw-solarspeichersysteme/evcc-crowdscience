import { describe, expect, test } from "bun:test";

import { TopicParser } from "./topic-parser";

describe("TopicParser", () => {
  describe("constructor validation", () => {
    test("creates parser with valid config", () => {
      const config = {
        topic: "loadpoints/+/+",
        interpretation: "measurement/componentId/field",
      };
      const parser = new TopicParser(config);
      expect(parser).toBeDefined();
    });

    test("throws error when topic contains multiple hashes", () => {
      const config = {
        topic: "evcc/#/test/#",
        interpretation: "measurement",
      };
      expect(() => new TopicParser(config)).toThrow(
        "Topic can only contain one hash",
      );
    });

    test("throws error when interpretation contains multiple measurement elements", () => {
      const config = {
        topic: "site/+",
        interpretation: "measurement/measurement",
      };
      expect(() => new TopicParser(config)).toThrow(
        "Interpretation can only contain one 'measurement'",
      );
    });
  });

  describe("basic topic matching", () => {
    test("matches topic with fixed parts", () => {
      const config = {
        topic: "site/battery",
        interpretation: "_/measurement",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/battery");

      expect(result).not.toBeNull();
      expect(result?.measurement).toBe("battery");
    });

    test("returns null for non-matching topic", () => {
      const config = {
        topic: "site/battery",
        interpretation: "_/measurement",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/pv");

      expect(result).toBeNull();
    });

    test("matches topic with wildcard +", () => {
      const config = {
        topic: "loadpoints/+/power",
        interpretation: "measurement/componentId/_",
      };
      const parser = new TopicParser(config);

      expect(parser.parse("loadpoints/1/power")).not.toBeNull();
      expect(parser.parse("loadpoints/2/power")).not.toBeNull();
      expect(parser.parse("loadpoints/any/power")).not.toBeNull();
    });

    test("rejects topic with wrong length", () => {
      const config = {
        topic: "site/+/power",
        interpretation: "_/measurement/_",
      };
      const parser = new TopicParser(config);

      expect(parser.parse("site/power")).toBeNull();
      expect(parser.parse("site/1/power/extra")).toBeNull();
    });
  });

  describe("measurement extraction", () => {
    test("extracts measurement from first position", () => {
      const config = {
        topic: "site/+",
        interpretation: "measurement/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/battery");

      expect(result?.measurement).toBe("site");
    });

    test("extracts measurement from second position", () => {
      const config = {
        topic: "site/+/+",
        interpretation: "_/measurement/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/pv/power");

      expect(result?.measurement).toBe("pv");
    });

    test("handles measurement-only config", () => {
      const config = {
        topic: "updated",
        interpretation: "measurement",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("updated");

      expect(result?.measurement).toBe("updated");
    });
  });

  describe("tag extraction", () => {
    test("extracts single tag", () => {
      const config = {
        topic: "site/+",
        interpretation: "measurement/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/power");

      expect(result?.field).toBe("power");
      expect(result?.tags).toEqual({});
    });

    test("extracts multiple tags", () => {
      const config = {
        topic: "loadpoints/+/+",
        interpretation: "measurement/componentId/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("loadpoints/1/chargePower");

      expect(result?.field).toBe("chargePower");
      expect(result?.tags).toEqual({ componentId: "1" });
    });

    test("handles negative indices for tags", () => {
      const config = {
        topic: "site/+/power",
        interpretation: "_/field/_",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/battery/power");

      expect(result?.field).toBe("battery");
      expect(result?.tags).toEqual({});
    });

    test("returns null if tag value is missing", () => {
      const config = {
        topic: "loadpoints/+",
        interpretation: "measurement/componentId",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("loadpoints");

      expect(result).toBeNull();
    });
  });

  describe("field extraction", () => {
    test("extracts field from topic", () => {
      const config = {
        topic: "site/+/+",
        interpretation: "_/measurement/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/battery/soc");

      expect(result?.field).toBe("soc");
    });
  });

  describe("wildcard hash behavior", () => {
    test("accepts variable length topics with hash", () => {
      const config = {
        topic: "evcc/#",
        interpretation: "measurement",
      };
      const parser = new TopicParser(config);

      expect(parser.parse("evcc/a")).not.toBeNull();
      expect(parser.parse("evcc/a/b/c/d")).not.toBeNull();
      expect(parser.parse("evcc/a/b/c/d/e")).not.toBeNull();
    });

    test("requires minimum length with hash", () => {
      const config = {
        topic: "site/+/#",
        interpretation: "measurement/field",
      };
      const parser = new TopicParser(config);

      expect(parser.parse("site")).toBeNull();
      expect(parser.parse("site/power")).not.toBeNull();
      expect(parser.parse("site/power/extra")).not.toBeNull();
    });
  });

  describe("real-world evcc patterns", () => {
    test("parses loadpoints pattern", () => {
      const config = {
        topic: "loadpoints/+/+",
        interpretation: "measurement/componentId/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("loadpoints/1/chargePower");

      expect(result).toEqual({
        measurement: "loadpoints",
        field: "chargePower",
        tags: { componentId: "1" },
      });
    });

    test("parses site pattern", () => {
      const config = {
        topic: "site/+",
        interpretation: "measurement/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/battery");

      expect(result).toEqual({
        measurement: "site",
        field: "battery",
        tags: {},
      });
    });

    test("parses nested site pattern", () => {
      const config = {
        topic: "site/grid/+",
        interpretation: "_/measurement/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/grid/power");

      expect(result).toEqual({
        measurement: "grid",
        field: "power",
        tags: {},
      });
    });

    test("parses battery pattern", () => {
      const config = {
        topic: "site/battery/+/+",
        interpretation: "_/measurement/componentId/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("site/battery/1/soc");

      expect(result).toEqual({
        measurement: "battery",
        field: "soc",
        tags: { componentId: "1" },
      });
    });

    test("parses vehicle pattern", () => {
      const config = {
        topic: "vehicles/+/+",
        interpretation: "measurement/vehicleId/field",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("vehicles/abc123/soc");

      expect(result).toEqual({
        measurement: "vehicles",
        field: "soc",
        tags: { vehicleId: "abc123" },
      });
    });

    test("parses updated pattern", () => {
      const config = {
        topic: "updated",
        interpretation: "measurement",
      };
      const parser = new TopicParser(config);
      const result = parser.parse("updated");

      expect(result).toEqual({
        measurement: "updated",
        field: "",
        tags: {},
      });
    });
  });
});
