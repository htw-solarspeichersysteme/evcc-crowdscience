import type { ReactNode } from "react";
import { type MakeRouteMatchUnion } from "@tanstack/react-router";
import * as z from "zod";

export const staticDataSchema = z.object({
  routeTitle: z
    .string()
    .or(
      z.function({
        input: z.any(),
        output: z.string().or(z.custom<ReactNode>()),
      }),
    )
    .or(z.literal(false)),
  topLevelComponent: z
    .function({
      input: z.any(),
      output: z.custom<ReactNode>().optional(),
    })
    .optional(),
});

export const tryGettingRouteTitle = (
  matches: MakeRouteMatchUnion[],
): { title: string | ReactNode; topLevelComponent?: ReactNode } => {
  if (matches.length === 0) return { title: "" };

  const r = matches[matches.length - 1];

  if (!r.context.routeTitle) {
    return tryGettingRouteTitle(matches.slice(0, -1));
  }

  return { title: r.context.routeTitle ?? "" };
};
