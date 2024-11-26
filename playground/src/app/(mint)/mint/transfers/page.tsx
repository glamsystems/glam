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
import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";
import { getPriorityFeeMicroLamports } from "@/app/(shared)/settings/priorityfee";
import { set } from "date-fns";

const venues: [string, ...string[]] = ["Treasury", "Drift"];
const transferSchema = z.object({
  origin: z.enum(venues),
  destination: z.enum(venues),
  amount: z.number(),
  amountAsset: z.string(),
});

type TransferSchema = z.infer<typeof transferSchema>;

export default function Transfer() {
  const {
    fund: fundPDA,
    treasury,
    glamClient,
    driftMarketConfigs,
    driftUser,
    jupTokenList: tokenList,
  } = useGlam();

  const [amountAsset, setAmountAsset] = useState<string>("SOL");
  const [isTxPending, setIsTxPending] = useState(false);
  const [fromAssetList, setFromAssetList] = useState<Asset[]>([]);

  const treasuryAssets = () => {
    const assets =
      (treasury?.tokenAccounts || []).map((ta) => {
        const name =
          tokenList?.find((t: any) => t.address === ta.mint)?.name || "Unknown";
        const symbol =
          tokenList?.find((t: any) => t.address === ta.mint)?.symbol || ta.mint;
        return {
          name,
          symbol: symbol,
          address: ta.mint,
          decimals: ta.decimals,
          balance:
            /* combine SOL + wSOL balances */
            symbol === "SOL"
              ? Number(ta.uiAmount) +
                Number(treasury?.balanceLamports || 0) / LAMPORTS_PER_SOL
              : Number(ta.uiAmount),
        } as Asset;
      }) || [];
    return assets;
  };

  const driftAssets = () => {
    const { spotPositions } = driftUser;
    const assets =
      spotPositions.map((position: any) => {
        // balance is a string of ui amount, needs to be converted to number
        const { marketIndex, balance } = position;
        const marketConfig = driftMarketConfigs.spot.find(
          (spot) => spot.marketIndex === marketIndex
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
      }) || [];
    return assets;
  };

  useEffect(() => {
    setFromAssetList(treasuryAssets());
  }, [treasury, tokenList, fundPDA]);

  const form = useForm<TransferSchema>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      origin: "Treasury",
      destination: "Drift",
      amount: 0,
      amountAsset: "SOL",
    },
  });

  const from = form.watch("origin");
  useEffect(() => {
    if (from === "Drift") {
      console.log(driftUser.spotPositions);
      setFromAssetList(driftAssets());
      return;
    }

    setFromAssetList(treasuryAssets());
  }, [from, driftUser, driftMarketConfigs]);

  const onSubmit: SubmitHandler<TransferSchema> = async (values, event) => {
    const nativeEvent = event as unknown as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };
    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") !== "submit") {
      return;
    }

    console.log("Submitting transfer", values);

    if (!fundPDA) {
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
    const spotMarket = driftMarketConfigs.spot.find(
      (spot) => spot.symbol === amountAsset
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
        origin === "Treasury"
          ? await glamClient.drift.deposit(
              fundPDA,
              new anchor.BN(amount * 10 ** decimals),
              marketIndex,
              0,
              driftMarketConfigs,
              { getPriorityFeeMicroLamports }
            )
          : await glamClient.drift.withdraw(
              fundPDA,
              new anchor.BN(amount * 10 ** decimals),
              marketIndex,
              0,
              driftMarketConfigs,
              { getPriorityFeeMicroLamports }
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

    /*
    toast({
      title: "You submitted the following trade:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-zinc-900 p-4">
          <code className="text-white">
            {JSON.stringify(
              {
                ...values,
                amountAsset,
              },
              null,
              2
            )}
          </code>
        </pre>
      ),
    });
    */
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
                      (asset) => asset.symbol === amountAsset
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
                            if (value === "Treasury") {
                              form.setValue("destination", "Drift");
                            } else {
                              form.setValue("destination", "Treasury");
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Treasury" />
                          </SelectTrigger>
                          <SelectContent>
                            {transferSchema.shape.origin._def.values.map(
                              (option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              )
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
                            if (value === "Treasury") {
                              form.setValue("origin", "Drift");
                            } else {
                              form.setValue("origin", "Treasury");
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
                              )
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
                <Button className="w-1/2" type="submit" loading={isTxPending}>
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
