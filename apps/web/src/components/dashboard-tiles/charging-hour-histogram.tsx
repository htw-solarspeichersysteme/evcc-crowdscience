import { useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import uPlot, { type AlignedData, type Series } from "uplot";

import { getChartColor } from "~/constants";
import { cn } from "~/lib/utils";
import { instanceApi } from "~/serverHandlers/instance/serverFns";
import { DashboardGraph } from "../dashboard-graph";
import { ResponsiveUplot } from "../u-plot/responsive-uplot";
import { stack } from "../u-plot/stack";
import { tooltipPlugin, UPlotTooltip } from "../u-plot/tooltip-plugin";

export function ChargingHourHistogram({
  instanceIds,
  className,
  linkToInstanceOnClick = true,
  title,
  heightConfig,
}: {
  instanceIds: string[];
  className?: string;
  linkToInstanceOnClick?: boolean;
  title?: string;
  heightConfig?: {
    min: number;
    max: number;
  };
}) {
  const navigate = useNavigate();
  const { data } = instanceApi.getChargingHourHistogram.useSuspenseQuery({
    variables: { data: { instanceIds } },
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const plotInfo = useMemo(() => {
    const xValues = Array.from({ length: 24 }, (_, i) => i);
    return stack([xValues, ...Object.values(data ?? {})] satisfies AlignedData);
  }, [data]);

  return (
    <DashboardGraph
      title={title ?? "Charging Time Distribution (last 30 days)"}
      className={className}
    >
      <ResponsiveUplot
        heightConfig={heightConfig}
        className={cn(!data && "invisible")}
        supposedAspectRatio={16 / 9}
        data={plotInfo.data}
        options={{
          legend: {
            show: false,
          },
          focus: {
            alpha: 0.5,
          },
          cursor: {
            show: true,
            drag: {
              x: false,
              y: false,
            },
            focus: {
              prox: 1000,
              bias: 1,
            },
          },
          axes: [
            {
              show: true,
              size: 40,
              label: "Hour of the day",
            },
            {
              show: true,
              size: 40,
            },
          ],
          bands: plotInfo.bands,
          padding: [null, 0, 0, 0],
          scales: {
            x: {
              range: [0, 24],
              time: false,
            },
            y: {
              range: [0, null],
            },
          },
          plugins: [
            tooltipPlugin({
              tooltipRef,
              onclick: linkToInstanceOnClick
                ? (u, sidx) => {
                    void navigate({
                      to: "/dashboard/instances/$publicName",
                      params: {
                        publicName: u.series[sidx].label!,
                      },
                    });
                  }
                : undefined,
              formatTooltip(u, seriesIdx, dataIdx) {
                const timeFrame = `${u.data[0][dataIdx]}:00 - ${
                  u.data[0][dataIdx] + 1
                }:00`;

                let value = u.data[seriesIdx]?.[dataIdx] ?? 0;
                if (seriesIdx > 1) {
                  value -= u.data[seriesIdx - 1]?.[dataIdx] ?? 0;
                }

                return `${timeFrame} | ${value} charge event${
                  value === 1 ? "" : "s"
                } | ${u.series[seriesIdx].label}`;
              },
            }),
          ],
          series: [
            {
              label: "Time",
              value: (self, rawValue, seriesIdx, idx) => {
                if (idx === null) return "--";
                return `${rawValue}:00 - ${rawValue + 1}:00`;
              },
            },
            ...Object.entries(data ?? {}).map(
              ([instanceId], index) =>
                ({
                  paths: uPlot.paths.bars!({
                    align: 1,
                    gap: 0,
                    size: [1],
                  }),
                  stroke: getChartColor(index + 1).stroke,
                  fill: getChartColor(index + 1).fill,
                  points: {
                    show: false,
                  },
                  label: instanceId,
                }) satisfies Series,
            ),
          ],
        }}
      >
        <UPlotTooltip ref={tooltipRef} />
      </ResponsiveUplot>
    </DashboardGraph>
  );
}
