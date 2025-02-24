"use client";

import React, { useEffect, useState } from "react";
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
import { useGlam } from "@glamsystems/glam-sdk/react";
import { toast } from "@/components/ui/use-toast";
import { parseTxError } from "@/lib/error";
import { FormButtons } from "@/app/(vault)/vault/integrations/policies/components/form-buttons";
import { PublicKey } from "@solana/web3.js";
import { ExplorerLink } from "@/components/ExplorerLink";

const formSchema = z.object({
  assets: z.array(z.string()),
});

type FormSchema = z.infer<typeof formSchema>;

export default function JupiterPoliciesPage() {
  const [isTxPending, setIsTxPending] = useState(false);
  const { activeGlamState, glamClient, allGlamStates } = useGlam();
  const state = allGlamStates?.find(
    (s) => s.idStr === activeGlamState?.address,
  );

  const form = useForm<FormSchema>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      assets: [],
    },
  });

  // Add form change detection for browser navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  useEffect(() => {
    if (state) {
      form.reset({
        assets: (state.assets || []).map((a) => a.toBase58())
      });
    }
  }, [state]);

  const handleReset = (event: React.MouseEvent) => {
    event.preventDefault();
    form.setValue(
      "assets",
      (state?.assets || []).map((a) => a.toBase58()),
    );
  };

  const handleUpdateAssets = async (data: FormSchema) => {
    if (!state) {
      return;
    }
    const vaultAssets = (state.assets || []).map((a) => a.toBase58()).sort();
    const formAssets = data.assets.sort();
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
        assets: data.assets.map((a) => new PublicKey(a)),
      };
      const txSig = await glamClient.state.updateState(state.id!, updated);
      toast({
        title: "Jupiter assets allowlist updated",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update Jupiter assets allowlist",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsTxPending(false);
  };

  return (
    <form onSubmit={form.handleSubmit(handleUpdateAssets)} className="flex flex-col space-y-4">
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="assets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allowed Assets</FormLabel>
                <FormControl>
                  <TokenMultiSelect
                    selected={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Select the assets allowed for Jupiter swaps.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
      <FormButtons
        integrationName="Jupiter"
        onReset={handleReset}
        isLoading={isTxPending}
        isDirty={form.formState.isDirty}
        onSubmit={form.handleSubmit(handleUpdateAssets)}
      />
    </form>
  );
}
