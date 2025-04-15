import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/healthcheck")({
  GET: () => {
    return json({ status: "ok" });
  },
});
