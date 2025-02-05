"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon } from "@radix-ui/react-icons";

export default function WalletOrFundAlert({
  wallet,
  statePda,
}: {
  wallet: any;
  statePda: any;
}) {
  if (!wallet) {
    return (
      <Alert className="max-w-lg">
        <RocketIcon className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription className="mt-4">
          Connect a wallet to use the app.
        </AlertDescription>
      </Alert>
    );
  }

  if (!statePda) {
    return (
      <Alert className="max-w-lg">
        <RocketIcon className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription className="mt-4">
          Wallet <span className="font-mono">{wallet?.toBase58()}</span> is
          connected, but you do not have access to any GLAM products.
        </AlertDescription>
      </Alert>
    );
  }
}
