import { Navigate } from 'react-router-dom';
import { WalletButton } from '../solana/solana-provider';
import { useWallet } from '@solana/wallet-adapter-react';

export default function AccountListFeature() {
  const { publicKey } = useWallet();

  if (publicKey) {
    return <Navigate to={publicKey.toString()} replace />;
  }

  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <WalletButton>x</WalletButton>
      </div>
    </div>
  );
}
