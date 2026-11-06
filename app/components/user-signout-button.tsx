import React from "react";

export function UserSignOutButton({ onSignOut }: { onSignOut: () => void }) {
  return <button onClick={onSignOut}>Sign Out</button>;
}
