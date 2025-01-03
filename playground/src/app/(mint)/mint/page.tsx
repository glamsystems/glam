"use client";

import { useGlam } from "@glam/anchor/react";
import { redirect } from "next/navigation";

export default function MintsHome() {
  const { activeFund, userWallet } = useGlam();

  redirect(activeFund && userWallet.pubkey ? "/mint/supply" : "/mint/create");
}
