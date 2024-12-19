import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const session = Route.useRouteContext().session;

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center text-black ">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="flex flex-col items-center gap-2">
            {!session?.user ? (
              <Button asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            ) : (
              <>
                <pre>
                  <code>{JSON.stringify(session.user, null, 2)}</code>
                </pre>
                <Button asChild>
                  <Link to="/dashboard">To the dashboard</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
