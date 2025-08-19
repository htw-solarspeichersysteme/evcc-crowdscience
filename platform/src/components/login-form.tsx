import React, { useState } from "react";
import { Link } from "@tanstack/react-router";

import { useAuth } from "~/auth";
import { LoadingButton } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { LogoIcon } from "./logo";

export function LoginForm({
  className,
  redirect,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  redirect?: string;
}) {
  // use react form with shadcn
  const [username, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();

    const res = await auth.login({
      username,
      password,
      redirect,
    });

    if (res?.error) {
      setError(res.error);
    }

    setLoading(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-muted">
        <CardHeader>
          <Link to="/">
            <LogoIcon className="mx-auto size-20" />
          </Link>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <LoadingButton type="submit" loading={loading}>
                Login
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
