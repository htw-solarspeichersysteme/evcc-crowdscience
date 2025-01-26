import { useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import uPlot, { type AlignedData, type Series } from "uplot";

import { getChartColor } from "~/constants";
import type { UrlTimeRange } from "~/lib/globalSchemas";
import { instanceApi } from "~/serverHandlers/instance";
import { DashboardGraph } from "../dashboard-graph";
import { ResponsiveUplot } from "../u-plot/responsive-uplot";
import { stack } from "../u-plot/stack";
import { tooltipPlugin, UPlotTooltip } from "../u-plot/tooltip-plugin";

export function ChargingHourHistogram({
  instanceIds,
  className,
  timeRange,
  linkToInstanceOnClick = true,
}: {
  instanceIds: string[];
  className?: string;
  timeRange?: UrlTimeRange;
  linkToInstanceOnClick?: boolean;
}) {
  const navigate = useNavigate();
  const { data } = instanceApi.getChargingHourHistogram.useQuery({
    variables: { data: { instanceIds, timeRange } },
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const plotInfo = useMemo(() => {
    return stack([
      Array.from({ length: 24 }, (_, i) => i),
      ...Object.values(data ?? {}),
    ] satisfies AlignedData);
  }, [data]);

  return (
    <DashboardGraph title="Charge Event Distribution" className={className}>
      <ResponsiveUplot
        heightConfig={{
          min: 200,
          max: 400,
        }}
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
              label: "Hour of the day",
              labelSize: 30,
              labelFont: "30px var(--default-font)",
            },
            {
              show: true,
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
                      to: "/dashboard/instances/$instanceId",
                      params: {
                        instanceId: u.series[sidx].label!,
                      },
                    });
                  }
                : undefined,
              formatTooltip(u, seriesIdx, dataIdx) {
                const timeFrame = `${u.data[0][dataIdx]}:00 - ${
                  u.data[0][dataIdx] + 1
                }:00`;
                let value = u.data[seriesIdx][dataIdx] ?? 0;

                // remove the value from every series before at the same index
                for (let i = 1; i < seriesIdx; i++) {
                  value -= u.data[i][dataIdx] ?? 0;
                }

                return `${timeFrame} | ${value} charge events | ${u.series[seriesIdx].label}`;
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
                  stroke: getChartColor(index).stroke,
                  fill: getChartColor(index).fill,
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
