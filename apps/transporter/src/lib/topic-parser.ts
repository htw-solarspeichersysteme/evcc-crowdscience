export interface TopicParsingConfig {
  topic: string;
  interpretation: string;
  fieldName?: string;
  mustHash?: string[];
}

export interface Metric {
  measurement: string;
  field: string;
  tags: Record<string, string>;
}

export class TopicParser {
  private topicIndices: Record<string, number>;
  private topicVarLength: boolean;
  private topicMinLength: number;
  private extractMeasurement: boolean;
  private measurementIndex: number;
  private measurementValue: string | null;
  private tagIndices: Record<string, number>;
  private config: TopicParsingConfig;

  constructor(config: TopicParsingConfig) {
    this.topicVarLength = false;
    this.extractMeasurement = false;
    this.measurementIndex = 0;
    this.measurementValue = null;
    this.topicIndices = {};
    this.tagIndices = {};
    this.topicMinLength = 0;
    this.config = config;

    // Parse topic pattern
    const topicParts = config.topic.split("/");
    let topicInvert = false;
    let topicMinLength = 0;

    topicParts.forEach((part, i) => {
      switch (part) {
        case "+":
          topicMinLength++;
          break;
        case "#":
          if (this.topicVarLength) {
            throw new Error("Topic can only contain one hash");
          }
          this.topicVarLength = true;
          topicInvert = true;
          break;
        default:
          this.topicIndices[part] = topicInvert ? i - topicParts.length : i;
          topicMinLength++;
      }
    });

    // Parse interpretation pattern
    const interpretationParts = config.interpretation.split("/");
    let interpretationInvert = false;
    let interpretationMinLength = 0;

    interpretationParts.forEach((part, i) => {
      if (part === "_" || part === "") {
        interpretationMinLength++;
        return;
      }

      if (part === "#") {
        interpretationInvert = true;
        return;
      }

      if (part === "measurement") {
        if (this.extractMeasurement) {
          throw new Error("Interpretation can only contain one 'measurement'");
        }
        this.measurementIndex = interpretationInvert
          ? i - interpretationParts.length
          : i;
        this.extractMeasurement = true;
        interpretationMinLength++;
      } else {
        // All other parts are tags
        this.tagIndices[part] = interpretationInvert
          ? i - interpretationParts.length
          : i;
        interpretationMinLength++;
      }
    });

    // Validate lengths
    if (!this.topicVarLength) {
      if (interpretationMinLength !== topicMinLength) {
        throw new Error("Interpretation length does not equal topic length");
      }
    }

    this.topicMinLength = Math.max(topicMinLength, interpretationMinLength);

    // If no measurement position is specified, check if there's a fixed measurement in topic
    if (!this.extractMeasurement) {
      // Use the first fixed part of the topic as the measurement name
      for (const [part, index] of Object.entries(this.topicIndices)) {
        if (
          index === 0 ||
          (index < 0 && Math.abs(index) === topicParts.length)
        ) {
          this.measurementValue = part;
          break;
        }
      }
    }
  }

  parse(topic: string): Metric | null {
    const metric: Metric = {
      measurement: "",
      field: this.config.fieldName ?? "",
      tags: {},
    };

    const topicParts = topic.split("/");

    // Check if topic matches the pattern
    if (
      (this.topicVarLength && topicParts.length < this.topicMinLength) ||
      (!this.topicVarLength && topicParts.length !== this.topicMinLength)
    ) {
      return null;
    }

    // Check if fixed parts match
    for (const [expected, i] of Object.entries(this.topicIndices)) {
      const actualIndex = i >= 0 ? i : topicParts.length + i;
      const actualPart = topicParts[actualIndex];
      if (!actualPart || actualPart !== expected) {
        return null;
      }
    }

    // Extract measurement name
    if (this.extractMeasurement) {
      const actualIndex =
        this.measurementIndex >= 0
          ? this.measurementIndex
          : topicParts.length + this.measurementIndex;
      const measurementValue = topicParts[actualIndex];
      if (!measurementValue) {
        return null;
      }
      metric.measurement = measurementValue;
    } else if (this.measurementValue) {
      metric.measurement = this.measurementValue;
    }

    // Extract tags
    for (const [key, i] of Object.entries(this.tagIndices)) {
      const actualIndex = i >= 0 ? i : topicParts.length + i;
      const tagValue = topicParts[actualIndex];
      if (!tagValue) {
        return null;
      }

      // extract field name, don't keep it as a tag
      if (key === "field") {
        metric.field = tagValue;
        continue;
      }

      // Hash tags that are required to be hashed
      if (this.config.mustHash?.includes(key)) {
        metric.tags[key] = Bun.hash(tagValue, 4321).toString();
        continue;
      }

      metric.tags[key] = tagValue;
    }

    return metric;
  }
}
