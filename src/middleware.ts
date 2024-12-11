import NextAuth from "next-auth";

const { auth } = NextAuth({
  providers: [],
  callbacks: {
    authorized: async ({ auth }) => Boolean(auth),
  },
});
export default auth;

export const config = { matcher: ["/dashboard/:path*"] };
