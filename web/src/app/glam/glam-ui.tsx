import { Keypair, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import {
  useGlamProgram,
  useGlamProgramAccount,
} from './glam-data-access';

// export function CounterCreate() {
//   const { initialize } = useGlamProgram();

//   return (
//     <button
//       className="btn btn-xs lg:btn-md btn-primary"
//       onClick={() => initialize.mutateAsync(Keypair.generate())}
//       disabled={initialize.isPending}
//     >
//       Create {initialize.isPending && '...'}
//     </button>
//   );
// }

export function GlamList() {
  const { accounts, getProgramAccount } = useGlamProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <GlamCard
              key={account.publicKey.toString()}
              glam={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No Glams`</h2>
          No glams found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function GlamCard({ glam }: { glam: PublicKey }) {
  const { account } =
    useGlamProgramAccount({
      glam,
    });

  return account.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => account.refetch()}
          >
            {account.data?.symbol}
          </h2>
          <div className="text-center space-y-4">
            <p>
              <Link to={`/products/${glam}`}>{ellipsify(glam.toString())}</Link><br/><br/>
              <ExplorerLink
                path={`account/${glam}`}
                label={"explorer"}
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
