import type { z } from "zod";

import { influxDb } from "~/db/client";

/**
 * Escapes a string value for safe use in Flux string literals.
 * Prevents injection attacks by properly escaping special characters.
 */
function escapeFluxString(value: string): string {
  // Escape backslashes first, then double quotes
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Checks if a string is a Flux duration literal (e.g., "5m", "-30d", "1h")
 */
function isFluxDuration(value: string): boolean {
  // Match patterns like: -30d, 5m, 1h, 2s, etc.
  return /^-?\d+[smhd]$/i.test(value);
}

/**
 * Formats a value for safe insertion into a Flux query.
 */
function formatFluxValue(
  value: string | number | Date | boolean | null | undefined,
): string {
  if (value === null || value === undefined) {
    throw new Error("Cannot format null/undefined value for Flux query");
  }

  if (value instanceof Date) {
    // Dates in Flux range() should be ISO strings without quotes
    return value.toISOString();
  }

  if (typeof value === "string") {
    // Duration literals (like "5m", "-30d") should not be quoted
    if (isFluxDuration(value)) {
      return value;
    }
    // Regular string values need to be quoted and escaped
    return `"${escapeFluxString(value)}"`;
  }

  if (typeof value === "boolean") {
    // Booleans in Flux are lowercase
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    // Numbers can be used directly (but validate they're not NaN/Infinity)
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid number value: ${value}`);
    }
    return String(value);
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}

type ExtractPlaceholders<T extends string> =
  T extends `${string}{{${infer P}}}${infer Rest}`
    ? P | ExtractPlaceholders<Rest>
    : never;

type ParamsFromTemplate<T extends string> = Record<
  ExtractPlaceholders<T>,
  string | number | Date | boolean
>;

/**
 * Safely builds a Flux query by replacing placeholders with properly escaped values.
 * Use this instead of direct string interpolation for user-provided values.
 *
 * Placeholders in the query should use the format: {{paramName}}
 *
 * @example
 * ```ts
 * const query = buildFluxQuery(
 *   `from(bucket: {{bucket}})
 *     |> range(start: {{start}}, stop: {{stop}})
 *     |> filter(fn: (r) => r["instance"] == {{instanceId}})`,
 *   {
 *     bucket: env.INFLUXDB_BUCKET,
 *     start: new Date("2023-01-01"),
 *     stop: new Date("2023-01-02"),
 *     instanceId: userInput
 *   }
 * );
 * ```
 */
export function buildFluxQuery<T extends string>(
  queryTemplate: T,
  params: ParamsFromTemplate<T>,
): string {
  // Your existing implementation stays the same
  let query: string = queryTemplate;

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      throw new Error(`Parameter "${key}" is null or undefined.`);
    }
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    query = query.replace(
      placeholder,
      formatFluxValue(value as string | number | Date | boolean),
    );
  }

  return query;
}

/**
 * Checks if an error is an InfluxDB-related error.
 */
export function isInfluxDBError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("InfluxDB") ||
      error.message.includes("error calling function") ||
      error.message.includes("expected duration") ||
      error.message.includes("value is not a time") ||
      error.name === "HttpError" ||
      (error as { statusCode?: number }).statusCode === 400)
  );
}

/**
 * Executes a Flux query against InfluxDB, validates rows against a schema,
 * and collects the results.
 *
 * - Validates each row against the provided Zod schema.
 * - Logs validation errors and skips invalid rows.
 * - Throws an error if the query execution fails (propagating the error up).
 *
 * @param query The Flux query string to execute.
 * @param rowSchema The Zod schema to validate each row.
 * @param onRow Optional callback to process each valid row.
 * @returns A promise that resolves to an array of validated rows.
 */
export async function queryInflux<T extends z.ZodTypeAny>(
  query: string,
  rowSchema: T,
  onRow?: (row: z.infer<T>) => void,
): Promise<z.infer<T>[]> {
  const results: z.infer<T>[] = [];

  try {
    for await (const { values, tableMeta } of influxDb.iterateRows(query)) {
      const rawRow = tableMeta.toObject(values);
      const parsedRow = rowSchema.safeParse(rawRow);

      if (!parsedRow.success) {
        console.error("InfluxDB Row Validation Error:", parsedRow.error);
        continue;
      }

      const row = parsedRow.data;
      results.push(row);

      if (onRow) {
        onRow(row);
      }
    }
  } catch (error) {
    console.error("InfluxDB query error:", error);
    throw error; // Re-throw to let the caller/middleware handle it
  }

  return results;
}
