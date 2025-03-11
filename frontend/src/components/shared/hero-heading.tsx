import { useTranslation } from "react-i18next";
import BuildIt from "#/icons/build-it.svg?react";
import { I18nKey } from "#/i18n/declaration";
import { useMsal } from "@azure/msal-react";

export function HeroHeading() {
  const { t } = useTranslation();
  const { accounts } = useMsal();
  const isSignedIn = !!(accounts && accounts.length > 0);
    const lastSpaceIndex = isSignedIn && accounts[0]?.name?.lastIndexOf(' ');
    const userName = (lastSpaceIndex && lastSpaceIndex!== -1) ? accounts[0]?.name?.substring(0, lastSpaceIndex) : accounts[0]?.name;

  return (
    <div className="w-[604px] text-center flex flex-col gap-4 items-center py-4">
      <BuildIt width={74} height={28} />
      <h1 className="text-[38px] leading-[72px] -tracking-[0.02em]">
        {"Welcome " + (userName || "Guest")}
      </h1>
      <h1 className="text-[28px] leading-[22px] -tracking-[0.02em]">
        {t(I18nKey.LANDING$TITLE)}
      </h1>
    </div>
  );
}
