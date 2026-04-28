import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/view-data/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-(--max-content-width) grow">
      <PageTitle>{t("viewData.title")}</PageTitle>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const instanceId = formData.get("instanceId") as string;
          void navigate({
            to: "/view-data/$instanceId",
            params: { instanceId },
          });
        }}
      >
        <p className="leading-loose">
          {t("viewData.instruction")} <br />
          {t("viewData.ctaBefore")}{" "}
          <Link
            to="/mitmachen"
            className="font-bold text-primary underline hover:no-underline"
          >
            {t("viewData.ctaLink")}
          </Link>
          {t("viewData.ctaAfter")}
        </p>
        <Input type="text" name="instanceId" placeholder="ID" required />
        <Button type="submit" className="ml-auto">
          {t("viewData.button")}
        </Button>
      </form>
    </div>
  );
}
