import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { GlamIDL, getGlamProgramId } from "@glam/anchor";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAnchorProvider } from "../solana/solana-provider";
import { useCluster } from "../cluster/cluster-data-access";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { useTransactionToast } from "../ui/ui-layout";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";

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

  const initialize = useMutation({
    mutationKey: ["glam", "initialize", { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods
        .initialize(
          "GLAM Fund X",
          "GLAMX",
          "https://glam.systems/fund/xyz",
          [0, 60, 40],
          true,
          shareClassMetadata
        )
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
    onError: () => toast.error("Failed to initialize fund")
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize
  };
}

export function useGlamProgramAccount({ fundKey }: { fundKey: PublicKey }) {
  const transactionToast = useTransactionToast();
  const { program, accounts } = useGlamProgram();
  const wallet = useWallet();

  const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"); // 6 decimals
  const wsol = new PublicKey("So11111111111111111111111111111111111111112"); // 9 decimals
  const wbtc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv"); // 6 decimals

  const pricingUsdc = new PublicKey(
    "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"
  );
  const pricingSol = new PublicKey(
    "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
  );
  const pricingBtc = new PublicKey(
    "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J"
  );

  const account = useQuery({
    queryKey: ["glam", "fetch", { fundKey }],
    queryFn: () => program.account.fund.fetch(fundKey)
  });

  const subscribe = useMutation({
    mutationKey: ["glam", "subscribe", { fundKey }],
    mutationFn: (mutationData: any) => {
      const { fund, asset, amount } = mutationData;
      const signer = wallet.publicKey;
      if (!signer) {
        throw Error("Wallet not connected");
      }

      const shareClass = fund.shareClasses[0];
      const signerShareAta = getAssociatedTokenAddressSync(
        shareClass,
        signer,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const signerAssetAta = getAssociatedTokenAddressSync(
        asset,
        signer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const treasuryPDA = fund.treasury;
      const treasuryAta = getAssociatedTokenAddressSync(
        asset,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // treasury
      const treasuryUsdcAta = getAssociatedTokenAddressSync(
        usdc,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const treasurySolAta = getAssociatedTokenAddressSync(
        wsol,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const treasuryBtcAta = getAssociatedTokenAddressSync(
        wbtc,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      let remainingAccountsSubscribe = [
        // { pubkey: usdc, isSigner: false, isWritable: false },
        // { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
        { pubkey: treasuryUsdcAta, isSigner: false, isWritable: true },
        { pubkey: pricingUsdc, isSigner: false, isWritable: false },
        // { pubkey: wsol, isSigner: false, isWritable: false },
        // { pubkey: managerSolAta, isSigner: false, isWritable: true },
        { pubkey: treasurySolAta, isSigner: false, isWritable: true },
        { pubkey: pricingSol, isSigner: false, isWritable: false },
        // { pubkey: wbtc, isSigner: false, isWritable: false },
        // { pubkey: managerBtcAta, isSigner: false, isWritable: true },
        { pubkey: treasuryBtcAta, isSigner: false, isWritable: true },
        { pubkey: pricingBtc, isSigner: false, isWritable: false }
      ];

      return program.methods
        .subscribe(amount, true)
        .accounts({
          fund: fundKey,
          shareClass,
          signerShareAta,
          asset,
          treasuryAta,
          signerAssetAta,
          signer,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .rpc();
    },
    onSuccess: (tx) => {
      console.log(tx);
      transactionToast(tx);
      return accounts.refetch();
    },
    onError: (e) => {
      console.error("Failed to subscribe: ", e);
      return toast.error("Failed to subscribe");
    }
  });

  const redeem = useMutation({
    mutationKey: ["glam", "redeem", { fundKey }],
    mutationFn: (mutationData: any) => {
      const { fund, amount, inKind } = mutationData;
      const signer = wallet.publicKey;
      if (!signer) {
        throw Error("Wallet not connected");
      }

      const shareClass = fund.shareClasses[0];
      const signerShareAta = getAssociatedTokenAddressSync(
        shareClass,
        signer,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const treasuryPDA = fund.treasury;
      const treasuryAta = getAssociatedTokenAddressSync(
        shareClass,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // signer
      const signerUsdcAta = getAssociatedTokenAddressSync(
        usdc,
        signer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const signerSolAta = getAssociatedTokenAddressSync(
        wsol,
        signer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const signerBtcAta = getAssociatedTokenAddressSync(
        wbtc,
        signer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // treasury
      const treasuryUsdcAta = getAssociatedTokenAddressSync(
        usdc,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const treasurySolAta = getAssociatedTokenAddressSync(
        wsol,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const treasuryBtcAta = getAssociatedTokenAddressSync(
        wbtc,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      let remainingAccountsRedeem = [
        { pubkey: usdc, isSigner: false, isWritable: false },
        { pubkey: signerUsdcAta, isSigner: false, isWritable: true },
        { pubkey: treasuryUsdcAta, isSigner: false, isWritable: true },
        { pubkey: pricingUsdc, isSigner: false, isWritable: false },
        { pubkey: wsol, isSigner: false, isWritable: false },
        { pubkey: signerSolAta, isSigner: false, isWritable: true },
        { pubkey: treasurySolAta, isSigner: false, isWritable: true },
        { pubkey: pricingSol, isSigner: false, isWritable: false },
        { pubkey: wbtc, isSigner: false, isWritable: false },
        { pubkey: signerBtcAta, isSigner: false, isWritable: true },
        { pubkey: treasuryBtcAta, isSigner: false, isWritable: true },
        { pubkey: pricingBtc, isSigner: false, isWritable: false }
      ];

      return program.methods
        .redeem(amount, inKind, true)
        .accounts({
          fund: fundKey,
          treasury: treasuryPDA,
          shareClass,
          signerShareAta,
          signer,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsRedeem)
        .rpc();
    },
    onSuccess: (tx) => {
      console.log(tx);
      transactionToast(tx);
      return accounts.refetch();
    },
    onError: (e) => {
      console.error("Failed to redeem: ", e);
      return toast.error("Failed to redeem");
    }
  });

  return {
    account,
    subscribe,
    redeem
  };
}

export function useFundPerfChartData(fund: string) {
  const { data } = useQuery({
    queryKey: ["fund_performance", fund],
    queryFn: async () => {
      const response = await fetch(
        `https://api.glam.systems/fund/${fund}/perf`
      );
      const { fundPerformance, btcPerformance, solPerformance, timestamps } =
        await response.json();
      const chartData = timestamps
        .map((ts: any, i: number) => {
          const fundValue = fundPerformance[i] * 100;
          const btcValue = btcPerformance[i] * 100;
          // const solValue = solPerformance[i] * 100;
          // const ethValue = ethPerformance[i] * 100;

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
            // {
            //   group: "SOL",
            //   date: new Date(ts * 1000),
            //   value: solValue
            // }
            // {
            //   group: "ETH",
            //   date: new Date(ts * 1000),
            //   value: ethValue
            // }
          ];
        })
        .flat();

      return chartData;
    }
  });

  return data;
}
