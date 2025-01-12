"use client";

import React, { use, useEffect } from "react";
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

const supplySchema = z.object({
  amount: z.number().gt(0),
  address: z.string(),
});

type SupplySchema = z.infer<typeof supplySchema>;

export default function SupplyPage() {
  const { activeGlamState, glamClient } = useGlam();

  const [txStates, setTxStates] = React.useState({
    mintTxPending: false,
    burnTxPending: false,
  });

  const [tokenHolders, setTokenHolders] = React.useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const tokenAccounts = await glamClient.shareClass.getHolders(
        activeGlamState!.pubkey,
        0,
      );
      const tokenHolders = tokenAccounts.map((ta) => ({
        value: ta.owner.toBase58(),
        label: ta.owner.toBase58(), // PubkeySelector only supports search by label
      }));
      setTokenHolders(tokenHolders);
    };
    activeGlamState?.pubkey && fetchData();
  }, [glamClient, activeGlamState]);

  const form = useForm<SupplySchema>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      amount: 0,
      address: "",
    },
  });

  const onSubmit: SubmitHandler<SupplySchema> = async (values, event) => {
    const submitter = (event?.nativeEvent as SubmitEvent)?.submitter?.id;
    if (!submitter || !activeGlamState?.pubkey) {
      return;
    }

    if (submitter === "clear") {
      form.reset();
      return;
    }

    if (submitter !== "burn" && submitter !== "mint") {
      console.log("Invalid submitter", submitter);
      return;
    }

    const { amount, address } = values;

    let pubkey;
    try {
      pubkey = new PublicKey(address);
    } catch (e) {
      console.log(e);
      toast({
        title: "Invalid recipient address",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return;
    }

    setTxStates({
      mintTxPending: submitter === "mint",
      burnTxPending: submitter === "burn",
    });
    try {
      const txSig =
        submitter === "mint"
          ? await glamClient.shareClass.mintShare(
              activeGlamState.pubkey,
              0,
              pubkey,
              new BN(amount * 10 ** 9),
              true, // force thawing token account if it's frozen
            )
          : await glamClient.shareClass.burnShare(
              activeGlamState.pubkey,
              0,
              new BN(amount * 10 ** 9),
              pubkey,
              true, // force thawing token account if it's frozen
            );

      toast({
        title: `Successfully ${submitter}ed ${amount} shares`,
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (e) {
      toast({
        title: `Failed to ${submitter} shares`,
        description: parseTxError(e),
        variant: "destructive",
      });
    }
    setTxStates({ mintTxPending: false, burnTxPending: false });
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

                <PubkeySelector
                  className="min-w-2/3 w-2/3"
                  name="address"
                  label="Public Key"
                  pubkeys={tokenHolders}
                />
              </div>

              <WarningCard
                className="p-2"
                message="Burning or minting shares automatically thaws a frozen token
                account."
              />

              <div className="flex space-x-4 w-full">
                <Button
                  variant="ghost"
                  className="w-full capitalize"
                  type="submit"
                  id="clear"
                >
                  Clear
                </Button>
                <Button
                  className="w-full capitalize"
                  variant="ghost"
                  type="submit"
                  id="burn"
                  loading={txStates.burnTxPending}
                >
                  Burn
                </Button>
                <Button
                  className="w-full capitalize"
                  type="submit"
                  id="mint"
                  loading={txStates.mintTxPending}
                >
                  Mint
                </Button>
              </div>
            </form>
          </Form>
        </FormProvider>
      </div>
    </PageContentWrapper>
  );
}
