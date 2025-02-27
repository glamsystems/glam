"use client";

import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { AssetInput } from "@/components/AssetInput";
import { Button } from "@/components/ui/button";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGlam, WSOL } from "@glamsystems/glam-sdk/react";
import { BN } from "@coral-xyz/anchor";
import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { parseTxError } from "@/lib/error";
import {
  getMaxCapFeeLamports,
  getPriorityFeeMicroLamports,
} from "@/app/(shared)/settings/priorityfee";

const wrapSchema = z.object({
  direction: z.enum(["wrap", "unwrap"]),
  amount: z.number().nonnegative(),
  amountAsset: z.string(),
});

type WrapSchema = z.infer<typeof wrapSchema>;

interface WrapFormProps {
  onClose: () => void;
}

export function WrapForm({ onClose }: WrapFormProps) {
  const { activeGlamState, vault, userWallet, glamClient, refresh } = useGlam();

  const [amountAsset, setAmountAsset] = useState<string>("SOL");
  const [direction, setDirection] = useState<string>("wrap");
  const [displayBalance, setDisplayBalance] = useState<number>(NaN);
  const [solBalance, setSolBalance] = useState<number>(NaN);
  const [wSolBalance, setWSolBalance] = useState<number>(NaN);
  const [isTxPending, setIsTxPending] = useState<boolean>(false);

  const form = useForm<WrapSchema>({
    resolver: zodResolver(wrapSchema),
    defaultValues: {
      direction: "wrap",
      amount: 0,
      amountAsset: "SOL",
    },
  });

  useEffect(() => {
    if (activeGlamState?.pubkey && vault) {
      const solBalance = vault?.uiAmount || NaN;
      const wSolBalance =
        vault?.tokenAccounts?.find((ta) => ta.mint.equals(WSOL))?.uiAmount || 0;
      setSolBalance(solBalance);
      setWSolBalance(wSolBalance);
      setDisplayBalance(solBalance);
    }
  }, [activeGlamState, vault, glamClient]);

  const onSubmit: SubmitHandler<WrapSchema> = async (values, _event) => {
    if (values.amount === 0) {
      toast({
        title: "Please enter an amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (!userWallet.pubkey) {
      toast({
        title: "Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!activeGlamState?.pubkey) {
      toast({
        title: "Fund not found for the connected wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsTxPending(true);
    try {
      let txId;
      if (direction === "wrap") {
        txId = await glamClient.wsol.wrap(
          activeGlamState.pubkey,
          new BN(values.amount * LAMPORTS_PER_SOL),
          {
            getPriorityFeeMicroLamports,
            maxFeeLamports: getMaxCapFeeLamports(),
          },
        );
      } else {
        // Unwrap means unwrap all, there's no amount
        txId = await glamClient.wsol.unwrap(activeGlamState.pubkey, {
          getPriorityFeeMicroLamports,
          maxFeeLamports: getMaxCapFeeLamports(),
        });
      }

      toast({
        title: `Successful ${direction}`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });

      // Close the sheet after successful operation
      onClose();
    } catch (error) {
      toast({
        title: `Failed to ${direction} ${
          direction === "wrap" ? "SOL" : "wSOL"
        }`,
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsTxPending(false);

    await refresh(); // refresh vault
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
    setAmountAsset("SOL");
    setDirection("wrap");
  };

  const handleDirectionChange = async (value: string) => {
    if (!value) {
      return;
    }
    const direction = value as "wrap" | "unwrap";
    form.setValue("direction", direction);
    if (direction === "wrap") {
      setAmountAsset("SOL");
      setDisplayBalance(solBalance);
    } else {
      setAmountAsset("wSOL");
      setDisplayBalance(wSolBalance);
    }
    setDirection(direction);
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
              assets={[
                { name: "SOL", symbol: "SOL", balance: solBalance },
                { name: "wSOL", symbol: "wSOL", balance: wSolBalance },
              ]}
              balance={displayBalance}
              selectedAsset={amountAsset}
              onSelectAsset={(asset) => setAmountAsset(asset.symbol)}
              disableAssetChange={true}
              disableAmountInput={direction === "unwrap"}
              useMaxAmount={direction === "unwrap"}
            />
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Direction</FormLabel>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={handleDirectionChange}
                    className="flex space-x-2 justify-start"
                  >
                    <ToggleGroupItem value="wrap" aria-label="Wrap">
                      Wrap
                    </ToggleGroupItem>
                    <ToggleGroupItem value="unwrap" aria-label="Unwrap">
                      Unwrap
                    </ToggleGroupItem>
                  </ToggleGroup>
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
              className="w-1/2 capitalize"
              type="submit"
              loading={isTxPending}
            >
              {direction}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
