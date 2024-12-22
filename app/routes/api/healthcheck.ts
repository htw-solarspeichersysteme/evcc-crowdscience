import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";

export const APIRoute = createAPIFileRoute("/api/healthcheck")({
  GET: () => {
    return json({ status: "ok" });
  },
});
