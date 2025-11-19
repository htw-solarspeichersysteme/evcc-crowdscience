import { Link } from "@tanstack/react-router";
import { addHours, subHours } from "date-fns";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  RefreshCcwIcon,
} from "lucide-react";

import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import type { TimeRange } from "~/lib/globalSchemas";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { Combobox } from "./ui/combo-box";
import { DateRangePicker } from "./ui/date-range-picker";

function getChangedTimeRange(
  timeRange: TimeRange,
  hours: number,
  direction: "left" | "right",
) {
  const changeFn = direction === "left" ? subHours : addHours;

  return {
    start: changeFn(new Date(timeRange.start), hours).getTime(),
    end: changeFn(new Date(timeRange.end), hours).getTime(),
    windowMinutes: timeRange.windowMinutes,
  };
}

export function TimeSeriesSettingsPicker({
  className,
}: {
  className?: string;
}) {
  const { timeRange, updateTimeRange } = useTimeSeriesSettings();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DateRangePicker
        key={`${timeRange?.start}-${timeRange?.end}`}
        initialDateFrom={new Date(timeRange.start)}
        initialDateTo={new Date(timeRange.end)}
        onUpdate={(values) => {
          updateTimeRange({
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
        value={timeRange.windowMinutes.toString()}
        onChange={(value) =>
          updateTimeRange({ windowMinutes: parseInt(value) })
        }
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            updateTimeRange(getChangedTimeRange(timeRange, 8, "left"))
          }
        >
          <ArrowLeftIcon />
          -8h
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            updateTimeRange(getChangedTimeRange(timeRange, 8, "right"))
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
