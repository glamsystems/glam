"use client";

import React, { useEffect, useState } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TokenMultiSelect } from "@/components/TokenMultiSelect";
import { useGlam } from "@glam/anchor/react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { parseTxError } from "@/lib/error";
import { PublicKey } from "@solana/web3.js";
import { ExplorerLink } from "@/components/ExplorerLink";

const formSchema = z.object({
  assets: z.array(z.string()),
});

type FormSchema = z.infer<typeof formSchema>;

export default function VaultPoliciesPage() {
  const [isTxPending, setIsTxPending] = useState(false);

  const { activeGlamState, glamClient, allGlamStates } = useGlam();
  const state = allGlamStates?.find(
    (s) => s.idStr === activeGlamState?.address,
  );

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assets: [],
    },
  });

  useEffect(() => {
    if (state) {
      form.setValue(
        "assets",
        (state.assets || []).map((a) => a.toBase58()),
      );
    }
  }, [state]);

  const handleReset = (event: React.MouseEvent) => {
    event.preventDefault();
    form.setValue(
      "assets",
      (state?.assets || []).map((a) => a.toBase58()),
    );
  };

  const handleUpdateAssets = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!state) {
      return;
    }
    const vaultAssets = (state.assets || []).map((a) => a.toBase58()).sort();
    const formAssets = form.getValues().assets.sort();
    if (
      (state.assets || []).length === formAssets.length &&
      vaultAssets.every((value, index) => value === formAssets[index])
    ) {
      toast({
        title: "No changes detected",
        description: "No changes were detected in the assets list.",
      });
      return;
    }

    setIsTxPending(true);
    try {
      let updated = {
        assets: form.getValues().assets.map((a) => new PublicKey(a)),
      };
      const txSig = await glamClient.state.updateState(state.id!, updated);
      toast({
        title: "Assets allowlist updated",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update assets allowlist",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsTxPending(false);
  };

  return (
    <PageContentWrapper>
      <div className="w-full xl:w-2/3 self-center">
        <Form {...form}>
          <div className="flex space-x-4 space-y-4 items-top flex-col ">
            <FormField
              control={form.control}
              name="assets"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Vault Assets</FormLabel>
                  <FormControl>
                    <TokenMultiSelect
                      selected={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the assets allowed in the vault.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex space-x-4">
              <Button
                className="w-1/2"
                variant="ghost"
                onClick={(event) => handleReset(event)}
              >
                Reset
              </Button>
              <Button
                className="w-1/2"
                type="submit"
                loading={isTxPending}
                onClick={(event) => handleUpdateAssets(event)}
              >
                Submit
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </PageContentWrapper>
  );
}
