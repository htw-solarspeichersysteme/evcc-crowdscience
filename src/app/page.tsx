import Link from "next/link";

import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const hello = await api.user.hello({ text: "from tRPC" });
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center text-black ">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-black">
              {hello ? hello.greeting : "Loading tRPC query..."}
            </p>

            {!session ? (
              <Button asChild>
                <Link href={"/auth/signin"}>Sign in</Link>
              </Button>
            ) : (
              <>
                <pre>
                  <code>{JSON.stringify(session, null, 2)}</code>
                </pre>
                <Button asChild>
                  <Link href={"/dashboard"}>To the dashboard</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
