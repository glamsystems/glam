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
import { SlippageInput } from "@/components/SlippageInput";

const formSchema = z.object({
  assets: z.array(z.string()),
  maxSlippage: z.union([z.number().nonnegative(), z.literal("NA")]),
  maxSlippageUnit: z.enum(["BPS", "%"]),
});

type FormSchema = z.infer<typeof formSchema>;

export default function JupiterPoliciesPage() {
  const [isTxPending, setIsTxPending] = useState(false);
  const { activeGlamState, glamClient, allGlamStates } = useGlam();
  const [currentMaxSlippageBps, setCurrentMaxSlippageBps] = useState<
    number | "NA"
  >("NA");
  const glamState = allGlamStates?.find(
    (s) => s.idStr === activeGlamState?.address,
  );

  const form = useForm<FormSchema>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      assets: [],
      maxSlippage: "NA",
      maxSlippageUnit: "BPS",
    },
  });

  // Add form change detection for browser navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  useEffect(() => {
    (async () => {
      if (!glamState) return;

      form.setValue(
        "assets",
        (glamState.assets || []).map((a) => a.toBase58()),
      );
      const glamStateAccount = await glamClient.fetchStateAccount(
        glamState.id!,
      );

      console.log("glam state params", glamStateAccount.params[0]);
      glamStateAccount.params[0].forEach((param) => {
        const name = Object.keys(param.name)[0];
        const value = Object.values(param.value)[0].val;
        if (name === "maxSwapSlippageBps") {
          setCurrentMaxSlippageBps(Number(value));
          form.setValue("maxSlippage", Number(value));
        }
      });
      form.setValue("maxSlippageUnit", "BPS");
    })();
  }, [glamState]);

  const handleReset = (event: React.MouseEvent) => {
    event.preventDefault();
    form.reset({
      assets: (glamState?.assets || []).map((a) => a.toBase58()),
      maxSlippage: currentMaxSlippageBps,
      maxSlippageUnit: "BPS",
    });
  };

  const onSubmitForm = async (data: FormSchema) => {
    if (!glamState) {
      return;
    }
    const vaultAssets = (glamState.assets || [])
      .map((a) => a.toBase58())
      .sort();
    const formAssets = data.assets.sort();

    const maxSlippageNotChanged =
      data.maxSlippage === "NA" || data.maxSlippage === currentMaxSlippageBps;
    if (
      (glamState.assets || []).length === formAssets.length &&
      vaultAssets.every((value, index) => value === formAssets[index]) &&
      maxSlippageNotChanged
    ) {
      toast({
        title: "No changes detected",
        description: "No changes were detected in the policies.",
      });
      return;
    }

    // Skip slippage update if NA is selected
    const preInstructions = [];
    if (data.maxSlippage !== "NA") {
      const maxSlippageBps =
        data.maxSlippage * (data.maxSlippageUnit === "%" ? 100 : 1);
      const setMaxSlippageIx =
        await glamClient.jupiterSwap.setMaxSwapSlippageIx(
          glamState.id!,
          maxSlippageBps,
        );
      console.log("setMaxSlippage:", maxSlippageBps);
      preInstructions.push(setMaxSlippageIx);
    }

    setIsTxPending(true);
    try {
      const updated = {
        assets: data.assets.map((a) => new PublicKey(a)),
      };
      const txSig = await glamClient.state.updateState(glamState.id!, updated, {
        preInstructions,
      });

      toast({
        title: "Jupiter swap policies updated",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update Jupiter swap policies",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsTxPending(false);
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
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

          <SlippageInput
            name="maxSlippage"
            label="Max Slippage"
            step="1"
            symbol={form.watch("maxSlippageUnit")}
            description="The maximum slippage allowed for Jupiter swaps (NA means not set)."
          />
        </div>
        <FormButtons
          integrationName="Jupiter"
          onReset={handleReset}
          isLoading={isTxPending}
          isDirty={form.formState.isDirty}
          onSubmit={form.handleSubmit(onSubmitForm)}
        />
      </div>
    </Form>
  );
}
