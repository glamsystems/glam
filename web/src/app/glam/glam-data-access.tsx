import { GlamIDL, getGlamProgramId } from '@glam/anchor';
import { Program } from '@coral-xyz/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { Cluster, Keypair, PublicKey } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';

export function useGlamProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getGlamProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = new Program(GlamIDL, programId, provider);

  const accounts = useQuery({
    queryKey: ['glam', 'all', { cluster }],
    queryFn: () => program.account.fund.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const initialize = useMutation({
    mutationKey: ['glam', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods
        .initialize("test", [0, 60, 40], true)
        .accounts({
          // fund: fundPDA,
          // treasury: treasuryPDA,
          // share: sharePDA,
          // manager: manager.publicKey,
          // tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([keypair])
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error('Failed to initialize fund'),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  };
}

export function useGlamProgramAccount({ glam }: { glam: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useGlamProgram();

  const account = useQuery({
    queryKey: ['glam', 'fetch', { cluster, glam }],
    queryFn: () => program.account.fund.fetch(glam),
  });

  const close = useMutation({
    mutationKey: ['glam', 'close', { cluster, glam }],
    mutationFn: (keypair: Keypair) =>
      program.methods
        .close()
        .accounts({
          fund: glam,
          manager: keypair.publicKey,
        })
        .signers([keypair])
        .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  return {
    account,
    close,
  };
}