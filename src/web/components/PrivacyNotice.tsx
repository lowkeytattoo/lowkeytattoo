import { Link } from "react-router-dom";
import { useI18n } from "@web/i18n/I18nProvider";
import { ROUTES } from "@web/config/routes";

/** First-layer data protection notice (art. 13 RGPD / art. 11 LOPDGDD) shown next to forms. */
export const PrivacyNotice = ({ purpose }: { purpose: "booking" | "contact" }) => {
  const { t, locale } = useI18n();
  return (
    <p className="text-[11px] leading-relaxed text-muted-foreground">
      {t(`privacy.notice.${purpose}`)}{" "}
      <Link
        to={ROUTES[locale].privacy}
        target="_blank"
        className="underline underline-offset-2 hover:text-foreground"
      >
        {t("privacy.notice.more")}
      </Link>
    </p>
  );
};
