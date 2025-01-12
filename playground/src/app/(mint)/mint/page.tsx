"use client";

import { useGlam } from "@glam/anchor/react";
import { redirect } from "next/navigation";

export default function MintsHome() {
  const { activeGlamState, userWallet } = useGlam();

  redirect(
    activeGlamState && userWallet.pubkey ? "/mint/supply" : "/mint/create",
  );
}
