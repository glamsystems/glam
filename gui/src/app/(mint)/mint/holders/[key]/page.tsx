"use client";

import * as React from "react";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";

export default function KeyPage() {
  const params = useParams();
  const { key } = params;

  const publicKey = useMemo(() => {
    if (!key) {
      return;
    }
    try {
      return new PublicKey(key);
    } catch (e) {
      console.log(`Invalid public key`, e);
    }
  }, [key]);

  if (!publicKey) {
    return <div>Error loading key</div>;
  }

  return <div className="w-full">{publicKey.toBase58()}</div>;
}
