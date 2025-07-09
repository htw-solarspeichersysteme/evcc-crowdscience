import type { ReactNode } from "react";
import { type MakeRouteMatchUnion } from "@tanstack/react-router";
import { z } from "zod";

export const staticDataSchema = z.object({
  routeTitle: z
    .string()
    .or(z.function().returns(z.string().or(z.custom<ReactNode>())))
    .or(z.literal(false)),
});

export const tryGettingRouteTitle = (
  matches: MakeRouteMatchUnion[],
): string | ReactNode => {
  if (matches.length === 0) return "";

  const r = matches[matches.length - 1];
  const res = staticDataSchema.safeParse(r.staticData);

  if (!res.success) return r.pathname;

  if (res.data.routeTitle === false) {
    return tryGettingRouteTitle(matches.slice(0, -1));
  }

  return typeof res.data.routeTitle === "function"
    ? res.data.routeTitle(r)
    : res.data.routeTitle;
};
