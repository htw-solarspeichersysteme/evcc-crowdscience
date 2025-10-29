import { Link, useNavigate } from "@tanstack/react-router";
import { addHours, subHours } from "date-fns";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  RefreshCcwIcon,
} from "lucide-react";

import { getTimeRangeDefaults } from "~/constants";
import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import type { UrlTimeRange } from "~/lib/globalSchemas";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { Combobox } from "./ui/combo-box";
import { DateRangePicker } from "./ui/date-range-picker";

function getChangedTimeRange(
  timeRange: UrlTimeRange,
  hours: number,
  direction: "left" | "right",
) {
  const changeFn = direction === "left" ? subHours : addHours;

  const timeRangeDefaults = getTimeRangeDefaults();

  const start = timeRange?.start ?? timeRangeDefaults.start;
  const end = timeRange?.end ?? timeRangeDefaults.end;
  const windowMinutes =
    timeRange?.windowMinutes ?? timeRangeDefaults.windowMinutes;

  return {
    start: changeFn(start, hours).getTime(),
    end: changeFn(end, hours).getTime(),
    windowMinutes,
  };
}

export function TimeSeriesSettingsPicker({
  className,
}: {
  className?: string;
}) {
  const { timeRange } = useTimeSeriesSettings();
  const navigate = useNavigate();

  const timeRangeDefaults = getTimeRangeDefaults();

  function navigateToTimeRange(timeRange: Partial<UrlTimeRange>) {
    void navigate({
      to: ".",
      replace: true,
      search: (prev) => ({
        ...prev,
        timeRange: { ...prev.timeRange, ...timeRange },
      }),
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DateRangePicker
        key={`${timeRange?.start}-${timeRange?.end}`}
        initialDateFrom={
          timeRange?.start
            ? new Date(timeRange.start)
            : new Date(timeRangeDefaults.start)
        }
        initialDateTo={
          timeRange?.end
            ? new Date(timeRange.end)
            : new Date(timeRangeDefaults.end)
        }
        onUpdate={(values) => {
          navigateToTimeRange({
            start: values.range.from?.getTime(),
            end: values.range.to?.getTime(),
          });
        }}
      />
      <Combobox
        className="w-[240px]"
        title="granularity:"
        options={[
          { label: "5 minutes", value: "5" },
          { label: "10 minutes", value: "10" },
          { label: "30 minutes", value: "30" },
          { label: "1 hour", value: "60" },
          { label: "6 hours", value: "360" },
          { label: "12 hours", value: "720" },
          { label: "1 day", value: "1440" },
        ]}
        icon={<ClockIcon />}
        value={(
          timeRange?.windowMinutes ?? timeRangeDefaults.windowMinutes
        ).toString()}
        onChange={(value) =>
          navigateToTimeRange({ windowMinutes: parseInt(value) })
        }
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            navigateToTimeRange(getChangedTimeRange(timeRange!, 8, "left"))
          }
        >
          <ArrowLeftIcon />
          -8h
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            navigateToTimeRange(getChangedTimeRange(timeRange!, 8, "right"))
          }
        >
          +8h
          <ArrowRightIcon />
        </Button>
      </div>
      <Button asChild variant="outline">
        <Link
          to="."
          preloadDelay={1000}
          replace
          search={(prev) => ({ ...prev, timeRange: undefined })}
        >
          <RefreshCcwIcon />
          Reset
        </Link>
      </Button>
    </div>
  );
}
