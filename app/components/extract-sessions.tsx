// import { differenceInSeconds } from "date-fns";

// import { formatSecondsInHHMM } from "~/lib/utils";
// import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";
// import { DataTable } from "./data-table";
// import { ExportLoadingSessionsButton } from "./export-loadingsessions";
// import { LoadingButton } from "./ui/button";

// export function ExtractSessions({
//   instanceId,
//   className,
// }: {
//   instanceId: string;
//   className?: string;
// }) {
//   const extractSessionsMutation = loadingSessionApi.extractSessions.useMutation(
//     {},
//   );

//   return (
//     <div className={className}>
//       <LoadingButton
//         onClick={async () => {
//           await extractSessionsMutation.mutateAsync({ data: { instanceId } });
//         }}
//       >
//         extract sessions
//       </LoadingButton>
//       {extractSessionsMutation.data && (
//         <DataTable
//           data={extractSessionsMutation.data}
//           columns={[
//             { accessorKey: "start", header: "Start" },
//             { accessorKey: "end", header: "End" },
//             {
//               accessorFn: (row) => {
//                 const difference = differenceInSeconds(
//                   row.endTime,
//                   row.startTime,
//                 );

//                 return formatSecondsInHHMM(difference);
//               },
//               header: "Duration",
//             },
//             { accessorKey: "componentId", header: "Component" },
//           ]}
//         />
//       )}
//       {/* {extractSessionsMutation.data && (
//         <ExportLoadingSessionsButton data={extractSessionsMutation.data} />
//       )} */}
//     </div>
//   );
// }
