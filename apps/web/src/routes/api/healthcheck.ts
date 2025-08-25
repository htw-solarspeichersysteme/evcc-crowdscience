import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/healthcheck").methods({
  GET: () => {
    return json({ status: "ok" });
  },
});
