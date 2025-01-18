"use client";

import { useGlam } from "@glam/anchor/react";
import { redirect } from "next/navigation";

export default function MintsHome() {
  const { activeGlamState, userWallet } = useGlam();

  redirect(
    userWallet.pubkey && activeGlamState?.pubkey
      ? "/mint/supply"
      : "/mint/create",
  );
}
