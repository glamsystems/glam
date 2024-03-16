import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import { AppHero, ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import { useGlamProgram } from './glam-data-access';
import { CounterCreate, CounterList } from './glam-ui';

export default function CounterFeature() {
  const { publicKey } = useWallet();
  const { programId } = useGlamProgram();

  return publicKey ? (
    <div>
      <AppHero
        title="GLAM *.+"
        subtitle={
          'You can create a new fund by clicking the "Create" button. The state of the fund is stored on-chain.'
        }
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
          />
        </p>
        <CounterCreate />
      </AppHero>
      <CounterList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
