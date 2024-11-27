"use client";

import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { AssetInput } from "@/components/AssetInput";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/FormInput";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import { useGlam } from "@glam/anchor/react";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";

const supplySchema = z.object({
  amount: z.number().nonnegative(),
  recipient: z.string().min(32),
});

type SupplySchema = z.infer<typeof supplySchema>;

export default function SupplyPage() {
  const [isTxPending, setIsTxPending] = React.useState(false);
  const { fund: fundPDA, glamClient } = useGlam();

  const form = useForm<SupplySchema>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      amount: 0,
      recipient: "",
    },
  });

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
  };

  const onSubmit: SubmitHandler<SupplySchema> = async (values, _event) => {
    const { amount, recipient } = values;
    console.log(`Minting ${amount} shares to ${recipient}`);

    let pubkey;
    try {
      pubkey = new PublicKey(recipient);
    } catch (e) {
      console.log(e);
      toast({
        title: "Invalid recipient address",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return;
    }

    if (!fundPDA) {
      return;
    }

    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const mintTo = glamClient.getShareClassAta(pubkey, shareClassMint);

    const ixCreateAta = createAssociatedTokenAccountIdempotentInstruction(
      glamClient.getManager(),
      mintTo,
      pubkey,
      shareClassMint,
      TOKEN_2022_PROGRAM_ID
    );
    const ixUpdateAtaState = await glamClient.program.methods
      .setTokenAccountsStates(0, false)
      .accounts({
        shareClassMint,
        fund: fundPDA,
      })
      .remainingAccounts([
        { pubkey: mintTo, isSigner: false, isWritable: true },
      ])
      .instruction();

    try {
      const txSig = await glamClient.program.methods
        .mintShare(0, new BN(amount * 10 ** 9))
        .accounts({
          recipient: pubkey,
          shareClassMint,
          fund: fundPDA,
        })
        .preInstructions([ixCreateAta, ixUpdateAtaState])
        .rpc();
      toast({
        title: "Successfully minted shares",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (e) {
      toast({
        title: "Failed to mint shares",
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

                <FormInput
                  className="min-w-2/3 w-2/3"
                  name="recipient"
                  label="Recipient"
                  type="string"
                  placeholder="Enter recipient address"
                />
              </div>

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
