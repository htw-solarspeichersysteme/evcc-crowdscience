import "~/styles/globals.css";

import { type Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { SessionProvider } from "next-auth/react";

import { auth } from "~/server/auth";
import { TRPCReactProvider } from "~/trpc/react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Octopoda",
  description: "Octopoda - EVCC Dataset Analyzer",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="de" className={`${GeistSans.variable}`}>
      <body>
        <SessionProvider session={session}>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
