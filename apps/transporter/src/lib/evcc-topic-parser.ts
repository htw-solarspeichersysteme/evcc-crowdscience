import {
  TopicParser,
  type Metric,
  type TopicParsingConfig,
} from "./topic-parser";

// topic parser config inspired by telegraf syntax
const parserConfigs: TopicParsingConfig[] = [
  // loadpoints
  {
    topic: "loadpoints",
    interpretation: "measurement",
    fieldName: "count",
  },
  {
    topic: "loadpoints/+/+",
    interpretation: "measurement/componentId/field",
    mustHash: ["componentId"],
  },
  {
    topic: "loadpoints/+/chargeCurrents/+",
    interpretation: "measurement/componentId/field/phase",
    mustHash: ["componentId"],
  },
  {
    topic: "loadpoints/+/chargeVoltages/+",
    interpretation: "measurement/componentId/field/phase",
    mustHash: ["componentId"],
  },

  // site
  {
    topic: "site/+",
    interpretation: "measurement/field",
  },
  {
    topic: "site/battery/+/+",
    interpretation: "_/measurement/componentId/field",
    mustHash: ["componentId"],
  },
  {
    topic: "site/grid/+",
    interpretation: "_/measurement/field",
  },
  {
    topic: "site/grid/powers/+",
    interpretation: "_/measurement/field/gridId",
    mustHash: ["gridId"],
  },
  {
    topic: "site/grid/currents/+",
    interpretation: "_/measurement/field/gridId",
    mustHash: ["gridId"],
  },
  {
    topic: "site/statistics/+/+",
    interpretation: "_/measurement/period/field",
  },
  {
    topic: "site/pv/+/+",
    interpretation: "_/measurement/componentId/field",
    mustHash: ["componentId"],
  },
  {
    topic: "site/circuits/+/+",
    interpretation: "_/measurement/circuitId/field",
    mustHash: ["circuitId"],
  },

  // vehicles
  {
    topic: "vehicles",
    interpretation: "measurement",
    fieldName: "count",
  },
  {
    topic: "vehicles/+/+",
    interpretation: "measurement/vehicleId/field",
    mustHash: ["vehicleId"],
  },

  // misc
  {
    topic: "updated",
    interpretation: "measurement",
    fieldName: "updated",
  },
  {
    topic: "status",
    interpretation: "measurement",
    fieldName: "status",
  },
];

// Create parsers for each configuration
const parsers = parserConfigs.map((config) => new TopicParser(config));

export function parseEvccTopic(topic: string): Metric | null {
  for (const parser of parsers) {
    const result = parser.parse(topic);
    if (result) {
      return result;
    }
  }
  return null;
}
