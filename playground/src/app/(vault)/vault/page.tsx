"use client";

import { useGlam } from "@glam/anchor/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { redirect } from "next/navigation";

export default function VaultsHome() {
  const { activeFund } = useGlam();
  const wallet = useWallet();

  redirect(
    wallet.connected && activeFund ? "/vault/holdings" : "/vault/create",
  );
}
