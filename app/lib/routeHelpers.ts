import { type MakeRouteMatch } from "@tanstack/react-router";
import { z } from "zod";

export const tryGettingRouteTitle = (r: MakeRouteMatch) => {
  const res = z
    .object({
      routeTitle: z.string().or(z.function().returns(z.string())),
    })
    .safeParse(r.staticData);

  if (res.success) {
    return typeof res.data.routeTitle === "function"
      ? res.data.routeTitle(r)
      : res.data.routeTitle;
  }

  return r.pathname;
};
