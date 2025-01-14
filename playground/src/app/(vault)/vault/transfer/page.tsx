"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as anchor from "@coral-xyz/anchor";
import { Asset, AssetInput } from "@/components/AssetInput";
import { Button } from "@/components/ui/button";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam, WSOL } from "@glam/anchor/react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";
import { getPriorityFeeMicroLamports } from "@/app/(shared)/settings/priorityfee";
import { WarningCard } from "@/components/WarningCard";
import { PublicKey } from "@solana/web3.js";
import { ClickToCopyText } from "@/components/ClickToCopyText";

const venues = ["Vault", "Drift", "Owner"] as const;
const transferSchema = z.object({
  origin: z.enum(venues),
  destination: z.enum(venues),
  amount: z.number(),
  amountAsset: z.string(),
});

type TransferSchema = z.infer<typeof transferSchema>;

export default function Transfer() {
  const {
    activeGlamState,
    vault,
    glamClient,
    driftMarketConfigs,
    driftUser,
    jupTokenList,
  } = useGlam();

  const [amountAsset, setAmountAsset] = useState<string>("SOL");
  const [isTxPending, setIsTxPending] = useState(false);
  const [fromAssetList, setFromAssetList] = useState<Asset[]>([]);
  const [warning, setWarning] = useState<string>("");
  const [transferButtonDisabled, setTransferButtonDisabled] = useState(false);

  const vaultAssets = () => {
    const assets = (vault?.tokenAccounts || []).map(
      ({ mint, uiAmount, decimals }) => {
        const jupToken = jupTokenList?.find(
          (t) => t.address === mint.toBase58(),
        );
        const name = jupToken?.name || "Unknown";
        const symbol = jupToken?.symbol || mint.toBase58();
        // If vault holds wSOL, combine SOL + wSOL balance
        const balance =
          symbol === "SOL" ? uiAmount + (vault?.uiAmount || 0) : uiAmount;
        return {
          name,
          symbol,
          address: mint.toBase58(),
          decimals: decimals,
          balance,
        } as Asset;
      },
    );
    // If vault does not hold wSOL, explicitly add SOL
    if (!assets.find((a) => a.symbol === "SOL")) {
      assets.push({
        name: "SOL",
        symbol: "SOL",
        address: WSOL.toBase58(),
        decimals: 9,
        balance: vault.uiAmount || NaN,
      });
    }
    return assets;
  };

  const driftAssets = () => {
    const { spotPositions } = driftUser;
    const assets = (spotPositions || []).map((position: any) => {
      // balance is a string of ui amount, needs to be converted to number
      const { marketIndex, balance } = position;
      const marketConfig = driftMarketConfigs.spot.find(
        (spot) => spot.marketIndex === marketIndex,
      );
      if (!marketConfig) {
        return {} as Asset;
      }
      const { symbol, mint, decimals } = marketConfig;
      return {
        name: symbol,
        symbol,
        address: mint,
        decimals,
        balance: Number(balance),
      } as Asset;
    });
    return assets;
  };

  useEffect(() => {
    setFromAssetList(vaultAssets());
  }, [vault, jupTokenList, activeGlamState]);

  const form = useForm<TransferSchema>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      origin: "Vault",
      destination: "Drift",
      amount: 0,
      amountAsset: "SOL",
    },
  });

  const from = form.watch("origin");
  useEffect(() => {
    if (from === "Owner") {
      setWarning(
        "To deposit into the vault, transfer any asset from any wallet to the vault address provided below.",
      );
      setTransferButtonDisabled(true);
      return;
    }

    setWarning("");
    setTransferButtonDisabled(false);

    if (from === "Drift") {
      setFromAssetList(driftAssets());
      return;
    }

    setFromAssetList(vaultAssets());
  }, [from, driftUser, driftMarketConfigs]);

  const withdrawFromVault = async (symbol: string, amount: number) => {
    if (!activeGlamState?.pubkey || !glamClient) return; // already checked, to avoid type issue

    const asset = vaultAssets().find((a) => a.symbol === symbol);
    if (!asset) {
      toast({
        title: "Asset not found",
        variant: "destructive",
      });
    }
    console.log(asset);

    try {
      setIsTxPending(true);
      const txId = await glamClient.state.withdraw(
        activeGlamState.pubkey,
        new PublicKey(asset?.address || 0),
        amount * 10 ** (asset?.decimals || 9),
      );
      toast({
        title: `Withdraw ${amount} ${asset?.symbol} from vault`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error: any) {
      toast({
        title: "Failed to withdraw from vault",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsTxPending(false);
  };

  const onSubmit: SubmitHandler<TransferSchema> = async (values, event) => {
    const nativeEvent = event as unknown as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };
    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") !== "submit") {
      return;
    }

    console.log("Submitting transfer", values);

    if (!activeGlamState?.pubkey) {
      toast({
        title: "Invalid fund",
        description: "Please select a valid fund",
        variant: "destructive",
      });
      return;
    }

    const { amount, origin, destination } = values;
    if (!amount) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (origin === "Owner") {
      toast({
        title: "Invalid 'From'",
        description: "Not yet implemented",
        variant: "destructive",
      });
      return;
    }

    if (origin === "Vault" && destination === "Owner") {
      return withdrawFromVault(amountAsset, amount);
    }

    const spotMarket = driftMarketConfigs.spot.find(
      (spot) => spot.symbol === amountAsset,
    );
    if (!spotMarket) {
      toast({
        title: "Drift market cannot be found for the selected asset",
        description: "Please select an asset with a drift market.",
        variant: "destructive",
      });
      return;
    }
    const { marketIndex, decimals } = spotMarket;

    try {
      setIsTxPending(true);
      const txId =
        origin === "Vault"
          ? await glamClient.drift.deposit(
              activeGlamState.pubkey,
              new anchor.BN(amount * 10 ** decimals),
              marketIndex,
              0,
              driftMarketConfigs,
              { getPriorityFeeMicroLamports },
            )
          : await glamClient.drift.withdraw(
              activeGlamState.pubkey,
              new anchor.BN(amount * 10 ** decimals),
              marketIndex,
              0,
              driftMarketConfigs,
              { getPriorityFeeMicroLamports },
            );
      toast({
        title: `Transfered ${amount} ${amountAsset} from ${origin} to ${destination}`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error: any) {
      toast({
        title: "Failed to submit spot order",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsTxPending(false);
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
    setAmountAsset("SOL");
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex space-x-4">
                <AssetInput
                  className="min-w-1/2 w-1/2"
                  name="amount"
                  label="Amount"
                  assets={fromAssetList}
                  balance={
                    (fromAssetList || []).find(
                      (asset) => asset.symbol === amountAsset,
                    )?.balance || 0
                  }
                  selectedAsset={amountAsset}
                  onSelectAsset={setAmountAsset}
                />
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem className="w-1/2">
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "Vault") {
                              form.setValue("destination", "Drift");
                            } else {
                              form.setValue("destination", "Vault");
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vault" />
                          </SelectTrigger>
                          <SelectContent>
                            {transferSchema.shape.origin._def.values.map(
                              (option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem className="w-1/2">
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "Vault") {
                              form.setValue("origin", "Drift");
                            } else {
                              form.setValue("origin", "Vault");
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Drift" />
                          </SelectTrigger>
                          <SelectContent>
                            {transferSchema.shape.destination._def.values.map(
                              (option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {warning && (
                <>
                  <WarningCard className="p-2" message={warning} />
                  <ClickToCopyText
                    text={activeGlamState?.pubkey.toBase58() || ""}
                  />
                </>
              )}

              <div className="flex space-x-4 w-full">
                <Button
                  className="w-1/2"
                  variant="ghost"
                  onClick={(event) => handleClear(event)}
                >
                  Clear
                </Button>
                <Button
                  className="w-1/2"
                  type="submit"
                  loading={isTxPending}
                  disabled={transferButtonDisabled}
                >
                  Transfer
                </Button>
              </div>
            </form>
          </Form>
        </FormProvider>
      </div>
    </PageContentWrapper>
  );
}
