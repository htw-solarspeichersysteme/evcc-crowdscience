import ky from "ky";
import type { StorageValue } from "unstorage";

import type { Metric } from "~/lib/topic-parser";

class InfluxWriter {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly org: string,
    private readonly bucket: string,
  ) {}

  async write(
    lineProtocol: string,
    precision: "ns" | "us" | "ms" | "s" | "m" | "h" = "s",
  ) {
    return await ky
      .post(`${this.baseUrl}/api/v2/write`, {
        searchParams: {
          org: this.org,
          bucket: this.bucket,
          precision,
        },
        headers: {
          Authorization: `Token ${this.token}`,
          "Content-Type": "text/plain; charset=utf-8",
          Accept: "application/json",
        },
        body: lineProtocol,
        retry: 1,
      })
      .json();
  }

  async delete(start: string, stop: string) {
    return await ky
      .post(`${this.baseUrl}/api/v2/delete`, {
        searchParams: {
          org: this.org,
          bucket: this.bucket,
        },
        json: {
          start,
          stop,
        },

        headers: {
          Authorization: `Token ${this.token}`,
        },
      })
      .json();
  }
}

export function toLineProtocol({
  metric,
  value,
  instanceId,
  timestamp,
}: {
  metric: Metric;
  value?: StorageValue;
  instanceId: string;
  timestamp: string;
}) {
  let line = `${metric.measurement},instance=${instanceId}`;
  const field = metric.field;

  for (const [key, value] of Object.entries(metric.tags)) {
    if (key === "field" || key === "value") {
      continue;
    }
    line += `,${key}=${value}`;
  }

  if (field) {
    const valueString =
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      typeof value === "string" ? `"${value}"` : value?.toString();
    line += ` ${field}=${valueString}`;
  }

  line += ` ${timestamp}`;

  return line;
}

export const influxWriter = new InfluxWriter(
  Bun.env.INFLUXDB_URL!,
  Bun.env.INFLUXDB_TOKEN!,
  Bun.env.INFLUXDB_ORG!,
  Bun.env.INFLUXDB_BUCKET!,
);
