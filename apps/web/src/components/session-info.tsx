import { differenceInSeconds, format } from "date-fns";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BatteryChargingIcon,
  ClockIcon,
  CloudIcon,
  EuroIcon,
  GaugeIcon,
  LeafIcon,
  PlugIcon,
  ZapIcon,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { cn, formatUnit } from "~/lib/utils";
import type { ExtractedSession } from "~/orpc/loadingSessions/types";

// Format duration as "Xh Ym" or "Xm" for short durations
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

// Hero stat card for prominent metrics
function HeroStat({
  icon: Icon,
  label,
  value,
  subValue,
  className,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: React.ReactNode;
  className?: string;
  variant?: "default" | "energy" | "time" | "cost" | "eco";
}) {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    energy: "bg-amber-500/10 text-amber-600",
    time: "bg-blue-500/10 text-blue-600",
    cost: "bg-emerald-500/10 text-emerald-600",
    eco: "bg-green-500/10 text-green-600",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          variantStyles[variant],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-semibold">{value}</p>
        {subValue && (
          <span className="text-xs text-muted-foreground">{subValue}</span>
        )}
      </div>
    </div>
  );
}

type HistoricalAverage = {
  avgPrice?: number;
  avgCo2PerKwh?: number;
};

export function SessionInfo({
  session,
  historicalAverage,
}: {
  session: ExtractedSession;
  historicalAverage?: HistoricalAverage;
}) {
  const duration = differenceInSeconds(session.endTime, session.startTime);

  const energyKwh =
    (session.chargedEnergy ?? session.sessionEnergy ?? null) != null
      ? (session.chargedEnergy ?? session.sessionEnergy ?? 0) / 1000
      : null;

  const pricePerKwh =
    session.price != null && energyKwh != null && energyKwh > 0
      ? session.price / energyKwh
      : null;

  const totalCo2 =
    session.sessionCo2PerKWh != null && energyKwh != null
      ? session.sessionCo2PerKWh * energyKwh
      : null;

  const socGain =
    session.startSoc != null && session.endSoc != null
      ? session.endSoc - session.startSoc
      : null;

  const rangeGain =
    session.startRange != null && session.endRange != null
      ? session.endRange - session.startRange
      : null;

  const efficiencyKwhPerHour =
    energyKwh != null && duration > 0 ? energyKwh / (duration / 3600) : null;

  const priceComparison =
    session.price != null &&
    pricePerKwh != null &&
    historicalAverage?.avgPrice != null &&
    historicalAverage.avgPrice > 0
      ? {
          diff:
            ((pricePerKwh - historicalAverage.avgPrice) /
              historicalAverage.avgPrice) *
            100,
          isBetter: pricePerKwh < historicalAverage.avgPrice,
        }
      : null;

  const co2Comparison =
    session.sessionCo2PerKWh != null &&
    historicalAverage?.avgCo2PerKwh != null &&
    historicalAverage.avgCo2PerKwh > 0
      ? {
          diff:
            ((session.sessionCo2PerKWh - historicalAverage.avgCo2PerKwh) /
              historicalAverage.avgCo2PerKwh) *
            100,
          isBetter: session.sessionCo2PerKWh < historicalAverage.avgCo2PerKwh,
        }
      : null;

  return (
    <Card>
      <CardContent className="p-4">
        {/* Hero Stats Row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {energyKwh != null && (
            <HeroStat
              icon={ZapIcon}
              label="Energy"
              value={formatUnit(energyKwh * 1000, "Wh", 2, true)}
              subValue={
                efficiencyKwhPerHour
                  ? `${efficiencyKwhPerHour.toFixed(2)} kWh/h`
                  : session.maxChargePower
                    ? `Peak ${formatUnit(session.maxChargePower, "W", 1, true)}`
                    : undefined
              }
              variant="energy"
            />
          )}
          <HeroStat
            icon={ClockIcon}
            label="Duration"
            value={formatDuration(duration)}
            subValue={`${format(session.startTime, "MMM d, HH:mm")} – ${format(session.endTime, "MMM d, HH:mm")}`}
            variant="time"
          />
          {session.price != null && (
            <HeroStat
              icon={EuroIcon}
              label="Cost"
              value={`€${session.price.toFixed(2)}`}
              subValue={
                pricePerKwh ? (
                  <div className="flex items-center gap-1">
                    <span>€{pricePerKwh.toFixed(2)}/kWh</span>
                    {priceComparison && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "ml-1 text-xs",
                          priceComparison.isBetter
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700",
                        )}
                      >
                        {priceComparison.isBetter ? (
                          <ArrowDownIcon className="mr-0.5 size-3" />
                        ) : (
                          <ArrowUpIcon className="mr-0.5 size-3" />
                        )}
                        {Math.abs(priceComparison.diff).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                ) : undefined
              }
              variant="cost"
            />
          )}
          {session.solarPercentage != null ? (
            <HeroStat
              icon={LeafIcon}
              label="Solar"
              value={formatUnit(session.solarPercentage, "%", 0)}
              variant="eco"
            />
          ) : session.sessionCo2PerKWh != null ? (
            <HeroStat
              icon={CloudIcon}
              label="CO₂"
              value={formatUnit(session.sessionCo2PerKWh, "g/kWh", 0)}
              subValue={
                <div className="flex items-center gap-1">
                  {totalCo2 && (
                    <span>{formatUnit(totalCo2, "g", 1, true)} total</span>
                  )}
                  {co2Comparison && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-1 text-xs",
                        co2Comparison.isBetter
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {co2Comparison.isBetter ? (
                        <ArrowDownIcon className="mr-0.5 size-3" />
                      ) : (
                        <ArrowUpIcon className="mr-0.5 size-3" />
                      )}
                      {Math.abs(co2Comparison.diff).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              }
              variant="eco"
            />
          ) : null}
        </div>

        {/* Battery Progress Section */}
        {(session.startSoc != null || session.endSoc != null) && (
          <div className="mt-4 rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <BatteryChargingIcon className="size-4 text-green-600" />
              <span className="text-sm font-medium">Battery</span>
              {socGain != null && socGain > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  +{socGain.toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 text-right text-sm font-medium">
                {session.startSoc?.toFixed(0)}%
              </span>
              <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-muted">
                {/* Existing charge (start SoC) - dimmed */}
                {session.startSoc != null && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-full bg-green-500/40"
                    style={{ width: `${session.startSoc}%` }}
                  />
                )}
                {/* Newly charged portion - bright with animated stripes */}
                {session.startSoc != null && session.endSoc != null && (
                  <div
                    className="absolute inset-y-0 rounded-r-full bg-linear-to-r from-green-500 to-emerald-400"
                    style={{
                      left: `${session.startSoc}%`,
                      width: `${Math.max(0, session.endSoc - session.startSoc)}%`,
                    }}
                  />
                )}
                {/* Limit SoC marker */}
                {session.limitSoc != null && session.limitSoc < 100 && (
                  <div
                    className="absolute inset-y-0 w-0.5 bg-amber-500"
                    style={{ left: `${session.limitSoc}%` }}
                  />
                )}
              </div>
              <span className="w-12 text-sm font-medium">
                {session.endSoc?.toFixed(0)}%
              </span>
            </div>
            {/* Range info */}
            {(session.startRange != null || session.endRange != null) && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <GaugeIcon className="size-3.5" />
                {session.startRange != null && (
                  <span>{session.startRange} km</span>
                )}
                {session.startRange != null && session.endRange != null && (
                  <ArrowRightIcon className="size-3.5" />
                )}
                {session.endRange != null && (
                  <span className="font-medium text-foreground">
                    {session.endRange} km
                  </span>
                )}
                {rangeGain != null && rangeGain > 0 && (
                  <span className="text-green-600">(+{rangeGain} km)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Compact Details Row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Loadpoint</span>
            <span className="font-medium">{session.componentId}</span>
          </div>
          {session.mode != null && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Mode</span>
              <Badge
                variant="outline"
                className={cn(
                  "font-medium",
                  session.mode === "now" && "bg-amber-100 text-amber-700",
                  session.mode === "pv" && "bg-green-100 text-green-700",
                  session.mode === "minpv" && "bg-emerald-100 text-emerald-600",
                  session.mode === "off" && "",
                )}
              >
                {session.mode}
              </Badge>
            </div>
          )}
          {session.maxPhasesActive != null && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Phases</span>
              <span className="flex items-center gap-1 font-medium">
                <PlugIcon className="size-3.5 text-muted-foreground" />
                {session.maxPhasesActive}
              </span>
            </div>
          )}
          {session.limitSoc != null && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Limit</span>
              <span className="font-medium">{session.limitSoc}%</span>
            </div>
          )}
          {/* <div className="ml-auto flex items-center gap-4 text-muted-foreground">
            <span>{format(session.startTime, "MMM d, yyyy")}</span>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
}
