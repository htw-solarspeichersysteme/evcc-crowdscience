import { useTranslation } from "react-i18next";

import { H3, H4, List, P, PageTitle } from "~/components/ui/typography";

export function PrivacyText() {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle>{t("privacy.title")}</PageTitle>

      <H3>{t("privacy.sections.general.title")}</H3>
      <P>{t("privacy.sections.general.text")}</P>

      <H3>{t("privacy.sections.controller.title")}</H3>
      <P>{t("privacy.sections.controller.intro")}</P>
      <P>
        {t("privacy.sections.controller.institution")}
        <br />
        {t("privacy.sections.controller.department")}
        <br />
        {t("privacy.sections.controller.street")}
        <br />
        {t("privacy.sections.controller.city")}
      </P>
      <P>
        {t("privacy.sections.controller.representedBy")}
        <br />
        {t("privacy.sections.controller.representative")}
        <br />
      </P>
      <H4>{t("privacy.sections.controller.contactTitle")}</H4>
      <P>
        {t("privacy.sections.controller.emailLabel")}
        <a
          href="mailto:solar@htw-berlin.de"
          className="underline hover:text-primary"
        >
          solar@htw-berlin.de
        </a>
      </P>

      <H3>{t("privacy.sections.processed.title")}</H3>
      <P>{t("privacy.sections.processed.p1")}</P>
      <P>{t("privacy.sections.processed.p2")}</P>
      <P>
        <span className="font-bold">
          {t("privacy.sections.processed.itemsTitle")}
        </span>
      </P>
      <List>
        <li>{t("privacy.sections.processed.item1")}</li>
        <li>{t("privacy.sections.processed.item2")}</li>
      </List>

      <P>
        <span className="font-bold">
          {t("privacy.sections.processed.userGeneratedTitle")}
        </span>
      </P>
      <P>{t("privacy.sections.processed.userGeneratedText")}</P>

      <P>
        <span className="font-bold">
          {t("privacy.sections.processed.importantTitle")}
        </span>
        <br />
        {t("privacy.sections.processed.importantText")}
      </P>
      <P>{t("privacy.sections.processed.p3")}</P>

      <H3>{t("privacy.sections.purpose.title")}</H3>
      <P>{t("privacy.sections.purpose.intro")}</P>
      <List>
        <li>{t("privacy.sections.purpose.item1")}</li>
        <li>{t("privacy.sections.purpose.item2")}</li>
      </List>

      <H3>{t("privacy.sections.legalBasis.title")}</H3>
      <P>{t("privacy.sections.legalBasis.text")}</P>

      <H3>{t("privacy.sections.retention.title")}</H3>
      <P>{t("privacy.sections.retention.text")}</P>

      <H3>{t("privacy.sections.sharing.title")}</H3>
      <P>{t("privacy.sections.sharing.text")}</P>

      <H3>{t("privacy.sections.transparency.title")}</H3>
      <P>{t("privacy.sections.transparency.text")}</P>

      <H3>{t("privacy.sections.rights.title")}</H3>
      <P>{t("privacy.sections.rights.intro")}</P>
      <List>
        <li>
          <span className="font-bold">
            {t("privacy.sections.rights.item1Title")}
          </span>
          : {t("privacy.sections.rights.item1Text")}
        </li>
        <li>
          <span className="font-bold">
            {t("privacy.sections.rights.item2Title")}
          </span>
          : {t("privacy.sections.rights.item2Text")}
        </li>
        <li>
          <span className="font-bold">
            {t("privacy.sections.rights.item3Title")}
          </span>
          : {t("privacy.sections.rights.item3Text")}
        </li>
      </List>
      <P>{t("privacy.sections.rights.outro")}</P>

      <H3>{t("privacy.sections.changes.title")}</H3>
      <P>{t("privacy.sections.changes.text")}</P>
    </>
  );
}
