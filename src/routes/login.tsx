import { createFileRoute, redirect } from "@tanstack/react-router";
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
  beforeLoad: async ({ context, search }) => {
    if (context.session?.user) {
      throw redirect({ href: search.redirect ?? "/dashboard" });
    }
  },
});

function RouteComponent() {
  const search = Route.useSearch();
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
        <LoginForm redirect={search.redirect} />
      </div>
    </div>
  );
}
