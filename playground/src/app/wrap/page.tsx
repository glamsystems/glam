"use client";

import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { AssetInput } from "@/components/AssetInput";
import { Button } from "@/components/ui/button";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGlamClient } from "@glam/anchor";
import { BN } from "@coral-xyz/anchor";
import { testFund } from "@/app/testFund";
import { ExplorerLink } from "@/components/ExplorerLink";
import { useCluster } from "@/components/solana-cluster-provider";

const wrapSchema = z.object({
  direction: z.enum(["wrap", "unwrap"]),
  amount: z.number().nonnegative(),
  amountAsset: z.string(),
});

type WrapSchema = z.infer<typeof wrapSchema>;

export default function Wrap() {
  const glamClient = useGlamClient();
  const cluster = useCluster();
  console.log(cluster);
  const [amountAsset, setAmountAsset] = useState<string>("SOL");
  const [direction, setDirection] = useState<string>("wrap");

  const form = useForm<WrapSchema>({
    resolver: zodResolver(wrapSchema),
    defaultValues: {
      direction: "wrap",
      amount: 0,
      amountAsset: "SOL",
    },
  });

  const onSubmit: SubmitHandler<WrapSchema> = async (values, _event) => {
    let txId;
    if (direction === "wrap") {
      txId = await glamClient.wsol.wrap(
        testFund.fundPDA,
        new BN(values.amount * 1_000_000_000)
      );
    } else {
      // Unwrap means unwrap all, there's no amount
      txId = await glamClient.wsol.unwrap(testFund.fundPDA);
    }

    toast({
      title: `Successful ${direction}`,
      description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
    });
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    form.reset();
    setAmountAsset("SOL");
    setDirection("wrap");
  };

  const handleDirectionChange = (value: string) => {
    if (value) {
      form.setValue("direction", value as "wrap" | "unwrap");
      setDirection(value);
      setAmountAsset(value === "wrap" ? "SOL" : "wSOL");
    }
  };

  useEffect(() => {
    form.setValue("amountAsset", amountAsset);
  }, [amountAsset, form]);

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
              balance={100}
              selectedAsset={amountAsset}
              onSelectAsset={setAmountAsset}
              disableAssetChange={true}
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
