"use-client";

import React from "react";
import { writeToString } from "fast-csv";

import { Button } from "./ui/button";

export function ExportLoadingsessions() {
  // create a csv file that i can download in the browser
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

  createCsvFile(data);

  return (
    <div>
      <Button onClick={() => createCsvFile(data)}>Export</Button>
    </div>
  );
}

// maybe schould be async
const createCsvFile = (
  data: Array<{ start: Date; end: Date; componentId: string }>,
) => {
  try {
    // Map the data to ensure proper formatting
    //   const formattedData = data.map((entry) => ({
    //     start: entry.start.toISOString(), // Convert Date to ISO string
    //     end: entry.end.toISOString(),
    //     componentId: entry.componentId,
    //   }));

    // Generate the CSV string
    // const filePath = "./output.csv";

    writeToString(data, { headers: true, delimiter: ";" })
      .then((csvString) => {
        console.log(csvString);
      })
      .catch((error) => {
        console.error("Error generating CSV string", error);
      });
  } catch (error) {
    console.error("Error exporting CSV", error);
  }
};
