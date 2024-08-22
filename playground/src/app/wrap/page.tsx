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
import { useGlam, WSOL } from "@glam/anchor/react";
import { BN } from "@coral-xyz/anchor";
import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const wrapSchema = z.object({
  direction: z.enum(["wrap", "unwrap"]),
  amount: z.number().nonnegative(),
  amountAsset: z.string(),
});

type WrapSchema = z.infer<typeof wrapSchema>;

export default function Wrap() {
  const { fund: fundPDA, wallet, glamClient } = useGlam();

  const [amountAsset, setAmountAsset] = useState<string>("SOL");
  const [direction, setDirection] = useState<string>("wrap");
  const [balance, setBalance] = useState<number>(NaN);
  const [solBalance, setSolBalance] = useState<number>(NaN);
  const [wSolBalance, setWSolBalance] = useState<number>(NaN);

  const form = useForm<WrapSchema>({
    resolver: zodResolver(wrapSchema),
    defaultValues: {
      direction: "wrap",
      amount: 0,
      amountAsset: "SOL",
    },
  });

  useEffect(() => {
    if (fundPDA) {
      const fetchBalances = async () => {
        const solBalance = await glamClient.getTreasuryBalance(fundPDA);
        const wSolBalance = await glamClient.getTreasuryTokenBalance(
          fundPDA,
          WSOL
        );
        setSolBalance(solBalance);
        setWSolBalance(wSolBalance);
        setBalance(solBalance);
      };

      fetchBalances();
    }
  }, [fundPDA, glamClient]);

  const onSubmit: SubmitHandler<WrapSchema> = async (values, _event) => {
    if (values.amount === 0) {
      toast({
        title: "Please enter an amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (!wallet) {
      toast({
        title: "Please connected your wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!fundPDA) {
      toast({
        title: "Fund not found for the connected wallet.",
        variant: "destructive",
      });
      return;
    }

    let txId;
    if (direction === "wrap") {
      txId = await glamClient.wsol.wrap(
        fundPDA,
        new BN(values.amount * LAMPORTS_PER_SOL)
      );
    } else {
      // Unwrap means unwrap all, there's no amount
      txId = await glamClient.wsol.unwrap(fundPDA);
    }

    toast({
      title: `Successful ${direction}`,
      description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
    });
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
      setBalance(solBalance);
    } else {
      setAmountAsset("wSOL");
      setBalance(wSolBalance);
    }
    setDirection(direction);
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 w-1/2 mt-16"
        >
          <div className="flex space-x-4 items-top">
            <AssetInput
              className="min-w-1/2 w-1/2"
              name="amount"
              label="Amount"
              balance={balance}
              selectedAsset={amountAsset}
              onSelectAsset={setAmountAsset}
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
            <Button className="w-1/2" type="submit">
              {direction === "wrap" ? "Wrap" : "Unwrap"}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
