import type { InferSelectModel } from "drizzle-orm";

import type { extractedLoadingSessions } from "~/db/schema";
import { exportToCsv } from "../lib/import-export/exportToCsv";
import { Button } from "./ui/button";

export function ExportLoadingSessionsButton({
  data,
}: {
  data: InferSelectModel<typeof extractedLoadingSessions>[];
}) {
  const handleExportToCsv = () => {
    const headers = ["start", "end", "componentId", "duration", "instanceId"];
    const rows: (string | Date)[][] = data.map((row) => {
      return [
        row.startTime,
        row.endTime,
        row.componentId,
        row.duration.toString(),
        row.instanceId,
      ];
    });
    exportToCsv("loading_sessions", headers, rows);
    console.log(headers, rows);
  };

  return <Button onClick={handleExportToCsv}>Export</Button>;
}

// const data: ExtractSessionData[] = [
//   {
//     startTime: "2024-11-30T15:09:49.000Z",
//     endTime: "2024-12-16T11:19:27.000Z",
//     loadpoint: "2",
//     vehicle: "vehicle_2",
//     kilometer: 0,
//     startKwh: 0,
//     endKwh: 0,
//     energy: 0.795,
//     duration: 612101,
//     sunPercentage: 99.961,
//     price: 0.064,
//     pricePerKwh: 0.08,
//     co2PerKwh: 0.061,
//     instanceId: "lukas",
//     lineHash: "6799902723892201719",
//   },
//   {
//     startTime: "2024-11-30T15:09:40.000Z",
//     endTime: "2024-12-14T11:21:42.000Z",
//     loadpoint: "1",
//     vehicle: "vehicle_1",
//     kilometer: 0,
//     startKwh: 0,
//     endKwh: 0,
//     energy: 0.497,
//     duration: 598781,
//     sunPercentage: 100,
//     price: 0.04,
//     pricePerKwh: 0.08,
//     co2PerKwh: 0,
//     instanceId: "lukas",
//     lineHash: "7778558060353165417",
//   },
//   {
//     startTime: "2024-11-24T16:24:14.000Z",
//     endTime: "2024-11-30T15:09:11.000Z",
//     loadpoint: "2",
//     vehicle: "vehicle_2",
//     kilometer: 0,
//     startKwh: 0,
//     endKwh: 0,
//     energy: 13.489,
//     duration: 260227,
//     sunPercentage: 99.964,
//     price: 1.08,
//     pricePerKwh: 0.08,
//     co2PerKwh: 0.048,
//     instanceId: "lukas",
//     lineHash: "6057666538494477844",
//   },
// ];
