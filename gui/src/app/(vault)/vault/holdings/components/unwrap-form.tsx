"use client";

import { Form } from "@/components/ui/form";
import { AssetInput } from "@/components/AssetInput";
import { Button } from "@/components/ui/button";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useGlam, WSOL } from "@glamsystems/glam-sdk/react";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";
import {
  getMaxCapFeeLamports,
  getPriorityFeeMicroLamports,
} from "@/app/(shared)/settings/priorityfee";

const unwrapSchema = z.object({
  amount: z.number().nonnegative(),
  amountAsset: z.string(),
});

type UnwrapSchema = z.infer<typeof unwrapSchema>;

interface UnwrapFormProps {
  onClose: () => void;
}

export function UnwrapForm({ onClose }: UnwrapFormProps) {
  const { activeGlamState, vault, userWallet, glamClient, refresh } = useGlam();

  const [wSolBalance, setWSolBalance] = useState<number>(NaN);
  const [isTxPending, setIsTxPending] = useState<boolean>(false);

  const form = useForm<UnwrapSchema>({
    resolver: zodResolver(unwrapSchema),
    defaultValues: {
      amount: 0,
      amountAsset: "wSOL",
    },
  });

  useEffect(() => {
    if (activeGlamState?.pubkey && vault) {
      const wSolBalance =
        vault?.tokenAccounts?.find((ta) => ta.mint.equals(WSOL))?.uiAmount || 0;
      setWSolBalance(wSolBalance);
    }
  }, [activeGlamState, vault, glamClient]);

  const onSubmit: SubmitHandler<UnwrapSchema> = async (values, _event) => {
    console.log(values);
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
      const txId = await glamClient.wsol.unwrap(activeGlamState.pubkey, {
        getPriorityFeeMicroLamports,
        maxFeeLamports: getMaxCapFeeLamports(),
      });
      toast({
        title: `Successful unwrapped wSOL`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });

      // Close the sheet after successful operation
      onClose();
    } catch (error) {
      toast({
        title: `Failed to unwrap wSOL`,
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsTxPending(false);

    await refresh(); // refresh vault
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
              assets={[{ name: "wSOL", symbol: "wSOL", balance: wSolBalance }]}
              balance={wSolBalance}
              selectedAsset={"wSOL"}
              disableAssetChange={true}
              disableAmountInput={true}
              useMaxAmount={true}
            />
          </div>

          <div className="flex space-x-4 w-full">
            <Button
              className="w-full capitalize"
              type="submit"
              loading={isTxPending}
            >
              Unwrap
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
