import { createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getIronSession } from "iron-session";

import { env } from "~/env";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

export type Session = {
  user: SessionUser;
};

export async function hashPassword(password: string) {
  return await Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string) {
  return await Bun.password.verify(password, hash);
}

export const getAppSession = createServerOnlyFn(async () => {
  return getIronSession<Session>(
    { read: getCookie, write: setCookie },
    {
      cookieName: "app-session",
      password: env.AUTH_SECRET,
      ttl: 7 * 24 * 60 * 60,
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      },
    },
  );
});

export type DefaultContext = {
  session: Partial<Session>;
  internal?: boolean;
};
