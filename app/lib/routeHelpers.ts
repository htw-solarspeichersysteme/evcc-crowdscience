import { type MakeRouteMatch } from "@tanstack/react-router";
import { z } from "zod";

export const tryGettingRouteTitle = (r: MakeRouteMatch) => {
  const res = z
    .object({
      routeTitle: z.string(),
    })
    .safeParse(r.staticData);

  return res.success ? res.data.routeTitle : r.pathname;
};
