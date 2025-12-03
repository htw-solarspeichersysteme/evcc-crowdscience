import { batteriesRouter } from "./batteries/router";
import { chargingStatsRouter } from "./chargingStats/router";
import { instancesRouter } from "./instances/router";
import { jobsRouter } from "./jobs/router";
import { loadingSessionsRouter } from "./loadingSessions/router";
import { loadpointsRouter } from "./loadpoints/router";
import { pvRouter } from "./pv/router";
import { sitesRouter } from "./sites/router";
import { timeSeriesRouter } from "./timeSeries/router";
import { usersRouter } from "./users/router";
import { vehiclesRouter } from "./vehicles/router";

export const router = {
  batteries: batteriesRouter,
  chargingStats: chargingStatsRouter,
  instances: instancesRouter,
  jobs: jobsRouter,
  loadingSessions: loadingSessionsRouter,
  loadpoints: loadpointsRouter,
  pv: pvRouter,
  sites: sitesRouter,
  timeSeries: timeSeriesRouter,
  users: usersRouter,
  vehicles: vehiclesRouter,
};
