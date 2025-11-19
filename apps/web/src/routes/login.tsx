import { createFileRoute, redirect } from "@tanstack/react-router";
import * as z from "zod";

import { LoginForm } from "~/components/login-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: ({ context, search }) => {
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
        <LoginForm redirect={search.redirect} />
      </div>
    </div>
  );
}
