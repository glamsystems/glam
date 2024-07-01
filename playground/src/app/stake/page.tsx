"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { AssetInput } from "@/components/AssetInput";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import React, { useState, useEffect } from "react";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

import { PublicKey } from "@solana/web3.js";
import { GlamClient } from "@glam/anchor";

import { testFund } from "../testFund";
import { testTickets } from "./data/testTickets";

const glamClient = new GlamClient();

const stakeSchema = z.object({
  service: z.enum(["Marinade", "Jito"]),
  amountIn: z.number().nonnegative(),
  amountInAsset: z.string(),
});

type StakeSchema = z.infer<typeof stakeSchema>;

const serviceToAssetMap: { [key in StakeSchema["service"]]: string } = {
  Marinade: "mSOL",
  Jito: "jitoSOL",
};

export default function Stake() {
  const [amountInAsset, setAmountInAsset] = useState<string>("SOL");
  const [mode, setMode] = useState<string>("stake");

  const form = useForm<StakeSchema>({
    resolver: zodResolver(stakeSchema),
    defaultValues: {
      service: "Marinade",
      amountIn: 0,
      amountInAsset: "SOL",
    },
  });

  const onSubmit: SubmitHandler<StakeSchema> = (values, event) => {
    const nativeEvent = event as unknown as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };

    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") === "submit") {
      const fundPDA = new PublicKey(testFund.fundPDA);
      console.log(fundPDA.toBase58());

      const updatedValues = {
        ...values,
        amountInAsset,
        mode,
      };

      toast({
        title: `You submitted the following ${mode}:`,
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-zinc-900 p-4">
            <code className="text-white">
              {JSON.stringify(updatedValues, null, 2)}
            </code>
          </pre>
        ),
      });
    }
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    form.reset();
    setAmountInAsset("SOL");
    setMode("stake");
  };

  const handleServiceChange = (service: StakeSchema["service"]) => {
    form.setValue("service", service);
    if (mode === "unstake") {
      const correspondingAsset = serviceToAssetMap[service];
      setAmountInAsset(correspondingAsset);
    }
  };

  useEffect(() => {
    if (mode === "stake") {
      setAmountInAsset("SOL");
    } else {
      const service = form.getValues("service");
      const correspondingAsset = serviceToAssetMap[service];
      setAmountInAsset(correspondingAsset);
    }
  }, [mode, form]);

  const handleModeChange = (value: string) => {
    if (value) {
      setMode(value);
    }
  };

  return (
    <div className="flex flex-col justify-center w-full  mt-16">
      <div className="w-1/2 self-center">
        <FormProvider {...form}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 w-full"
            >
              <div>
                <FormItem>
                  <FormLabel>Mode</FormLabel>
                  <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={handleModeChange}
                    className="flex space-x-2"
                  >
                    <ToggleGroupItem
                      value="stake"
                      aria-label="Stake"
                      className="grow"
                    >
                      Stake
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="unstake"
                      aria-label="Unstake"
                      className="grow"
                    >
                      Unstake
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormItem>
              </div>

              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem className="w-1/2">
                      <FormLabel>Service</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) =>
                            handleServiceChange(value as StakeSchema["service"])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Service" />
                          </SelectTrigger>
                          <SelectContent>
                            {stakeSchema.shape.service._def.values.map(
                              (option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <AssetInput
                  className="min-w-1/2 w-1/2"
                  name="amountIn"
                  label="Amount"
                  balance={100}
                  selectedAsset={amountInAsset}
                  onSelectAsset={setAmountInAsset}
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
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              </div>
            </form>
          </Form>
        </FormProvider>
      </div>
      <div className="flex w-1/2 mt-16 self-center">
        <DataTable data={testTickets} columns={columns} />
      </div>
    </div>
  );
}
