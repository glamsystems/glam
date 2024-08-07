"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FormProvider, get } from "react-hook-form";
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

import { useGlamClient, JITO_STAKE_POOL, MSOL, JITOSOL } from "@glam/anchor";

import { testFund } from "../testFund";
import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const stakeSchema = z.object({
  service: z.enum(["Marinade", "Native", "Jito"]),
  amountIn: z.number().nonnegative(),
  amountInAsset: z.string(),
});

type StakeSchema = z.infer<typeof stakeSchema>;

const serviceToAssetMap: { [key in StakeSchema["service"]]: string } = {
  Marinade: "mSOL",
  Native: "SOL",
  Jito: "jitoSOL",
};

export const ticketSchema = z.object({
  publicKey: z.string(),
  service: z.string(),
  status: z.string(),
  label: z.string(),
});

export type Ticket = z.infer<typeof ticketSchema>;

export type assetBalancesMap = {
  [key: string]: number;
};

export default function Stake() {
  const [marinadeTicket, setMarinadeTicket] = useState<Ticket[]>([]);
  const [amountInAsset, setAmountInAsset] = useState<string>("SOL");
  const [mode, setMode] = useState<string>("stake");
  const [loading, setLoading] = useState<boolean>(true); // New loading state
  const [balance, setBalance] = useState<number>(NaN);
  const [assetBalances, setAssetBalances] = useState<assetBalancesMap>({});
  const glamClient = useGlamClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: fetch stake accounts
        const tickets = await glamClient.marinade.getExistingTickets(
          testFund.fundPDA
        );
        const transformedTickets = tickets.map((ticket) => ({
          publicKey: ticket.toBase58(),
          service: "marinade",
          status: "claimable",
          label: "liquid",
        }));
        setMarinadeTicket(transformedTickets);
        console.log(transformedTickets);
      } catch (error) {
        console.error("Error fetching marinade tickets:", error);
      } finally {
        setLoading(false); // Update loading state
      }

      if (Object.keys(assetBalances).length === 0) {
        const assetBalances = {
          SOL: await glamClient.getTreasuryBalance(testFund.fundPDA),
          mSOL: await glamClient.getTreasuryTokenBalance(
            testFund.fundPDA,
            MSOL
          ),
          jitoSOL: await glamClient.getTreasuryTokenBalance(
            testFund.fundPDA,
            JITOSOL
          ),
        };

        setBalance(assetBalances["SOL"]);
        setAssetBalances(assetBalances);
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

  const onSubmit: SubmitHandler<StakeSchema> = async (
    values: StakeSchema,
    event
  ) => {
    const nativeEvent = event as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };

    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") !== "submit") {
      return;
    }

    if (values.amountIn === 0) {
      toast({
        title: "Please enter an amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    // Handle stake
    if (mode === "stake") {
      const stakeFnMap = {
        Marinade: async () => {
          return await glamClient.marinade.stake(
            testFund.fundPDA,
            new BN(values.amountIn * LAMPORTS_PER_SOL)
          );
        },
        Jito: async () => {
          return await glamClient.staking.stakePoolDepositSol(
            testFund.fundPDA,
            JITO_STAKE_POOL,
            new BN(values.amountIn * LAMPORTS_PER_SOL)
          );
        },
        Native: async () => {
          return await glamClient.staking.nativeStakeDeposit(
            testFund.fundPDA,
            new PublicKey("J2nUHEAgZFRyuJbFjdqPrAa9gyWDuc7hErtDQHPhsYRp"), // phantom validator
            new BN(values.amountIn * LAMPORTS_PER_SOL)
          );
        },
      };
      try {
        const txId = await stakeFnMap[values.service]();
        toast({
          title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} ${
            values.amountIn
          } ${values.amountInAsset}`,
          description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
        });
      } catch (error) {
        console.error(`Error staking with ${values.service}:`, error);
        toast({
          title: `Failed to ${mode} ${values.amountIn} ${values.amountInAsset}`,
          variant: "destructive",
        });
      }

      return;
    }

    // Handle unstake
    const unstakeFnMap = {
      Marinade: async () => {
        return await glamClient.marinade.delayedUnstake(
          testFund.fundPDA,
          new BN(values.amountIn * LAMPORTS_PER_SOL)
        );
      },
      Jito: async () => {
        return await glamClient.staking.stakePoolWithdrawStake(
          testFund.fundPDA,
          JITO_STAKE_POOL,
          new BN(values.amountIn * LAMPORTS_PER_SOL)
        );
      },
      Native: async () => {
        throw new Error("Native unstake not needed");
      },
    };
    try {
      const txId = await unstakeFnMap[values.service]();
      toast({
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} ${
          values.amountIn
        } ${values.amountInAsset}`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      console.error(`Error unstaking with ${values.service}:`, error);
    }
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
    setAmountInAsset("SOL");
    setMode("stake");
  };

  const handleServiceChange = (service: StakeSchema["service"]) => {
    form.setValue("service", service);
    if (mode === "unstake") {
      const asset = serviceToAssetMap[service];
      setAmountInAsset(asset);
      setBalance(assetBalances[asset]);
    } else {
      setBalance(assetBalances["SOL"]);
    }
  };

  const handleModeChange = (value: string) => {
    if (!value) {
      return;
    }
    setMode(value);
    if (value == "stake") {
      setAmountInAsset("SOL");
      setBalance(assetBalances["SOL"]);
    } else if (value === "unstake") {
      const service = form.getValues("service");
      const asset = serviceToAssetMap[service];
      setAmountInAsset(asset);
      setBalance(assetBalances[asset]);
    }
  };

  return (
    <div className="flex flex-col justify-center w-full mt-16">
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
                  balance={balance}
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
        ) : (
          <div className="w-full">
            <DataTable data={marinadeTicket} columns={columns} />
          </div>
        )}
      </div>
    </div>
  );
}
