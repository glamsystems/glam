"use client";

import { useGlam } from "@glamsystems/glam-sdk/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";

export default function VaultsHome() {
  const { activeGlamState } = useGlam();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // 1 second timeout

    return () => clearTimeout(timer);
  }, [wallet.connected, activeGlamState?.pubkey]);

  useEffect(() => {
    // Once wallet is connected and state is loaded, redirect to holdings immediately
    if (wallet.connected && activeGlamState?.pubkey) {
      redirect("/vault/holdings");
    } else if (!isLoading) {
      redirect("/vault/create");
    }
  }, [isLoading, wallet.connected, activeGlamState?.pubkey]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
    </div>
  );
}
