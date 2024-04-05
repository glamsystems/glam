import * as anchor from "@coral-xyz/anchor";

import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { GlamIDL, getGlamProgramId } from "@glam/anchor";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Program } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import toast from "react-hot-toast";
import { useAnchorProvider } from "../solana/solana-provider";
import { useCluster } from "../cluster/cluster-data-access";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { useTransactionToast } from "../ui/ui-layout";

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
    queryKey: ["glam", "all", { cluster }],
    queryFn: () => program.account.fund.all()
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId)
  });

  const shareClassMetadata = {
    name: "GLAM Fund X Class A Share",
    symbol: "CLASS-A",
    uri: "https://api.glam.systems/metadata/xyz",
    shareClassAsset: "USDC",
    shareClassAssetId: new PublicKey(
      "8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"
    ),
    isin: "XS1082172823",
    status: "open",
    feeManagement: 15000, // 1_000_000 * 0.015,
    feePerformance: 100000, // 1_000_000 * 0.1,
    policyDistribution: "accumulating",
    extension: "",
    launchDate: "2024-04-01",
    lifecycle: "active",
    imageUri: "https://api.glam.systems/image/xyz.png"
  };

  type ShareClassMetadata = typeof shareClassMetadata;

  const initialize = useMutation({
    mutationKey: ["glam", "initialize", { cluster }],
    mutationFn: ({
      fundName,
      fundSymbol,
      fundUri,
      manager,
      feeStructure,
      shareClassMetadata
    }: {
      fundName: string;
      fundSymbol: string;
      fundUri: string;
      manager: PublicKey;
      feeStructure: number[];
      shareClassMetadata: ShareClassMetadata;
    }) =>
      program.methods
        .initialize(
          fundName,
          fundSymbol,
          fundUri,
          feeStructure,
          true,
          shareClassMetadata
        )
        .accounts({
          fund: PublicKey.findProgramAddressSync(
            [
              anchor.utils.bytes.utf8.encode("fund"),
              manager.toBuffer(),
              anchor.utils.bytes.utf8.encode("fundName")
            ],
            program.programId
          )[0],
          treasury: PublicKey.findProgramAddressSync(
            [
              anchor.utils.bytes.utf8.encode("treasury"),
              // fundPDA.toBuffer(),
              PublicKey.findProgramAddressSync(
                [
                  anchor.utils.bytes.utf8.encode("fund"),
                  manager.toBuffer(),
                  anchor.utils.bytes.utf8.encode("fundName")
                ],
                program.programId
              )[0].toBuffer()
            ],
            program.programId
          )[0],
          share: PublicKey.findProgramAddressSync(
            [
              anchor.utils.bytes.utf8.encode("share"),
              // fundPDA.toBuffer(),
              PublicKey.findProgramAddressSync(
                [
                  anchor.utils.bytes.utf8.encode("fund"),
                  manager.toBuffer(),
                  anchor.utils.bytes.utf8.encode("fundName")
                ],
                program.programId
              )[0].toBuffer()
            ],
            program.programId
          )[0],
          manager: manager,
          tokenProgram: TOKEN_2022_PROGRAM_ID
        })
        .rpc()
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize
  };
}

export function useGlamProgramAccount({ glam }: { glam: PublicKey }) {
  const transactionToast = useTransactionToast();
  const { program, accounts } = useGlamProgram();

  const account = useQuery({
    queryKey: ["glam", "fetch", { glam }],
    queryFn: () => program.account.fund.fetch(glam)
  });

  const subscribe = useMutation({
    mutationKey: ["glam", "subscribe", { glam }],
    mutationFn: (keypair: Keypair) =>
      program.methods
        .close()
        .accounts({
          fund: glam,
          manager: keypair.publicKey
        })
        .signers([keypair])
        .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    }
  });

  return {
    account
    // close
  };
}

export function useFundPerfChartData(fund: string) {
  const { data } = useQuery({
    queryKey: ["fund_performance", fund],
    queryFn: async () => {
      const response = await fetch(
        `https://api.glam.systems/fund/${fund}/perf`
      );
      const { fundPerformance, btcPerformance, ethPerformance, timestamps } =
        await response.json();
      const chartData = timestamps
        .map((ts: any, i: number) => {
          const fundValue = fundPerformance[i] * 100;
          const btcValue = btcPerformance[i] * 100;
          const ethValue = ethPerformance[i] * 100;

          return [
            {
              group: "This fund",
              date: new Date(ts * 1000),
              value: fundValue
            },
            {
              group: "BTC",
              date: new Date(ts * 1000),
              value: btcValue
            },
            {
              group: "ETH",
              date: new Date(ts * 1000),
              value: ethValue
            }
          ];
        })
        .flat();

      return chartData;
    }
  });

  return data;
}
