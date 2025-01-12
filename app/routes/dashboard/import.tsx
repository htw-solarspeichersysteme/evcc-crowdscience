import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { differenceInMinutes, differenceInSeconds, formatDate } from "date-fns";
import { eq } from "drizzle-orm";
import { parseString } from "fast-csv";
import { z } from "zod";

import { DataTable } from "~/components/data-table";
import { LoadingButton } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { sqliteDb } from "~/db/client";
import { csvImportLoadingSessions } from "~/db/schema";
import { formatSecondsInHHMM } from "~/lib/utils";
import { getLoadPointMetaData } from "~/serverHandlers/loadpoint";
import { getVehicleMetaData } from "~/serverHandlers/vehicle";

export const Route = createFileRoute("/dashboard/import")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Import",
  },
});

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

    /**
     * the syntax may seem unusual, but this creates a promise
     * that resolves when the stream ends.
     * this is required to block execution until every row of the csv
     * has been read. if we don't await it, the array "rows" will not
     * contain every row that is in the csv.
     */
    await new Promise((resolve) => stream.on("end", resolve));

    /**
     * @Pichi11 TODO:
     * [x] add rows to db (table: csvImportLoadingSessions)
     * [x] attach instanceId to row
     * [x] change loadpont name to id (same with vehicle)
     *    [x] query InfluxDB loadpoints table for loadpoint id
     * [] check for duplicates (maybe calculate hash of row, that gets set as id)
     * [] change the dates in the correct time zone (maybe the already are, i don't know)
     * [] verify data looks correct with drizzle kit studio (bun db:studio)
     */

    const instanceId = String(data.instanceId);

    const loadPointMetaData = await getLoadPointMetaData({
      data: { instanceId },
    });

    const vehicleMetaData = await getVehicleMetaData({
      data: { instanceId },
    });

    const findComponentIdByTitle = (title: string) => {
      return Object.entries(loadPointMetaData).find(
        ([_, data]) => data.title.value === title,
      )?.[0];
    };

    const findVehicleIdByTitle = (title: string) => {
      return Object.entries(vehicleMetaData).find(
        ([_, data]) => data.title.value === title,
      )?.[0];
    };

    const existingDataWithInstance_IDInDb =
      await sqliteDb.query.csvImportLoadingSessions.findFirst({
        where: eq(csvImportLoadingSessions.instanceId, instanceId),
      });

    const rowsWithEverything = rows.map((row) => ({
      ...row,
      instanceId: instanceId,
      ...(existingDataWithInstance_IDInDb
        ? {
            loadpoint: findComponentIdByTitle(row.loadpoint),
            vehicle: findVehicleIdByTitle(row.vehicle),
          }
        : {}),
    }));

    await sqliteDb.insert(csvImportLoadingSessions).values(rowsWithEverything);
    return rowsWithEverything.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
  });

function RouteComponent() {
  const importFileMutation = useMutation({
    mutationFn: importFile,
    onSuccess: console.log,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    importFileMutation.mutate({ data: formData });
  };

  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input type="file" name="csvFile" accept=".csv" required />
        <Input
          type="text"
          name="instanceId"
          placeholder="Instance ID"
          required
        />
        <LoadingButton
          type="submit"
          className="ml-auto"
          loading={importFileMutation.isPending}
        >
          Import
        </LoadingButton>
      </form>
      {importFileMutation.data && (
        <DataTable
          columns={[
            {
              accessorKey: "instanceId",
              header: "Instance ID",
            },
            {
              accessorKey: "loadpoint",
              header: "Loadpoint",
            },
            {
              accessorKey: "vehicle",
              header: "Vehicle",
            },
            {
              accessorKey: "kilometer",
              header: "Kilometer",
            },
            {
              accessorKey: "startKwh",
              header: "Start KWh",
            },
            {
              accessorKey: "endKwh",
              header: "End KWh",
            },
            {
              accessorKey: "energy",
              header: "Energy",
            },
            {
              accessorFn: (row) => {
                const difference = differenceInSeconds(
                  row.endTime,
                  row.startTime,
                );

                return formatSecondsInHHMM(difference);
              },
              header: "Total Duration",
            },
            {
              accessorFn: (row) => formatSecondsInHHMM(row.duration),
              header: "Charging Duration",
            },
            {
              accessorFn: (row) =>
                formatDate(row.startTime, "dd MMM yyyy HH:mm:ss"),
              header: "Start Time",
            },
            {
              accessorFn: (row) =>
                formatDate(row.endTime, "dd MMM yyyy HH:mm:ss"),
              header: "End Time",
            },
          ]}
          data={importFileMutation.data}
        />
      )}
    </div>
  );
}
