"use client";

import React, { useEffect } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/FormInput";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import { useGlam } from "@glam/anchor/react";

import { BN } from "@coral-xyz/anchor";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";
import { PubkeySelector } from "@/components/PubkeySelector";
import { WarningCard } from "@/components/WarningCard";

const transferSchema = z.object({
  amount: z.number().nonnegative(),
  from: z.string(),
  to: z.string(),
});

type TransferSchema = z.infer<typeof transferSchema>;

export default function TransferPage() {
  const [isTxPending, setIsTxPending] = React.useState(false);
  const { fund: fundPDA, glamClient } = useGlam();

  const [tokenHolders, setTokenHolders] = React.useState<
    { value: string; label: string }[]
  >([]);
  useEffect(() => {
    const fetchData = async () => {
      const tokenAccounts = await glamClient.shareClass.getHolders(fundPDA!, 0);
      const tokenHolders = tokenAccounts.map((ta) => ({
        value: ta.owner.toBase58(),
        label: ta.frozen ? "Frozen" : "Active",
      }));
      setTokenHolders(tokenHolders);
    };
    fundPDA && fetchData();
  }, [glamClient, fundPDA]);

  const form = useForm<TransferSchema>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      from: "",
      to: "",
    },
  });

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
  };

  const onSubmit: SubmitHandler<TransferSchema> = async (values, _event) => {
    const { amount, from, to } = values;
    console.log(`Transferring ${amount} shares from ${from} to ${to}`);

    let fromPubkey, toPubkey;
    try {
      fromPubkey = new PublicKey(from);
      toPubkey = new PublicKey(to);
    } catch (e) {
      console.log(e);
      toast({
        title: "Invalid address",
        description: "Please enter a valid from and to addresses",
        variant: "destructive",
      });
      return;
    }

    if (!amount) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!fundPDA || !glamClient) {
      return;
    }

    try {
      const txId = await glamClient.shareClass.forceTransferShare(
        fundPDA,
        0,
        new BN(amount * 10 ** 9),
        fromPubkey,
        toPubkey,
        true,
      );

      toast({
        title: "Transfer successful",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (e) {
      toast({
        title: "Transfer failed",
        description: parseTxError(e),
        variant: "destructive",
      });
    }
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex space-x-4 items-top">
                <FormInput
                  className="min-w-1/3 w-1/3"
                  name="amount"
                  label="Amount"
                  type="number"
                />

                <div className="flex flex-col space-y-4 min-w-2/3 w-2/3">
                  <PubkeySelector
                    name="from"
                    label="From"
                    pubkeys={tokenHolders}
                  />
                  <PubkeySelector name="to" label="To" pubkeys={tokenHolders} />
                </div>
              </div>

              <WarningCard
                className="p-2"
                message="Transfering shares automatically thaws token tokens involved."
              />

              <div className="flex space-x-4 w-full">
                <Button
                  variant="ghost"
                  className="w-full capitalize"
                  type="submit"
                  onClick={handleClear}
                >
                  Clear
                </Button>
                <Button
                  className="w-full capitalize"
                  type="submit"
                  loading={isTxPending}
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
