"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {useForm, SubmitHandler, FormProvider, get} from "react-hook-form";
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
import { BN } from "@coral-xyz/anchor";
import { toast } from "@/components/ui/use-toast";
import { AssetInput } from "@/components/AssetInput";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import React, { useState, useEffect } from "react";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

import { useGlamClient } from "@glam/anchor";

import { testFund } from "../testFund";
import { ExplorerLink } from "@/components/ExplorerLink";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";

const stakeSchema = z.object({
  service: z.enum(["Marinade"]),
  amountIn: z.number().nonnegative(),
  amountInAsset: z.string(),
});

type StakeSchema = z.infer<typeof stakeSchema>;

const serviceToAssetMap: { [key in StakeSchema["service"]]: string } = {
  Marinade: "mSOL",
  //Jito: "jitoSOL",
};

export const ticketSchema = z.object({
  publicKey: z.string(),
  service: z.string(),
  status: z.string(),
  label: z.string(),
});

export type Ticket = z.infer<typeof ticketSchema>;

export default function Stake() {
  const [marinadeTicket, setMarinadeTicket] = useState<Ticket[]>([]);
  const [amountInAsset, setAmountInAsset] = useState<string>("SOL");
  const [mode, setMode] = useState<string>("stake");
  const [loading, setLoading] = useState<boolean>(true); // New loading state
  const glamClient = useGlamClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tickets = await glamClient.marinade.getExistingTickets(testFund.fundPDA);
        const transformedTickets = tickets.map(ticket => ({
          publicKey: ticket.toBase58(),
          service: "marinade",
          status: "claimable",
          label: "lst",
        }));
        setMarinadeTicket(transformedTickets);
        console.log(transformedTickets);
      } catch (error) {
        console.error('Error fetching marinade tickets:', error);
      } finally {
        setLoading(false); // Update loading state
      }
    };

    fetchData();
  }, [glamClient, testFund.fundPDA]);

  const form = useForm<StakeSchema>({
    resolver: zodResolver(stakeSchema),
    defaultValues: {
      service: "Marinade",
      amountIn: 0,
      amountInAsset: "SOL",
    },
  });

  const onSubmit: SubmitHandler<StakeSchema> = async (values, event) => {
    const nativeEvent = event as unknown as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };

    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") === "submit") {
      const stakingService = values.service.toLowerCase();
      let txId;

      if (mode === "stake") {
        if (values.amountIn === 0) {
          toast({
            title: "Please enter an amount greater than 0.", variant: "destructive",
          })
        } else {
          txId = await glamClient[stakingService].stake(testFund.fundPDA, new BN(values.amountIn * LAMPORTS_PER_SOL));

          toast({
            title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} ${values.amountIn} ${values.amountInAsset}`, description: <ExplorerLink path={`tx/${txId}`} label={txId}/>,
          });
        }
      } else {
        if (values.amountIn === 0) {
          toast({
            title: "Please enter an amount greater than 0.", variant: "destructive",
          })
        } else {
          txId = await glamClient[stakingService].delayedUnstake(testFund.fundPDA, new BN(values.amountIn * LAMPORTS_PER_SOL));

          toast({
            title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} ${values.amountIn} ${values.amountInAsset}`, description: <ExplorerLink path={`tx/${txId}`} label={txId}/>,
          });
        }
      }
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
    <div className="flex flex-col justify-center w-full mt-16">
      <div className="w-1/2 self-center">
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
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
                          onValueChange={(value) => handleServiceChange(value as StakeSchema["service"])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Service" />
                          </SelectTrigger>
                          <SelectContent>
                            {stakeSchema.shape.service._def.values.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
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
                  disableAssetChange={true}
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
        {loading ? (
          <p>Loading Tickets...</p>
        ) : (<div className="w-full">
            <DataTable data={marinadeTicket} columns={columns}/>
          </div>)}
      </div>
    </div>);
}
