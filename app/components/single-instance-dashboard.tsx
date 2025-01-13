import { useParams, useSearch } from "@tanstack/react-router";

import { siteApi } from "~/serverHandlers/site";
import { ExpandableDashboardGraph } from "./dashboard-graph";
import { DataTable } from "./data-table";
import { ExtractSessions } from "./extract-sessions";
import { InstanceTimeSeriesViewer } from "./instance-time-series-viewer";

export function SingleInstanceDashboard({
  publicView,
}: {
  publicView: boolean;
}) {
  const from = publicView
    ? "/_public/view-data/$instanceId"
    : "/dashboard/instances/$instanceId";

  const { timeSeriesMetric } = useSearch({ from });
  const { instanceId } = useParams({ from });

  const siteMetaData = siteApi.getSiteMetaData.useSuspenseQuery({
    variables: { data: { instanceId } },
  });

  if (!Object.keys(siteMetaData.data ?? {}).length) {
    return (
      <div>
        {publicView
          ? "Für diese Instanz wurden noch keine Daten empfangen"
          : "There is no data for this instance yet"}
      </div>
    );
  }

  return (
    <div className="md:grid-cols-4 grid md:gap-4 xl:grid-cols-12 xl:gap-4 gap-2">
      <InstanceTimeSeriesViewer
        className="col-span-3 lg:col-span-full xl:col-span-6"
        instanceId={instanceId}
        timeSeriesMetric={timeSeriesMetric}
      />
      <ExpandableDashboardGraph
        title="Metadata"
        className="col-span-3"
        expandKey="metadata"
        mainContent={<div>version: {siteMetaData.data?.version?.value}</div>}
        expandContent={
          <DataTable
            data={
              siteMetaData.data
                ? Object.entries(siteMetaData.data).map(([key, value]) => ({
                    field: key,
                    value: value?.value,
                    lastUpdate: value?.lastUpdate,
                  }))
                : []
            }
            columns={[
              {
                accessorKey: "field",
                header: "Field",
              },
              {
                accessorKey: "value",
                header: "Value",
              },
            ]}
          />
        }
      />
      {!publicView && (
        <ExtractSessions
          instanceId={instanceId}
          className="flex flex-col gap-2 md:gap-4 lg:col-span-full col-span-3"
        />
      )}
    </div>
  );
}
