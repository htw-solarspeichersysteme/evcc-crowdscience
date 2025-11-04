import { describe, expect, test } from "bun:test";

import { filterTopic } from "./filtering";

describe("filterTopic", () => {
  describe("returns true for invalid topics", () => {
    test("filters topics containing 'forecast'", () => {
      expect(
        filterTopic(
          "evcc/019a4a4f-474e-7000-95fa-abe87e05a515/site/forecast/hourly",
        ),
      ).toBe(true);
      expect(filterTopic("FORECAST")).toBe(true);
      expect(filterTopic("forecast")).toBe(true);
    });

    test("filters topics containing 'title'", () => {
      expect(
        filterTopic("evcc/019a4a4f-474e-7000-95fa-abe87e05a515/site/title"),
      ).toBe(true);
      expect(filterTopic("TITLE")).toBe(true);
      expect(filterTopic("title")).toBe(true);
    });

    test("filters topics containing 'vehicleodometer'", () => {
      expect(filterTopic("evcc/vehicles/123/vehicleodometer")).toBe(true);
      expect(filterTopic("VEHICLEODOMETER")).toBe(true);
      expect(filterTopic("vehicleodometer")).toBe(true);
    });

    test("filters topics containing 'tariffprice'", () => {
      expect(
        filterTopic(
          "evcc/019a4a4f-474e-7000-95fa-abe87e05a515/site/tariffprice",
        ),
      ).toBe(true);
      expect(filterTopic("TARIFFPRICE")).toBe(true);
      expect(filterTopic("tariffprice")).toBe(true);
    });

    test("filters topics containing 'tariffco2'", () => {
      expect(
        filterTopic("evcc/019a4a4f-474e-7000-95fa-abe87e05a515/site/tariffco2"),
      ).toBe(true);
      expect(filterTopic("TARIFFCO2")).toBe(true);
      expect(filterTopic("tariffco2")).toBe(true);
    });

    test("case insensitive filtering", () => {
      expect(filterTopic("evcc/FoRecast/hourly")).toBe(true);
      expect(filterTopic("evcc/TiTlE")).toBe(true);
      expect(filterTopic("evcc/TaRiFfPrIcE")).toBe(true);
      expect(filterTopic("evcc/TaRiFfCo2")).toBe(true);
    });

    test("filters topics with multiple occurrences", () => {
      expect(filterTopic("forecast/forecast/forecast")).toBe(true);
      expect(filterTopic("title/something/title")).toBe(true);
    });
  });

  describe("returns false for valid topics", () => {
    test("allows loadpoints topics", () => {
      expect(
        filterTopic(
          "evcc/019a4a4f-474e-7000-95fa-abe87e05a515/loadpoints/1/chargePower",
        ),
      ).toBe(false);
      expect(filterTopic("loadpoints/1/power")).toBe(false);
    });

    test("allows site topics", () => {
      expect(
        filterTopic("evcc/019a4a4f-474e-7000-95fa-abe87e05a515/site/battery"),
      ).toBe(false);
      expect(filterTopic("site/pvPower")).toBe(false);
    });

    test("allows battery topics", () => {
      expect(
        filterTopic("evcc/019a4a4f-474e-7000-95fa-abe87e05a515/battery/1/soc"),
      ).toBe(false);
      expect(filterTopic("battery/1/power")).toBe(false);
    });

    test("allows pv topics", () => {
      expect(
        filterTopic("evcc/019a4a4f-474e-7000-95fa-abe87e05a515/pv/1/power"),
      ).toBe(false);
      expect(filterTopic("pv/2/power")).toBe(false);
    });

    test("allows vehicle topics", () => {
      expect(
        filterTopic(
          "evcc/019a4a4f-474e-7000-95fa-abe87e05a515/vehicles/123/soc",
        ),
      ).toBe(false);
      expect(filterTopic("vehicles/abc/power")).toBe(false);
    });

    test("allows grid topics", () => {
      expect(
        filterTopic("evcc/019a4a4f-474e-7000-95fa-abe87e05a515/grid/power"),
      ).toBe(false);
      expect(filterTopic("grid/power")).toBe(false);
    });

    test("allows updated topics", () => {
      expect(
        filterTopic("evcc/019a4a4f-474e-7000-95fa-abe87e05a515/updated"),
      ).toBe(false);
      expect(filterTopic("updated")).toBe(false);
    });

    test("allows mixed valid topics", () => {
      expect(
        filterTopic(
          "evcc/019f547a-re3b6-7000-b65b-0347fa593d64/loadpoints/1/effectiveMaxCurrent",
        ),
      ).toBe(false);
      expect(
        filterTopic(
          "evcc/019f547a-re3b6-7000-b65b-0347fa593d64/site/homePower",
        ),
      ).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("empty string returns false", () => {
      expect(filterTopic("")).toBe(false);
    });

    test("single character topics return false", () => {
      expect(filterTopic("a")).toBe(false);
      expect(filterTopic("f")).toBe(false);
    });

    test("partial matches don't filter", () => {
      expect(
        filterTopic("evcc/019a4a4f-474e-7000-95fa-abe87e05a515/site/something"),
      ).toBe(false);
      expect(filterTopic("mytopic")).toBe(false);
    });
  });
});
