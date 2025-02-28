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
import { useGlam, WSOL } from "@glamsystems/glam-sdk/react";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";
import {
  getPriorityFeeMicroLamports,
  getMaxCapFeeLamports,
} from "@/app/(shared)/settings/priorityfee";
import { PublicKey } from "@solana/web3.js";

const venues = ["Vault", "Drift"] as const;
const transferSchema = z.object({
  origin: z.enum(venues),
  destination: z.enum(venues),
  amount: z.number(),
  amountAsset: z.string(),
});

type TransferSchema = z.infer<typeof transferSchema>;

interface TransferFormProps {
  onClose: () => void;
}

export function TransferForm({ onClose }: TransferFormProps) {
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
  const [transferButtonDisabled, setTransferButtonDisabled] = useState(false);

  const vaultAssets = () => {
    if (!vault || !jupTokenList) return [];

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
    if (!assets.find((a) => a.symbol === "SOL") && vault.uiAmount > 0) {
      assets.push({
        name: "SOL",
        symbol: "SOL",
        address: WSOL.toBase58(),
        decimals: 9,
        balance: vault.uiAmount || 0,
      });
    }
    return assets;
  };

  const driftAssets = () => {
    if (!driftUser || !driftMarketConfigs) return [];

    const { spotPositions } = driftUser;
    const assets = (spotPositions || [])
      .map((position) => {
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
      })
      .filter((asset) => Object.keys(asset).length > 0);

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
    setTransferButtonDisabled(false);
    setFromAssetList(from === "Drift" ? driftAssets() : vaultAssets());
  }, [from, driftUser, driftMarketConfigs]);

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
        title: "Invalid vault",
        description: "Please select a valid vault",
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

    const spotMarket = driftMarketConfigs?.spot.find(
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
              {
                getPriorityFeeMicroLamports,
                maxFeeLamports: getMaxCapFeeLamports(),
              },
            )
          : await glamClient.drift.withdraw(
              activeGlamState.pubkey,
              new anchor.BN(amount * 10 ** decimals),
              marketIndex,
              0,
              driftMarketConfigs,
              {
                getPriorityFeeMicroLamports,
                maxFeeLamports: getMaxCapFeeLamports(),
              },
            );
      toast({
        title: `Transferred ${amount} ${amountAsset} from ${origin} to ${destination}`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
      onClose();
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
              onSelectAsset={(asset) => setAmountAsset(asset.symbol)}
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
  );
}
