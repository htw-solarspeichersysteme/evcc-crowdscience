import { createFileRoute } from "@tanstack/react-router";

import { PrivacyText } from "~/components/privacy-text";

export const Route = createFileRoute("/_public/privacy")({
  component: PrivacyText,
});
