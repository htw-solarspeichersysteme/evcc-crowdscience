import { instancesRouter } from "./instances/router";
import { sitesRouter } from "./sites/router";
import { vehiclesRouter } from "./vehicles/router";

export const router = {
  instances: instancesRouter,
  sites: sitesRouter,
  vehicles: vehiclesRouter,
};
