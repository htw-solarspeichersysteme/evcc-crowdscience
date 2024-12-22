// import { createFileRoute } from "@tanstack/react-router";
// import { z } from "zod";

// import { LoginForm } from "~/components/login-form";

// export const Route = createFileRoute("/login")({
//   component: RouteComponent,
//   validateSearch: z.object({
//     redirect: z.string().optional(),
//   }),
// });

// function RouteComponent() {
//   const { redirect } = Route.useSearch();
//   return (
//     <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
//       <div className="w-full max-w-sm">
//         <LoginForm redirect={redirect ?? "/dashboard"} />
//       </div>
//     </div>
//   );
// }
