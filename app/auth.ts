import { queryOptions, useQuery } from "@tanstack/react-query";
import { redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { type z } from "zod";

import {
  loginFn,
  logoutFn,
  useServerSideAppSession,
  type loginInputSchema,
  type Session,
} from "~/serverHandlers/userSession";

export const getClientSession = createServerFn().handler(async () => {
  const session = await useServerSideAppSession();
  return session.data;
});

export const sessionQueryOptions = queryOptions({
  queryKey: ["clientSession"],
  queryFn: () => getClientSession(),
});

export const useAuth = () => {
  const sessionQuery = useQuery(sessionQueryOptions);
  const router = useRouter();

  return {
    session: sessionQuery.data,
    logout: async () => {
      await logoutFn();

      await sessionQuery.refetch();
      await router.invalidate();
    },
    login: async (data: z.infer<typeof loginInputSchema>) => {
      const res = await loginFn({ data });
      if (!res.success) return res;

      await sessionQuery.refetch();
      if (data.redirect) await router.navigate({ href: data.redirect });
      else await router.invalidate();
    },
  };
};

export const protectRoute = async ({
  context,
  location,
}: {
  context: { session?: Session };
  location: { href: string };
}) => {
  if (!context.session?.user) {
    throw redirect({
      to: "/login",
      search: {
        redirect: location.href,
      },
    });
  }
  return context;
};
