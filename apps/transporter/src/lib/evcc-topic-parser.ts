import {
  TopicParser,
  type TopicParsingConfig,
  type Metric,
} from "./topic-parser";

// Create parser configurations based on your Telegraf config
const parserConfigs: TopicParsingConfig[] = [
  {
    measurement: "measurement/_/_",
    tags: "_/componentId/aspect",
    topic: "loadpoints/+/+",
  },
  {
    measurement: "measurement/_",
    tags: "_/aspect",
    topic: "site/+",
  },
  {
    measurement: "_/measurement/_",
    tags: "_/_/aspect",
    topic: "site/grid/+",
  },
  {
    measurement: "_/measurement/_/_",
    tags: "_/_/period/aspect",
    topic: "site/statistics/+/+",
  },
  {
    measurement: "_/measurement/_/_",
    tags: "_/_/componentId/aspect",
    topic: "site/pv/+/+",
  },
  {
    measurement: "_/measurement/_/_",
    tags: "_/_/componentId/aspect",
    topic: "site/battery/+/+",
  },
  {
    measurement: "measurement/_/_",
    tags: "_/vehicleId/aspect",
    topic: "vehicles/+/+",
  },
  {
    measurement: "measurement",
    tags: "aspect",
    topic: "updated",
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
