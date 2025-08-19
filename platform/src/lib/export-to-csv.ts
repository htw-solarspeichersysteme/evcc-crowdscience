import { format } from "date-fns";

export const getCsvBlob = (headers: string[], rows: string[][]): Blob => {
  let csvContent = "";
  const headerNames = headers;
  csvContent += headerNames.join(";") + "\n";

  const data = rows;
  data.forEach((row) => {
    csvContent += row.join(";") + "\n";
  });

  return new Blob([csvContent], { type: "text/csv" });
};

export const exportToCsv = (
  fileName = "data",
  headers: string[],
  rows: (string | Date)[][],
): void => {
  const formattedRows = rows.map((row) =>
    row.map((field) =>
      field instanceof Date ? format(field, "yyyy-MM-dd HH:mm:ss") : field,
    ),
  );
  const blob = getCsvBlob(headers, formattedRows);
  const link = document.createElement("a");
  const url = window.URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// const getRowsData = (rows: (string[][])): string[][] => {
//   return rows.map((row: Row<any>) => {
//     const cells = row.getAllCells();
//     const cellsContent = cells
//       .filter((x) => x.column.getIsVisible())
//       .map((x) => x.getValue() as string);
//     return cellsContent;
//   });
// };
