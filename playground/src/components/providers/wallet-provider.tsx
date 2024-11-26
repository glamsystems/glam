"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import {
  ClusterNetwork,
  useCluster,
} from "@/components/providers/solana-cluster-provider";

// To use default styles:
// import "@solana/wallet-adapter-react-ui/styles.css";
import "./wallet-styles.css";

function toWalletAdapterNetwork(
  cluster?: ClusterNetwork
): WalletAdapterNetwork | undefined {
  switch (cluster) {
    case ClusterNetwork.Mainnet:
      return WalletAdapterNetwork.Mainnet;
    case ClusterNetwork.Testnet:
      return WalletAdapterNetwork.Testnet;
    case ClusterNetwork.Devnet:
      return WalletAdapterNetwork.Devnet;
    default:
      return undefined;
  }
}

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cluster } = useCluster();
  const { endpoint, network } = cluster;

  const walletAdapterNetwork = toWalletAdapterNetwork(network);
  const wallets = useMemo(
    () => [
      // manually add any legacy wallet adapters here
      // new UnsafeBurnerWalletAdapter(),
    ],
    [walletAdapterNetwork]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
