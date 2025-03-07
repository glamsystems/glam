"use client";

import { Form } from "@/components/ui/form";
import { AssetInput } from "@/components/AssetInput";
import { Button } from "@/components/ui/button";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useGlam } from "@glamsystems/glam-sdk/react";
import { BN } from "@coral-xyz/anchor";
import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { parseTxError } from "@/lib/error";
import {
  getMaxCapFeeLamports,
  getPriorityFeeMicroLamports,
} from "@/app/(shared)/settings/priorityfee";

const wrapSchema = z.object({
  amount: z.number().nonnegative(),
  amountAsset: z.string(),
});

type WrapSchema = z.infer<typeof wrapSchema>;

interface WrapFormProps {
  onClose: () => void;
}

export function WrapForm({ onClose }: WrapFormProps) {
  const { activeGlamState, vault, userWallet, glamClient, refresh } = useGlam();

  const [displayBalance, setDisplayBalance] = useState<number>(NaN);
  const [solBalance, setSolBalance] = useState<number>(NaN);
  const [isTxPending, setIsTxPending] = useState<boolean>(false);

  const form = useForm<WrapSchema>({
    resolver: zodResolver(wrapSchema),
    defaultValues: {
      amount: 0,
      amountAsset: "SOL",
    },
  });

  useEffect(() => {
    if (activeGlamState?.pubkey && vault) {
      const solBalance = vault?.uiAmount || NaN;
      setSolBalance(solBalance);
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
        title: "Vault not found for the connected wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsTxPending(true);
    try {
      const txId = await glamClient.wsol.wrap(
        activeGlamState.pubkey,
        new BN(values.amount * LAMPORTS_PER_SOL),
        {
          getPriorityFeeMicroLamports,
          maxFeeLamports: getMaxCapFeeLamports(),
        },
      );

      toast({
        title: `Successful wrapped ${values.amount} SOL`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });

      // Close the sheet after successful operation
      onClose();
    } catch (error) {
      toast({
        title: "Failed to wrap SOL",
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
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex space-x-4">
            <AssetInput
              className="w-full"
              name="amount"
              label="Amount"
              assets={[{ name: "SOL", symbol: "SOL", balance: solBalance }]}
              balance={displayBalance}
              selectedAsset={"SOL"}
              disableAssetChange={true}
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
              Wrap
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
