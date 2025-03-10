import React from "react";
import { UserAvatar } from "./user-avatar";
import { AccountSettingsContextMenu } from "../context-menu/account-settings-context-menu";
import { useMsal } from "@azure/msal-react";

const redirectUri = typeof window !== 'undefined' ? window.location.href : "http://localhost:3000";
interface UserActionsProps {
  onLogout: () => void;
  user?: { avatar_url: string };
}

export function UserActions({ onLogout, user }: UserActionsProps) {
  const [accountContextMenuIsVisible, setAccountContextMenuIsVisible] =
    React.useState(false);

  const { instance, accounts } = useMsal();
  const signIn = () => {
    instance.loginPopup({
      scopes: ["user.read", "profile"]
    });
  };

  const signOut = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: redirectUri
    });
  };

  const isSignedIn = !!(accounts && accounts.length > 0);
  const userMessage = isSignedIn ? accounts[0]?.name : "Sign In";

  const toggleAccountMenu = () => {
    setAccountContextMenuIsVisible((prev) => !prev);
  };

  const closeAccountMenu = () => {
    setAccountContextMenuIsVisible(false);
  };

  const handleLogout = () => {
    signOut();
    closeAccountMenu();
  };

  return (
    <div data-testid="user-actions" className="w-8 h-8 relative">
      <UserAvatar avatarUrl={user?.avatar_url} onClick={toggleAccountMenu} userMessage={userMessage} signIn={signIn} isSignedIn={isSignedIn}/>

      {accountContextMenuIsVisible && (
        <AccountSettingsContextMenu
          isLoggedIn={!!isSignedIn}
          onLogout={handleLogout}
          onClose={closeAccountMenu}
        />
      )}
    </div>
  );
}
