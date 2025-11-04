import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import uPlot, { type AlignedData } from "uplot";

import { getChartColor } from "~/constants";
import type { UrlTimeRange } from "~/lib/globalSchemas";
import { cn, histogram } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import { DashboardGraph } from "../dashboard-graph";
import { ResponsiveUplot } from "../u-plot/responsive-uplot";

export function StartSocHistogram({
  instanceIds,
  className,
  title,
  heightConfig,
}: {
  instanceIds?: string[];
  className?: string;
  timeRange?: UrlTimeRange;
  title?: string;
  heightConfig?: {
    min: number;
    max: number;
  };
}) {
  const { data } = useSuspenseQuery(
    orpc.loadingSessions.getExtractedSessions.queryOptions({
      input: { instanceIds },
      select: (data) =>
        data
          .filter(
            (session) => differenceInDays(new Date(), session.startTime) < 30,
          )
          .map((session) => session.startSoc)
          .filter((soc) => soc !== null),
    }),
  );

  const plotData = useMemo(() => {
    const histogramData = histogram({
      data: data ?? [],
      range: [0, 100],
      binSize: 1,
    });
    return [
      Array.from({ length: 100 }, (_, i) => i),
      histogramData,
    ] satisfies AlignedData;
  }, [data]);

  return (
    <DashboardGraph
      title={title ?? "Start SOC Distribution (last 30 days)"}
      className={cn("min-h-[300px]", className)}
    >
      <ResponsiveUplot
        heightConfig={heightConfig}
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
