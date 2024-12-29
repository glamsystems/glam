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
import { useGlam } from "@glam/anchor/react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";
import { getPriorityFeeMicroLamports } from "@/app/(shared)/settings/priorityfee";
import { WarningCard } from "@/components/WarningCard";
import { PublicKey } from "@solana/web3.js";
import { CheckIcon, CopyIcon } from "lucide-react";

const venues: [string, ...string[]] = ["Treasury", "Drift", "Manager"];
const transferSchema = z.object({
  origin: z.enum(venues),
  destination: z.enum(venues),
  amount: z.number(),
  amountAsset: z.string(),
});

type TransferSchema = z.infer<typeof transferSchema>;

export default function Transfer() {
  const {
    activeFund,
    treasury,
    glamClient,
    driftMarketConfigs,
    driftUser,
    jupTokenList,
  } = useGlam();

  const [amountAsset, setAmountAsset] = useState<string>("SOL");
  const [isTxPending, setIsTxPending] = useState(false);
  const [fromAssetList, setFromAssetList] = useState<Asset[]>([]);
  const [warning, setWarning] = useState<string>("");
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false);
  const [transferButtonDisabled, setTransferButtonDisabled] = useState(false);

  const treasuryAssets = () => {
    const assets = (treasury?.tokenAccounts || []).map((ta) => {
      const jupToken = jupTokenList?.find(
        (t) => t.address === ta.mint.toBase58(),
      );
      const name = jupToken?.name || "Unknown";
      const symbol = jupToken?.symbol || ta.mint.toBase58();
      return {
        name,
        symbol,
        address: ta.mint.toBase58(),
        decimals: ta.decimals,
        balance:
          /* combine SOL + wSOL balances */
          symbol === "SOL"
            ? ta.uiAmount + (treasury?.balanceLamports || 0) / LAMPORTS_PER_SOL
            : ta.uiAmount,
      } as Asset;
    });
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
    setFromAssetList(treasuryAssets());
  }, [treasury, jupTokenList, activeFund]);

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
    if (from === "Manager") {
      setWarning(
        "Sending FROM Manager is currently not implemented. You can just transfer any asset from any wallet to the vault address below.",
      );
      setTransferButtonDisabled(true);
      return;
    } else {
      setWarning("");
    }
    setTransferButtonDisabled(false);

    if (from === "Drift") {
      console.log(driftUser.spotPositions);
      setFromAssetList(driftAssets());
      return;
    }

    setFromAssetList(treasuryAssets());
  }, [from, driftUser, driftMarketConfigs]);

  const transferTreasuryManager = async (symbol: string, amount: number) => {
    if (!activeFund?.pubkey || !glamClient) return; // already checked, to avoid type issue

    const asset = treasuryAssets().find((a) => a.symbol === symbol);
    if (!asset) {
      toast({
        title: "Asset not found",
        variant: "destructive",
      });
    }
    console.log(asset);

    try {
      setIsTxPending(true);
      const txId = await glamClient.fund.withdraw(
        activeFund.pubkey,
        new PublicKey(asset?.address || 0),
        amount * 10 ** (asset?.decimals || 9),
      );
      toast({
        title: `Transfered ${amount} ${asset?.symbol} from treasury to manager`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error: any) {
      toast({
        title: "Failed to transfer to manager",
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

    if (!activeFund?.pubkey) {
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

    if (origin === "Manager") {
      toast({
        title: "Invalid 'From'",
        description: "Not yet implemented",
        variant: "destructive",
      });
      return;
    }

    if (origin === "Treasury" && destination === "Manager") {
      return transferTreasuryManager(amountAsset, amount);
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
        origin === "Treasury"
          ? await glamClient.drift.deposit(
              activeFund.pubkey,
              new anchor.BN(amount * 10 ** decimals),
              marketIndex,
              0,
              driftMarketConfigs,
              { getPriorityFeeMicroLamports },
            )
          : await glamClient.drift.withdraw(
              activeFund.pubkey,
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
                  <div
                    className="flex flex-row items-center space-x-2 text-sm text-muted-foreground cursor-pointer"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigator.clipboard
                        .writeText(treasury?.pubkey.toBase58() || "")
                        .then(() => {
                          setHasCopiedAddress(true);
                          setTimeout(() => setHasCopiedAddress(false), 2000);
                        });
                    }}
                  >
                    <p>{treasury?.pubkey.toBase58()}</p>
                    {hasCopiedAddress ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4 cursor-pointer" />
                    )}
                  </div>
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
