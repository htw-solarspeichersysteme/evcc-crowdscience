import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { parseString } from "fast-csv";
import { z } from "zod";

import { LoadingButton } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export const Route = createFileRoute("/dashboard/import")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Import",
  },
});

const csvStringNumberSchema = z
  .string()
  .transform((value) => Number(value.replace(",", ".")));

const csvRowSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string(),
  vehicle: z.string(),
  kilometer: csvStringNumberSchema,
  startKwh: csvStringNumberSchema,
  endKwh: csvStringNumberSchema,
  energy: csvStringNumberSchema,
  sunPercentage: csvStringNumberSchema,
  price: csvStringNumberSchema,
  pricePerKwh: csvStringNumberSchema,
  co2PerKwh: csvStringNumberSchema,
});

const importFile = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const csvFile = data.get("csvFile");
    const instanceId = data.get("instanceId");

    if (!csvFile || !(csvFile instanceof File)) {
      throw new Error("File is required");
    }

    if (!instanceId) {
      throw new Error("Instance ID is required");
    }
    return { csvFile, instanceId };
  })
  .handler(async ({ data }) => {
    const rows: z.infer<typeof csvRowSchema>[] = [];

    // read file into string
    const csvString = await data.csvFile.text();

    // create stream to parse csv string row by row
    const stream = parseString(csvString, {
      headers: [
        "startTime",
        "endTime",
        "location",
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

    /**
     * the syntax may seem unusual, but this creates a promise
     * that resolves when the stream ends.
     * this is required to block execution until every row of the csv
     * has been read. if we don't await it, the array "rows" will not
     * contain every row that is in the csv.
     */
    await new Promise((resolve) => stream.on("end", resolve));

    /**
     * @Pichi11 TODO: add rows to db (table: csvImportLoadingSessions)
     * - check for duplicates (maybe calculate hash of row, that gets set as id)
     * - attach instanceId to row
     * - change the dates in the correct time zone (maybe the already are, i don't know)
     * - verify data looks correct with drizzle kit studio (bun db:studio)
     */

    return rows;
  });

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const res = await importFile({ data: formData });
    setIsLoading(false);
    console.log(res);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Input type="file" name="csvFile" accept=".csv" required />
      <Input type="text" name="instanceId" placeholder="Instance ID" required />
      <LoadingButton type="submit" className="ml-auto" loading={isLoading}>
        Import
      </LoadingButton>
    </form>
  );
}
