export { edgeRuntimeAuth as middleware } from "./server/auth/edgeRuntime";

export const config = { matcher: ["/dashboard/:path*"] };
