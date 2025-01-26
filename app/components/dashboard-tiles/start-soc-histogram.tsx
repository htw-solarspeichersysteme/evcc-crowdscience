import { useMemo } from "react";
import uPlot, { type AlignedData } from "uplot";

import { getChartColor } from "~/constants";
import type { UrlTimeRange } from "~/lib/globalSchemas";
import { cn, histogram } from "~/lib/utils";
import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";
import { DashboardGraph } from "../dashboard-graph";
import { ResponsiveUplot } from "../u-plot/responsive-uplot";

export function StartSocHistogram({
  instanceIds,
  className,
  timeRange,
  title,
}: {
  instanceIds?: string[];
  className?: string;
  timeRange?: UrlTimeRange;
  title?: string;
}) {
  const { data } = loadingSessionApi.getExtractedSessions.useQuery({
    variables: { data: { instanceIds, timeRange } },
  });

  const plotData = useMemo(() => {
    const histogramData = histogram({
      data: Object.values(data ?? {})
        .map((session) => session.startSoc)
        .filter((soc) => soc !== null),
      range: [0, 100],
      binSize: 1,
    });
    console.log(histogramData);
    return [
      Array.from({ length: 100 }, (_, i) => i),
      histogramData,
    ] satisfies AlignedData;
  }, [data]);

  return (
    <DashboardGraph
      title={title ?? "Charge Event Distribution"}
      className={className}
    >
      <ResponsiveUplot
        heightConfig={{
          min: 200,
          max: 300,
        }}
        className={cn(!data && "invisible", "-ml-3")}
        supposedAspectRatio={16 / 9}
        data={plotData}
        options={{
          cursor: {
            show: true,
            drag: {
              x: false,
              y: false,
            },
          },
          axes: [
            {
              show: true,
              size: 40,
              label: "SOC when charging started",
            },
            {
              show: true,
              size: 40,
              label: "Number of events",
            },
          ],
          padding: [null, 0, 0, 0],
          scales: {
            x: {
              range: [0, 100],
              time: false,
            },
            y: {
              range: [0, null],
            },
          },

          series: [
            {
              label: "SOC",
              value: (self, rawValue, seriesIdx, idx) => {
                if (idx === null) return "--";
                return `${rawValue}%`;
              },
            },
            {
              paths: uPlot.paths.bars!({
                align: 1,
                gap: 0,
                size: [1],
              }),
              label: "Number of events",
              fill: getChartColor(5).fill,
              stroke: getChartColor(5).stroke,
              points: {
                show: false,
              },
            },
          ],
        }}
      />
    </DashboardGraph>
  );
}
