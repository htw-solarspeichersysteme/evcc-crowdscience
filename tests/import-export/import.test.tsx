import { beforeEach, describe, expect, jest, test } from "bun:test";
import { parseString } from "fast-csv";
import { z } from "zod";

import { createCsvFile } from "~/components/export-loadingsessions";

// import { importFile } from "~/routes/dashboard/import";

const data = [
  {
    start: new Date("2025-01-01T10:00:00Z"),
    end: new Date("2025-01-01T12:00:00Z"),
    componentId: "comp-123",
  },
  {
    start: new Date("2025-01-02T09:00:00Z"),
    end: new Date("2025-01-02T11:30:00Z"),
    componentId: "comp-456",
  },
];

const csvData = createCsvFile(data);

describe("Import Loadingsessions", () => {
  beforeEach(() => {
    console.log();
  });

  test("renders the import route component", async () => {
    const res = await csvToObjArray({
      csvFile: new File([csvData], "data.csv", { type: "text/csv" }),
    });
    const formattedRes = res.map((item) => ({
      start: item.startTime,
      end: item.endTime,
      componentId: item.loadpoint,
    }));
    const res2 = createCsvFile(formattedRes);
    console.log(res2);
    expect(res2).toEqual(csvData);
  });
});

test.todo("Test filtering of data");
test.todo("Test deduplication of data");

// really not optimal but i dont know how to test the import correctly
// without data storing and idk how to get the right input for importFile

const csvStringNumberSchema = z
  .string()
  .transform((value) => Number(value.replace(",", ".")));

const csvStringTimeSchema = z
  .string()
  .transform((value) => transformStringToTime(value));

const transformStringToTime = (value: string) => {
  // Use regex to extract hours, minutes, and seconds
  const regex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const match = regex.exec(value);

  if (!match) return 0; // Return 0 if the input format is incorrect

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const time = hours * 3600 + minutes * 60 + seconds;
  return time;
};

const csvRowSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  loadpoint: z.string(),
  vehicle: z.string(),
  kilometer: csvStringNumberSchema,
  startKwh: csvStringNumberSchema,
  endKwh: csvStringNumberSchema,
  energy: csvStringNumberSchema,
  duration: csvStringTimeSchema,
  sunPercentage: csvStringNumberSchema,
  price: csvStringNumberSchema,
  pricePerKwh: csvStringNumberSchema,
  co2PerKwh: csvStringNumberSchema,
});

const csvToObjArray = jest.fn(async (data: { csvFile: File }) => {
  const rows: z.infer<typeof csvRowSchema>[] = [];

  // read file into string
  const csvString: string = await data.csvFile.text();

  // create stream to parse csv string row by row
  const stream = parseString(csvString, {
    headers: [
      "startTime",
      "endTime",
      "loadpoint",
      "title",
      "vehicle",
      "kilometer",
      "startKwh",
      "endKwh",
      "energy",
      "duration",
      "sunPercentage",
      "price",
      "pricePerKwh",
      "co2PerKwh",
    ],
    delimiter: ";",
    renameHeaders: true,
  });

  // this means: on every new parsed row, run this function
  stream.on("data", (row) => {
    const parsedRow = csvRowSchema.safeParse(row);
    if (!parsedRow.success) {
      console.error(parsedRow.error);
      return;
    }
    rows.push(parsedRow.data);
  });
  await new Promise((resolve) => stream.on("end", resolve));
  return rows.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
});
