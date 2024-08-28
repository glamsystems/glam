"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FormProvider, get } from "react-hook-form";

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

import { useGlam, JITO_STAKE_POOL, MSOL, JITOSOL } from "@glam/anchor/react";

import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import PageContentWrapper from "@/components/PageContentWrapper";
import { StakeService, stakeServiceSchema, TicketOrStake } from "./data/schema";

const serviceToAssetMap: { [key in StakeService["service"]]: string } = {
  Marinade: "mSOL",
  Native: "SOL",
  Jito: "jitoSOL",
};

export type assetBalancesMap = {
  [key: string]: number;
};

export default function Stake() {
  const { fund: fundPDA, treasury, wallet, glamClient } = useGlam();

  const [ticketsAndStakes, setTicketsAndStakes] = useState<TicketOrStake[]>([]);
  const [amountInAsset, setAmountInAsset] = useState<string>("SOL");
  const [mode, setMode] = useState<string>("stake");
  const [loading, setLoading] = useState<boolean>(true); // New loading state
  const [balance, setBalance] = useState<number>(NaN);
  const [assetBalances, setAssetBalances] = useState<assetBalancesMap>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!fundPDA || !treasury) {
        return;
      }
      try {
        const stakes = await glamClient.staking.getStakeAccountsWithStates(
          new PublicKey(treasury.address)
        );
        const transformedStakes = stakes.map((stakeAccount) => ({
          publicKey: stakeAccount.address.toBase58(),
          lamports: stakeAccount.lamports,
          service: "native",
          status: stakeAccount.state,
          label: "stake",
        }));

        const tickets = await glamClient.marinade.getTickets(fundPDA);
        const transformedTickets = tickets.map((ticket) => ({
          publicKey: ticket.address.toBase58(),
          lamports: ticket.lamports,
          service: "marinade",
          status: ticket.isDue ? "claimable" : "pending",
          label: "ticket",
        }));

        setTicketsAndStakes(transformedTickets.concat(transformedStakes));
      } catch (error) {
        console.error("Error fetching marinade tickets:", error);
      } finally {
        setLoading(false); // Update loading state
      }

      if (Object.keys(assetBalances).length === 0) {
        const assetBalances = {
          SOL: Number(treasury?.balanceLamports) / LAMPORTS_PER_SOL,
          mSOL: Number(
            treasury?.tokenAccounts?.find((ta) => ta.mint === MSOL.toBase58())
              ?.uiAmount
          ),
          jitoSOL: Number(
            treasury?.tokenAccounts?.find(
              (ta) => ta.mint === JITOSOL.toBase58()
            )?.uiAmount
          ),
        };

        setBalance(assetBalances["SOL"]);
        setAssetBalances(assetBalances);
      }
    };

    fetchData();
  }, [glamClient, treasury, fundPDA]);

  const form = useForm<StakeService>({
    resolver: zodResolver(stakeServiceSchema),
    defaultValues: {
      service: "Marinade",
      amountIn: 0,
      amountInAsset: "SOL",
    },
  });

  const onSubmit: SubmitHandler<StakeService> = async (
    values: StakeService,
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

    if (!wallet) {
      toast({
        title: "Please connected your wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!fundPDA) {
      toast({
        title: "Fund not found for the connected wallet.",
        variant: "destructive",
      });
      return;
    }

    // Handle stake
    if (mode === "stake") {
      const stakeFnMap = {
        Marinade: async () => {
          return await glamClient.marinade.depositSol(
            fundPDA,
            new BN(values.amountIn * LAMPORTS_PER_SOL)
          );
        },
        Jito: async () => {
          return await glamClient.staking.stakePoolDepositSol(
            fundPDA,
            JITO_STAKE_POOL,
            new BN(values.amountIn * LAMPORTS_PER_SOL)
          );
        },
        Native: async () => {
          return await glamClient.staking.initializeAndDelegateStake(
            fundPDA,
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
          fundPDA,
          new BN(values.amountIn * LAMPORTS_PER_SOL)
        );
      },
      Jito: async () => {
        return await glamClient.staking.stakePoolWithdrawStake(
          fundPDA,
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

  const handleServiceChange = (service: StakeService["service"]) => {
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
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <div>
          <FormProvider {...form}>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="flex">
                  <FormItem className="w-full">
                    <FormLabel>Mode</FormLabel>
                    <ToggleGroup
                      type="single"
                      value={mode}
                      onValueChange={handleModeChange}
                      className="flex space-x-4"
                    >
                      <ToggleGroupItem
                        value="stake"
                        aria-label="Stake"
                        className="w-1/2"
                      >
                        Stake
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="unstake"
                        aria-label="Unstake"
                        className="w-1/2"
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
                              handleServiceChange(
                                value as StakeService["service"]
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Service" />
                            </SelectTrigger>
                            <SelectContent>
                              {stakeServiceSchema.shape.service._def.values.map(
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

                <div className="flex space-x-4 w-full  mt-4">
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
        {wallet && fundPDA ? (
          <div className="flex mt-16 self-center">
            {loading ? (
              <p>Loading tickets and stake accounts ...</p>
            ) : (
              <DataTable data={ticketsAndStakes} columns={columns} />
            )}
          </div>
        ) : (
          <></>
        )}
      </div>
    </PageContentWrapper>
  );
}
