import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { Resource } from "i18next";

import deCommon from "./locales/de/common.json";
import enCommon from "./locales/en/common.json";

console.log("[i18n] init module loaded");

const resources: Resource = {
  de: { common: deCommon as unknown as Record<string, string> },
  en: { common: enCommon as unknown as Record<string, string> },
};

i18n.use(initReactI18next).init({
  resources,
  lng:
    (typeof window !== "undefined" &&
      (() => {
        try {
          return localStorage.getItem("i18nextLng");
        } catch {
          return null;
        }
      })()) ||
    "de",
  fallbackLng: "de",
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
}).catch((err) => {
  console.error("[i18n] init error", err);
});

export default i18n;
