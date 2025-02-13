"use client";

import { useGlam } from "@glamsystems/glam-sdk/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { redirect } from "next/navigation";

export default function VaultsHome() {
  const { activeGlamState } = useGlam();
  const wallet = useWallet();

  redirect(
    wallet.connected && activeGlamState?.pubkey
      ? "/vault/holdings"
      : "/vault/create",
  );
}
