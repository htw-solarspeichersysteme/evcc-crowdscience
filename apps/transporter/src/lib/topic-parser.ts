export interface TopicParsingConfig {
  topic: string;
  measurement: string;
  tags: string;
  fields?: string;
  fieldTypes?: Record<string, "uint" | "int" | "float">;
}

export interface Metric {
  name: string;
  tags: Record<string, string>;
  fields: Record<string, any>;
}

export class TopicParser {
  private topicIndices: Record<string, number>;
  private topicVarLength: boolean;
  private topicMinLength: number;
  private extractMeasurement: boolean;
  private measurementIndex: number;
  private tagIndices: Record<string, number>;
  private fieldIndices: Record<string, number>;
  private fieldTypes: Record<string, "uint" | "int" | "float">;

  constructor(config: TopicParsingConfig) {
    this.fieldTypes = config.fieldTypes ?? {};
    this.topicVarLength = false;
    this.extractMeasurement = false;
    this.measurementIndex = 0;
    this.topicIndices = {};
    this.tagIndices = {};
    this.fieldIndices = {};
    this.topicMinLength = 0;

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

    // Parse measurement pattern
    const measurementParts = config.measurement.split("/");
    let measurementInvert = false;
    let measurementMinLength = 0;

    measurementParts.forEach((part, i) => {
      if (part === "_" || part === "") {
        measurementMinLength++;
        return;
      }

      if (part === "#") {
        measurementInvert = true;
        return;
      }

      if (this.extractMeasurement) {
        throw new Error("Measurement can only contain one element");
      }

      this.measurementIndex = measurementInvert
        ? i - measurementParts.length
        : i;
      this.extractMeasurement = true;
      measurementMinLength++;
    });

    // Parse tags pattern
    const tagParts = config.tags.split("/");
    let tagInvert = false;
    let tagMinLength = 0;

    tagParts.forEach((part, i) => {
      if (part === "_" || part === "") {
        tagMinLength++;
        return;
      }

      if (part === "#") {
        tagInvert = true;
        return;
      }

      this.tagIndices[part] = tagInvert ? i - tagParts.length : i;
      tagMinLength++;
    });

    // Parse fields pattern if provided
    let fieldMinLength = 0;
    if (config.fields) {
      const fieldParts = config.fields.split("/");
      let fieldInvert = false;

      fieldParts.forEach((part, i) => {
        if (part === "_" || part === "") {
          fieldMinLength++;
          return;
        }

        if (part === "#") {
          fieldInvert = true;
          return;
        }

        this.fieldIndices[part] = fieldInvert ? i - fieldParts.length : i;
        fieldMinLength++;
      });
    }

    // Validate lengths
    if (!this.topicVarLength) {
      if (measurementMinLength !== topicMinLength && this.extractMeasurement) {
        throw new Error("Measurement length does not equal topic length");
      }

      if (fieldMinLength !== topicMinLength && config.fields) {
        throw new Error("Fields length does not equal topic length");
      }

      if (tagMinLength !== topicMinLength && config.tags) {
        throw new Error("Tags length does not equal topic length");
      }
    }

    this.topicMinLength = Math.max(
      topicMinLength,
      measurementMinLength,
      tagMinLength,
      fieldMinLength
    );
  }

  parse(topic: string): Metric | null {
    const metric: Metric = {
      name: "",
      tags: {},
      fields: {},
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
      metric.name = measurementValue;
    }

    // Extract tags
    for (const [key, i] of Object.entries(this.tagIndices)) {
      const actualIndex = i >= 0 ? i : topicParts.length + i;
      const tagValue = topicParts[actualIndex];
      if (!tagValue) {
        return null;
      }
      // Special handling for 'topic' tag - use the measurement name
      if (key === "topic" && this.extractMeasurement) {
        metric.tags[key] = metric.name;
      } else {
        metric.tags[key] = tagValue;
      }
    }

    // Extract fields
    for (const [key, i] of Object.entries(this.fieldIndices)) {
      const actualIndex = i >= 0 ? i : topicParts.length + i;
      const rawValue = topicParts[actualIndex];
      if (!rawValue) {
        return null;
      }
      const convertedValue = this.convertToFieldType(rawValue, key);
      if (convertedValue === null) {
        return null;
      }
      metric.fields[key] = convertedValue;
    }

    return metric;
  }

  private convertToFieldType(value: string, key: string): any {
    const desiredType = this.fieldTypes[key];
    if (!desiredType) {
      return value;
    }

    try {
      switch (desiredType) {
        case "uint":
          const uintValue = parseInt(value, 10);
          return !isNaN(uintValue) && uintValue >= 0 ? uintValue >>> 0 : null;
        case "int":
          const intValue = parseInt(value, 10);
          return !isNaN(intValue) ? intValue : null;
        case "float":
          const floatValue = parseFloat(value);
          return !isNaN(floatValue) ? floatValue : null;
        default:
          throw new Error(
            `Converting to type ${desiredType} is not supported: use int, uint, or float`
          );
      }
    } catch (error) {
      return null;
    }
  }
}
