"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";

export default function ProductPage() {
  const params = useParams();
  const { product } = params; // Correctly destructuring the address from params

  const publicKey = useMemo(() => {
    if (!product) {
      return;
    }
    try {
      return new PublicKey(product);
    } catch (e) {
      console.log(`Invalid public key`, e);
    }
  }, [product]);

  if (!publicKey) {
    return <div>Error loading account</div>;
  }

  return <div>{publicKey.toBase58()}</div>;
}
