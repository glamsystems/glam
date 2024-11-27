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

const transferSchema = z.object({
  amount: z.number().nonnegative(),
  from: z.string().min(32),
  to: z.string().min(32),
});

type TransferSchema = z.infer<typeof transferSchema>;

export default function TransferPage() {
  const [isTxPending, setIsTxPending] = React.useState(false);
  const { fund: fundPDA, glamClient } = useGlam();

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

    if (!fundPDA) {
      return;
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
                  <FormInput
                    name="from"
                    label="From"
                    type="string"
                    placeholder="Enter address"
                  />

                  <FormInput
                    name="to"
                    label="To"
                    type="string"
                    placeholder="Enter address"
                  />
                </div>
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
