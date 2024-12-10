import "~/styles/globals.css";

import { type Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import { TRPCReactProvider } from "~/trpc/react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Octopoda",
  description: "Octopoda - EVCC Dataset Analyzer",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode; breadcrumbs: React.ReactNode }>) {
  return (
    <html lang="de" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
