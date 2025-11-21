import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, type MakeRouteMatch } from "@tanstack/react-router";

import { StateTimelineChart } from "~/components/charts/state-timeline-chart";
import { InstanceTimeSeriesEcharts } from "~/components/charts/time-series-chart";
import { MetadataGraph } from "~/components/dashboard-graph";
import { BatteryInfo } from "~/components/dashboard-tiles/battery-info";
import { ChargingHourHistogram } from "~/components/dashboard-tiles/charging-hour-histogram";
import { ExtractedSessions } from "~/components/dashboard-tiles/extracted-sessions-overview";
import { ImportedSessions } from "~/components/dashboard-tiles/imported-sessions-overview";
import { InstanceOverview } from "~/components/dashboard-tiles/instance-overview";
import { StartSocHistogram } from "~/components/dashboard-tiles/start-soc-histogram";
import { LoadingButton } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import { singleInstanceRouteSearchSchema } from "~/lib/globalSchemas";
import { formatCount, formatUnit } from "~/lib/utils";
import { ensureDefaultChartTopicField } from "~/middleware/searchValidationHelpers";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/dashboard/instances/$instanceId")({
  component: RouteComponent,
  validateSearch: singleInstanceRouteSearchSchema,
  beforeLoad: async ({ params, context, search }) => {
    // load instance data
    const instance = await context.queryClient.ensureQueryData(
      orpc.instances.getById.queryOptions({
        input: { id: params.instanceId },
      }),
    );

    ensureDefaultChartTopicField(search.chartTopic, search.chartTopicField);

    return { instance };
  },
  loader: async ({ context }) => {
    const { instance } = context;
    const instanceId = instance.id;
    const queryOptions = [
      orpc.loadpoints.getMetaData.queryOptions({ input: { instanceId } }),
      orpc.pv.getMetaData.queryOptions({ input: { instanceId } }),
      orpc.sites.getStatistics.queryOptions({ input: { instanceId } }),
      orpc.loadingSessions.getExtractedSessions.queryOptions({
        input: { instanceIds: [instanceId] },
      }),
      orpc.loadingSessions.getImportedSessions.queryOptions({
        input: { instanceIds: [instanceId] },
      }),
      orpc.chargingStats.getChargingHourHistogram.queryOptions({
        input: { instanceIds: [instanceId] },
      }),
      orpc.sites.getMetaDataValues.queryOptions({ input: { instanceId } }),
      orpc.vehicles.getMetaData.queryOptions({ input: { instanceId } }),
      orpc.batteries.getMetaData.queryOptions({ input: { instanceId } }),
    ];

    await Promise.allSettled(
      queryOptions.map((queryOption) =>
        // @ts-ignore
        context.queryClient.ensureQueryData(queryOption),
      ),
    );
  },
  staticData: {
    routeTitle: (r: MakeRouteMatch<typeof Route>) => {
      return `${r.context.instance?.publicName ?? "Instance not found"}`;
    },
  },
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { instanceId } = Route.useParams();
  const queryClient = useQueryClient();
  const { timeRange } = useTimeSeriesSettings();

  const instance = useSuspenseQuery(
    orpc.instances.getById.queryOptions({ input: { id: instanceId } }),
  );

  const siteMetaData = useSuspenseQuery(
    orpc.sites.getMetaDataValues.queryOptions({ input: { instanceId } }),
  );
  const vehicleMetaData = useSuspenseQuery(
    orpc.vehicles.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const loadPointMetaData = useSuspenseQuery(
    orpc.loadpoints.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const pvMetaData = useSuspenseQuery(
    orpc.pv.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const batteryMetaData = useSuspenseQuery(
    orpc.batteries.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const statistics = useSuspenseQuery(
    orpc.sites.getStatistics.queryOptions({ input: { instanceId } }),
  );

  const setIgnored = useMutation(
    orpc.instances.setIgnored.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.instances.getById.queryKey({
            input: { id: instanceId },
          }),
        });

        void queryClient.invalidateQueries({
          queryKey: orpc.instances.getOverview.queryKey({
            input: { showIgnored: search.showIgnored },
          }),
        });
      },
    }),
  );

  const importedSessions = useQuery(
    orpc.loadingSessions.getImportedSessions.queryOptions({
      input: { instanceIds: [instanceId] },
    }),
  );

  const gaps = useQuery(
    orpc.instances.getGaps.queryOptions({
      input: {
        instanceId,
        timeRange: { start: timeRange.start, end: timeRange.end },
      },
    }),
  );

  return (
    <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 lg:grid-cols-8 xl:grid-cols-12">
      <StateTimelineChart
        timeRange={timeRange}
        gaps={gaps.data}
        className="col-span-2 h-[10px] overflow-hidden rounded-md border shadow-xs md:col-span-4 md:h-[20px] lg:col-span-8 xl:col-span-12"
      />
      <InstanceOverview
        className="col-span-2 md:col-span-4 lg:col-span-8 xl:col-span-12"
        instanceId={instanceId}
      />
      <InstanceTimeSeriesEcharts
        className="col-span-2 md:col-span-4 lg:col-span-8 lg:row-span-4"
        instanceId={instanceId}
        chartTopic={search.chartTopic}
        chartTopicField={search.chartTopicField}
        handleChartTopicChange={(chartTopic, chartTopicField) =>
          navigate({
            replace: true,
            search: (prev) => ({ ...prev, chartTopic, chartTopicField }),
          })
        }
        importedSessions={importedSessions.data}
        gaps={gaps.data}
      />

      <StartSocHistogram
        title="Start SOC Distribution (last 30 days)"
        className="col-span-2 lg:col-span-4 lg:row-span-2"
        instanceIds={[instanceId]}
      />
      <ChargingHourHistogram
        instanceIds={[instanceId]}
        className="col-span-2 lg:col-span-4 lg:row-span-2"
        linkToInstanceOnClick={false}
      />
      <MetadataGraph
        title="Site Metadata"
        expandKey="site-metadata"
        mainContent={<div>{siteMetaData.data?.siteTitle?.value}</div>}
        metaData={{
          count: 1,
          values: { "Instance Site": siteMetaData.data },
        }}
        className="col-span-2"
      />
      <BatteryInfo
        batteryMetaData={batteryMetaData.data}
        className="col-span-2"
      />
      <MetadataGraph
        title="Loadpoint Metadata"
        expandKey="loadpoints-metadata"
        mainContent={
          <div>
            {formatCount(
              loadPointMetaData.data.count,
              "Loadpoint",
              "Loadpoints",
            )}
          </div>
        }
        metaData={loadPointMetaData.data}
        className="col-span-2"
      />
      <MetadataGraph
        title="Vehicle Metadata"
        expandKey="vehicle-metadata"
        mainContent={
          <div>
            {formatCount(vehicleMetaData.data.count, "Vehicle", "Vehicles")}
          </div>
        }
        metaData={vehicleMetaData.data}
        className="col-span-2"
      />
      <MetadataGraph
        title="PV Metadata"
        expandKey="pv-metadata"
        mainContent={
          <div>{formatCount(pvMetaData.data.count, "PV", "PVs")}</div>
        }
        metaData={pvMetaData.data}
        className="col-span-2"
      />

      <MetadataGraph
        title="Statistics"
        expandKey="statistics"
        mainContent={
          <div>
            {formatUnit(
              statistics.data.values["30d"]?.chargedKWh?.value as number,
              "kWh",
            )}{" "}
            Usage{" "}
            <span className="text-sm text-muted-foreground">
              (last 30 days)
            </span>
          </div>
        }
        metaData={statistics.data}
        className="col-span-2"
      />
      <ExtractedSessions instanceId={instanceId} className="col-span-2" />
      <ImportedSessions instanceId={instanceId} className="col-span-2" />
      <Card className="col-span-2">
        <CardContent className="p-4">
          <LoadingButton
            className="w-full"
            loading={setIgnored.isPending}
            variant={instance.data.ignored ? "default" : "destructive"}
            onClick={() => {
              setIgnored.mutate({
                instanceId,
                ignored: !instance.data.ignored,
              });
            }}
          >
            {instance.data.ignored ? "Unignore" : "Ignore"}
          </LoadingButton>
        </CardContent>
      </Card>
    </div>
  );
}
