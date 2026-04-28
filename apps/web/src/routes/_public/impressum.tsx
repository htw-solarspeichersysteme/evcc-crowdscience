import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import bundesministerium from "~/assets/images/bundesministerium-fur-wirtschaft-und-klimaschutz-seeklogo.png";
import { H3, P, PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/impressum")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle>{t("impressum.title")}</PageTitle>
      <H3>{t("impressum.publisher.title")}</H3>
      <P>
        {t("impressum.publisher.institution")}
        <br />
        {t("impressum.publisher.department")}
        <br />
        {t("impressum.publisher.street")}
        <br />
        {t("impressum.publisher.city")}
      </P>

      <H3>{t("impressum.representedBy.title")}</H3>
      <P>{t("impressum.representedBy.name")}</P>
      <H3>{t("impressum.content.title")}</H3>
      <P>{t("impressum.content.group")}</P>
      <a
        href="https://solar.htw-berlin.de/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary"
      >
        https://solar.htw-berlin.de/
      </a>
      <H3>{t("impressum.contact.title")}</H3>
      <P>
        {t("impressum.contact.emailLabel")}{" "}
        <a
          href="mailto:solar@htw-berlin.de"
          className="underline hover:text-primary"
        >
          solar@htw-berlin.de
        </a>
      </P>
      <H3>{t("impressum.funding.title")}</H3>
      <P>{t("impressum.funding.text")}</P>
      <div className="flex items-center justify-center py-4">
        <img
          src={bundesministerium}
          alt={t("impressum.funding.logoAlt")}
          className="w-48"
        />
      </div>
      <P>{t("impressum.notice")}</P>
    </>
  );
}
