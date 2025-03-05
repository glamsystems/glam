"use client";

import { useGlam } from "@glamsystems/glam-sdk/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function MintsHome() {
  const { activeGlamState, userWallet } = useGlam();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // 1 second timeout

    return () => clearTimeout(timer);
  }, [userWallet.pubkey, activeGlamState?.pubkey]);

  useEffect(() => {
    // Once wallet is connected and state is loaded, redirect to holdings immediately
    if (userWallet.pubkey && activeGlamState?.pubkey) {
      redirect("/mint/supply");
    } else if (!isLoading) {
      redirect("/mint/create");
    }
  }, [isLoading, userWallet.pubkey, activeGlamState?.pubkey]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
    </div>
  );
}
