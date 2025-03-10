import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import ProfileIcon from "#/icons/profile.svg?react";
import { cn } from "#/utils/utils";
import { Avatar } from "./avatar";
import { TooltipButton } from "#/components/shared/buttons/tooltip-button";
import SignOutIcon from "#/icons/sign-out.svg?react";

interface UserAvatarProps {
  onClick: () => void;
  avatarUrl?: string;
  isLoading?: boolean;
  userMessage?: string;
  isSignedIn?: boolean;
  signIn: () => void;
}

export function UserAvatar({ onClick, avatarUrl, isLoading, isSignedIn, userMessage, signIn }: UserAvatarProps) {
  const { t } = useTranslation();
  return (
    <TooltipButton
      testId="user-avatar"
      tooltip={userMessage || t(I18nKey.USER$ACCOUNT_SETTINGS)}
      ariaLabel={userMessage || t(I18nKey.USER$ACCOUNT_SETTINGS)}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        isLoading && "bg-transparent",
      )}
    >
      <div>
        {isSignedIn ? (<button onClick={onClick}>
            <ProfileIcon
              aria-label={userMessage}
              width={28}
              height={28}
              className="text-[#9099AC]"
            />
          </button>) : (<button onClick={signIn}>
            <SignOutIcon
              aria-label={userMessage}
              width={28}
              height={28}
              className="text-[#9099AC]"
            />
          </button>)
        }
      </div>
    </TooltipButton>
  );
}
