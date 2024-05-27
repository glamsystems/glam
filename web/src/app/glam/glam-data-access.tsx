import * as anchor from "@coral-xyz/anchor";

import {
  getMint,
  getTokenMetadata,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import {
  GetProgramAccountsFilter,
  ComputeBudgetProgram,
  Cluster,
  AccountMeta,
  PublicKey
} from "@solana/web3.js";
import {
  getDriftStateAccountPublicKey,
  getUserAccountPublicKey,
  getUserStatsAccountPublicKey,
  getDriftSignerPublicKey
} from "@drift-labs/sdk";
import {
  GlamClient,
  GlamIDL,
  getFundUri,
  getGlamProgramId,
  getImageUri,
  getMetadataUri
} from "@glam/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useMutation, useQuery } from "@tanstack/react-query";

import toast from "react-hot-toast";
import { useAnchorProvider } from "../solana/solana-provider";
import { useCluster } from "../cluster/cluster-data-access";
import { useMemo } from "react";
import { useTransactionToast } from "../ui/ui-layout";

export function useGlamProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const provider = useAnchorProvider();

  const client = new GlamClient({
    provider,
    cluster: cluster.network
  });

  const transactionToast = useTransactionToast();
  const programId = useMemo(
    () => getGlamProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = new anchor.Program(GlamIDL, programId, provider);

  const accounts = useQuery({
    queryKey: ["glam", "all", { cluster }],
    queryFn: () => program.account.fundAccount.all()
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId)
  });

  const shareClassMetadata = {
    name: "GLAM Fund X Class A Share",
    symbol: "CLASS-A",
    uri: "",
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
    imageUri: ""
  };

  type ShareClassMetadata = typeof shareClassMetadata;

  const initialize = useMutation({
    mutationKey: ["glam", "initialize", { cluster }],
    mutationFn: async ({
      fundName,
      fundSymbol,
      manager,
      assets,
      assetsStructure,
      shareClassMetadata
    }: {
      fundName: string;
      fundSymbol: string;
      manager: PublicKey;
      assets: string[];
      assetsStructure: number[];
      shareClassMetadata: ShareClassMetadata;
    }) => {
      const fundModel = {
        name: fundName,
        assets,
        assetsWeights: assetsStructure,
        shareClass: [
          {
            ...shareClassMetadata
          }
        ]
      };
      const [txId, fundPDA] = await client.createFund(fundModel);
      return txId;
    },
    onSuccess: (tx) => {
      console.log(tx);
      transactionToast(tx);
      return accounts.refetch();
    },
    onError: (e) => {
      console.error("Failed to initialize: ", e);
      return toast.error("Failed to create product");
    }
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
  const { connection } = useConnection();
  const { setVisible: setWalletModalVisible } = useWalletModal();

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

  const DRIFT_PROGRAM_ID = new PublicKey(
    "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
  );
  const spotMarketAccountUsdc = new PublicKey(
    "GXWqPpjQpdz7KZw9p7f5PX2eGxHAhvpNXiviFkAB8zXg"
  );
  const driftSpotSol = new PublicKey(
    "3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"
  );
  const driftSpotUsdc = new PublicKey(
    "6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"
  );

  const account = useQuery({
    queryKey: ["glam", "fetch-fund", { fundKey }],
    queryFn: () => program.account.fundAccount.fetch(fundKey)
  });

  const shareClassMetadata = useQuery({
    queryKey: ["glam", "fetch-share-class-metadata", { fundKey }],
    queryFn: async () => {
      const fund = await program.account.fundAccount.fetch(fundKey);
      const shareClass = fund.shareClasses[0];
      return getTokenMetadata(connection, shareClass);
    }
  });

  const subscribe = useMutation({
    mutationKey: ["glam", "subscribe", { fundKey }],
    mutationFn: async (mutationData: any) => {
      const { fund, asset, amount } = mutationData;
      const signer = wallet.publicKey;
      if (!signer) {
        setWalletModalVisible(true);
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

      const shareClassMetadata = await getTokenMetadata(connection, shareClass);

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
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        ])
        .rpc();
    },
    onSuccess: (tx) => {
      console.log(tx);
      transactionToast(tx);
      return accounts.refetch();
    },
    onError: (e) => {
      console.error("Failed to subscribe: ", e);
      return toast.error(
        "Failed to subscribe, please connect your wallet first."
      );
    }
  });

  const redeem = useMutation({
    mutationKey: ["glam", "redeem", { fundKey }],
    mutationFn: (mutationData: any) => {
      const { fund, amount, inKind } = mutationData;
      const signer = wallet.publicKey;
      if (!signer) {
        setWalletModalVisible(true);
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
      return toast.error("Failed to redeem, please connect your wallet first.");
    }
  });

  /* Drift */

  const driftDeposit = useMutation({
    mutationKey: ["glam", "driftDeposit", { fundKey }],
    mutationFn: async (mutationData: any) => {
      const { fund, asset, amount } = mutationData;
      const signer = wallet.publicKey;
      if (!signer) {
        throw Error("Wallet not connected");
      }

      const treasuryPDA = fund.treasury;
      const treasuryUsdcAta = getAssociatedTokenAddressSync(
        usdc,
        treasuryPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const userAccountPublicKey = await getUserAccountPublicKey(
        DRIFT_PROGRAM_ID,
        treasuryPDA,
        0
      );
      const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
        DRIFT_PROGRAM_ID,
        treasuryPDA
      );
      const statePublicKey = await getDriftStateAccountPublicKey(
        DRIFT_PROGRAM_ID
      );

      let remainingAccountsDeposit = [
        { pubkey: pricingSol, isSigner: false, isWritable: false },
        { pubkey: pricingUsdc, isSigner: false, isWritable: false },
        { pubkey: driftSpotSol, isSigner: false, isWritable: true },
        { pubkey: driftSpotUsdc, isSigner: false, isWritable: true }
      ];

      return program.methods
        .driftDeposit(amount)
        .accounts({
          fund: fundKey,
          treasury: treasuryPDA,
          treasuryAta: treasuryUsdcAta,
          driftAta: spotMarketAccountUsdc,
          userStats: userStatsAccountPublicKey,
          user: userAccountPublicKey,
          state: statePublicKey,
          manager: signer,
          driftProgram: DRIFT_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsDeposit)
        .rpc();
    },
    onSuccess: (tx) => {
      console.log(tx);
      transactionToast(tx);
      return accounts.refetch();
    },
    onError: (e) => {
      console.error("Failed to deposit: ", e);
      return toast.error("Failed to deposit");
    }
  });

  const driftWithdraw = useMutation({
    mutationKey: ["glam", "driftWithdraw", { fundKey }],
    mutationFn: async (mutationData: any) => {
      const { fund, asset, amount } = mutationData;
      const signer = wallet.publicKey;
      if (!signer) {
        throw Error("Wallet not connected");
      }

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

      const userAccountPublicKey = await getUserAccountPublicKey(
        DRIFT_PROGRAM_ID,
        treasuryPDA,
        0
      );
      const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
        DRIFT_PROGRAM_ID,
        treasuryPDA
      );
      const statePublicKey = await getDriftStateAccountPublicKey(
        DRIFT_PROGRAM_ID
      );
      const signerPublicKey = await getDriftSignerPublicKey(DRIFT_PROGRAM_ID);

      let remainingAccountsWithdraw = [
        { pubkey: pricingUsdc, isSigner: false, isWritable: false },
        { pubkey: pricingSol, isSigner: false, isWritable: false },
        { pubkey: driftSpotUsdc, isSigner: false, isWritable: true },
        { pubkey: driftSpotSol, isSigner: false, isWritable: true }
      ];

      return program.methods
        .driftWithdraw(amount)
        .accounts({
          fund: fundKey,
          treasury: treasuryPDA,
          treasuryAta: treasuryUsdcAta,
          driftAta: spotMarketAccountUsdc,
          userStats: userStatsAccountPublicKey,
          user: userAccountPublicKey,
          state: statePublicKey,
          manager: signer,
          driftSigner: signerPublicKey,
          driftProgram: DRIFT_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsWithdraw)
        .rpc();
    },
    onSuccess: (tx) => {
      console.log(tx);
      transactionToast(tx);
      return accounts.refetch();
    },
    onError: (e) => {
      console.error("Failed to withdraw: ", e);
      return toast.error("Failed to withdraw");
    }
  });

  return {
    account,
    shareClassMetadata,
    subscribe,
    redeem,
    driftDeposit,
    driftWithdraw
  };
}

export function getTotalShares(shareClassAddress: PublicKey) {
  const { connection } = useConnection();
  const { data } = useQuery({
    queryKey: ["get-total-shares", shareClassAddress],
    queryFn: async () => {
      try {
        const mintInfo = await getMint(
          connection,
          shareClassAddress,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        return Number(mintInfo.supply) / 1e9;
      } catch (e) {
        console.error(e);
      }
      return 0.0;
    }
  });

  return data;
}

export function getAum(treasuryAddress: string, shareClassAddress: PublicKey) {
  const { connection } = useConnection();
  const { data } = useQuery({
    queryKey: ["get-aum-in-treasury", treasuryAddress],
    queryFn: async () => {
      try {
        const filters: GetProgramAccountsFilter[] = [
          {
            dataSize: 165 //size of account (bytes)
          },
          {
            memcmp: {
              offset: 32,
              bytes: treasuryAddress
            }
          }
        ];
        const accounts = await connection.getParsedProgramAccounts(
          TOKEN_PROGRAM_ID,
          { filters: filters }
        );
        console.log(
          `Found ${accounts.length} token account(s) in treasury ${treasuryAddress}`
        );

        let totalShares = 0.0;
        try {
          const mintInfo = await getMint(
            connection,
            shareClassAddress,
            "confirmed",
            TOKEN_2022_PROGRAM_ID
          );
          totalShares = Number(mintInfo.supply) / 1e9;
        } catch (e) {
          console.error(e);
        }

        let aum = 0.0;
        const response = await fetch("https://api.glam.systems/prices");
        const { btc, usdc, sol } = await response.json();

        accounts.forEach((account) => {
          const parsedAccountInfo: any = account.account.data;
          const mintAddress: string =
            parsedAccountInfo["parsed"]["info"]["mint"];
          const tokenBalance: number =
            parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];

          switch (mintAddress) {
            case "So11111111111111111111111111111111111111112": // sol
              console.log("sol balance", tokenBalance, tokenBalance * sol);
              aum += tokenBalance * sol;
              break;
            case "8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2": // usdc
              console.log("usdc balance", tokenBalance, tokenBalance * usdc);
              aum += tokenBalance * usdc;
              break;
            case "3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv": // btc
              console.log("btc balance", tokenBalance, tokenBalance * btc);
              aum += tokenBalance * btc;
              break;
            default:
              console.log(`Unknown mint address: ${mintAddress}`);
          }
        });
        return { aum, totalShares };
      } catch (e) {
        console.error(e);
      }
      return 0;
    }
  });
  return data;
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
          const fundValue = Number(fundPerformance[i]) * 100;
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
            }
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
