import * as z from "zod";

export type InfluxValue = {
  value: string | number | boolean;
  lastUpdate: Date;
};
export type InfluxFieldValues = Record<string, InfluxValue>;
export type MetaData = {
  count: number;
  values: Record<string, InfluxFieldValues>;
};

// Base schema for common InfluxDB row fields
export const influxRowBaseSchema = z.object({
  _field: z.string(),
  _value: z.union([z.string(), z.number(), z.boolean()]),
  _time: z.string().transform((v) => new Date(v)),
});
