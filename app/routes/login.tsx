import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { LoginForm } from "~/components/login-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: zodValidator(
    z.object({
      redirect: z.string().optional(),
    }),
  ),
});

function RouteComponent() {
  const search = Route.useSearch();
  return (
    <div className="flex items-center justify-center w-full p-6 min-h-svh md:p-10">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
        <LoginForm redirect={search.redirect} />
      </div>
    </div>
  );
}
