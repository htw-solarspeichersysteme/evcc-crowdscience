import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

/**
 * Creates a headers callback for a given source
 * It will set the x-trpc-source header and cookies if needed
 * @param source trpc source request comes from
 * @returns headers callback
 */
export function createHeadersCallbackForSource(source: string) {
  return async () => {
    const headers = new Headers();
    headers.set("x-trpc-source", source);

    const cookies = await importCookiesAsync();
    // We need to set cookie for ssr requests (for example with useSuspenseQuery or middleware)
    if (cookies) {
      headers.set("cookie", cookies);
    }

    return headers;
  };
}

/**
 * This is a workarround as cookies are not passed to the server
 * when using useSuspenseQuery or middleware
 * @returns cookie string on server or null on client
 */
async function importCookiesAsync() {
  if (typeof window === "undefined") {
    return await import("next/headers")
      .then((headers) => headers.cookies())
      .then((cookies) =>
        cookies
          .getAll()
          .map(({ name, value }) => `${name}=${value}`)
          .join(";"),
      );
  }

  return null;
}
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
