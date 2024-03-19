import {
  AnchorWallet,
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { ReactNode, useCallback, useMemo } from 'react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import {
  toWalletAdapterNetwork,
  useCluster,
} from '../cluster/cluster-data-access';

import { AnchorProvider } from '@coral-xyz/anchor';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletError } from '@solana/wallet-adapter-base';

require('@solana/wallet-adapter-react-ui/styles.css');

export const WalletButton = WalletMultiButton;

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster();
  const endpoint = useMemo(() => cluster.endpoint, [cluster]);
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter({
        network: toWalletAdapterNetwork(cluster.network),
      }),
    ],
    [cluster]
  );

  const onError = useCallback((error: WalletError) => {
    console.error(error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: 'confirmed',
  });
}
