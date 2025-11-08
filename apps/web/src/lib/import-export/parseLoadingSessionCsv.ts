import { parseString } from "fast-csv";
import z from "zod";

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

const csvStringNumberSchema = z
  .string()
  .transform((value) => Number(value.replace(",", ".")));

const csvStringTimeSchema = z
  .string()
  .transform((value) => transformStringToTime(value));

const csvRowSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  loadpoint: z.string(),
  vehicle: z.string(),
  kilometers: csvStringNumberSchema,
  startKwh: csvStringNumberSchema,
  endKwh: csvStringNumberSchema,
  energy: csvStringNumberSchema,
  duration: csvStringTimeSchema,
  sunPercentage: csvStringNumberSchema,
  price: csvStringNumberSchema,
  pricePerKwh: csvStringNumberSchema,
  co2PerKwh: csvStringNumberSchema,
});

export async function parseLoadingSessionCsv(csvText: string) {
  const rows: z.infer<typeof csvRowSchema>[] = [];
  const stream = parseString(csvText, {
    headers: [
      "startTime",
      "endTime",
      "loadpoint",
      "title",
      "vehicle",
      "kilometers",
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

  stream.on("data", (row) => {
    const parsedRow = csvRowSchema.safeParse(row);
    if (!parsedRow.success) {
      console.error(parsedRow.error);
      return;
    }
    rows.push(parsedRow.data);
  });
  await new Promise((resolve) => stream.on("end", resolve));
  return rows;
}
