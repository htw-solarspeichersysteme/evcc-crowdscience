/**
 * This file is necessary, because nextjs only supports the edge runtime for middleware
 */

import { cache } from "react";
import NextAuth from "next-auth";

const {
  auth: uncachedEdgeRuntimeAuth,
  signIn,
  signOut,
} = NextAuth({
  providers: [],
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
});

const edgeRuntimeAuth = cache(uncachedEdgeRuntimeAuth);

export { edgeRuntimeAuth, signIn, signOut };
