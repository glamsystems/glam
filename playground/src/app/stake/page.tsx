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
  Form, FormControl, FormLabel, FormField, FormItem, FormMessage, FormDescription
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
import { StakeService, stakeServiceSchema, serviceOptions, TicketOrStake } from "./data/schema";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const serviceToAssetMap: { [key in StakeService["service"]]: string } = {
  Native: "SOL",
  "Marinade Native": "SOL",
  Stakepool: "SOL"
};

export type assetBalancesMap = {
  [key: string]: number;
};

export default function Stake() {
  const { fund: fundPDA, treasury, wallet, glamClient } = useGlam();

  const [ticketsAndStakes, setTicketsAndStakes] = useState<TicketOrStake[]>([]);
  const [amountInAsset, setAmountInAsset] = useState<string>("SOL");
  const [loading, setLoading] = useState<boolean>(true); // New loading state
  const [balance, setBalance] = useState<number>(NaN);
  const [assetBalances, setAssetBalances] = useState<assetBalancesMap>({});
  const [isNativeService, setIsNativeService] = useState<boolean>(false);
  const [isStakepoolService, setIsStakepoolService] = useState<boolean>(false);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);

  useEffect(() => {
    setIsNativeService(form.getValues("service") === "Native");
  }, []);

  useEffect(() => {
    setIsStakepoolService(form.getValues("service") === "Stakepool");
  }, []);

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
          type: "account" as const,
        }));

        const tickets = await glamClient.marinade.getTickets(fundPDA);

        const transformedTickets = tickets.map((ticket) => ({
          publicKey: ticket.address.toBase58(),
          lamports: ticket.lamports,
          service: "marinade",
          status: ticket.isDue ? "claimable" : "pending",
          type: "ticket" as const,
        }));

        // Define mock tickets for development purposes
        const mockTickets: TicketOrStake[] = [
          {
            publicKey: "mockPublicKey0",
            lamports: 0.1,
            service: "marinade",
            status: "claimable",
            type: "ticket",
          },
          {
            publicKey: "mockPublicKey1",
            lamports: 1,
            service: "marinade",
            status: "pending",
            type: "ticket",
          },
          {
            publicKey: "mockPublicKey2",
            lamports: 2,
            service: "jito",
            status: "claimable",
            type: "ticket",
          },
          {
            publicKey: "mockPublicKey3",
            lamports: 3,
            service: "marinade",
            status: "active",
            type: "account",
            validator: "VAL2ukPLuAfa1YpMJasn9X2y1Ag1ga5BD2VjxRf5vC5"
          },
          {
            publicKey: "mockPublicKey3",
            lamports: 3.5,
            service: "marinade",
            status: "active",
            type: "account",
            validator: "VAL2ukPLuAfa1YpMJasn9X2y1Ag1ga5BD2VjxRf5vC5"
          },
          {
            publicKey: "mockPublicKey4",
            lamports: 4,
            service: "jito",
            status: "inactive",
            type: "account",
            validator: "VALEjKwJBEw4ExyZRkC91PvLtEfNXKVY3pwEofUXUvU"
          },
          {
            publicKey: "mockPublicKey5",
            lamports: 5,
            service: "marinade",
            status: "deactivating",
            type: "account",
            validator: "VAL2ukPLuAfa1YpMJasn9X2y1Ag1ga5BD2VjxRf5vC5"
          },
          {
            publicKey: "mockPublicKey4",
            lamports: 6,
            service: "jito",
            status: "inactive",
            type: "account",
            validator: "VALEjKwJBEw4ExyZRkC91PvLtEfNXKVY3pwEofUXUvU"
          },
        ];

        setTicketsAndStakes([...transformedTickets, ...transformedStakes, ...mockTickets]);
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
      service: "Native",
      amountIn: 0,
      amountInAsset: "SOL",
      validatorAddress: "GLAMure5ErqQt7jwa8YG75kguatax2ixyDD5h5rTPH3w",
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
    const onSubmit: SubmitHandler<StakeService> = async (
      values: StakeService,
      event
    ) => {
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

      const stakeFnMap = {
        Marinade: async () => {
          return await glamClient.marinade.depositSol(
            fundPDA,
            new BN(values.amountIn * LAMPORTS_PER_SOL)
          );
        },
        "Marinade Native": async () => {
          // Implementation for Marinade Native staking
          return "Staking with Marinade Native";
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
          title: `Stake ${values.amountIn} ${values.amountInAsset}`,
          description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
        });
      } catch (error) {
        console.error(`Error staking with ${values.service}:`, error);
        toast({
          title: `Failed to stake ${values.amountIn} ${values.amountInAsset}`,
          variant: "destructive",
        });
      }
    };

    // Handle unstake
    const unstakeFnMap = {
      Marinade: async () => {
        return await glamClient.marinade.delayedUnstake(
          fundPDA,
          new BN(values.amountIn * LAMPORTS_PER_SOL)
        );
      },
      "Marinade Native": async () => {
        // Implementation for Marinade Native staking
        return "Staking with Marinade Native";
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
  };

  const handleServiceChange = (service: StakeService["service"]) => {
    form.setValue("service", service);
    setIsNativeService(service === "Native");
    setIsStakepoolService(service === "Stakepool");

    const asset = serviceToAssetMap[service];
    setAmountInAsset(asset);
    setBalance(assetBalances[asset]);
  };

  return (
    <PageContentWrapper>
      <div>
        {wallet && fundPDA ? (
          <div>
            {loading ? (
              <p>Loading tickets and stake accounts ...</p>
            ) : (
              <DataTable
                columns={columns}
                data={ticketsAndStakes}
                onOpenSheet={openSheet}
              />
            )}
          </div>
        ) : (
          <></>
        )}
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent side="right" className="p-12 sm:max-w-none w-1/2">
          <SheetHeader>
            <SheetTitle>Stake</SheetTitle>
            <SheetDescription>
              Stake SOL natively or via a Stakepool.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div>
              <FormProvider {...form}>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
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
                                  {serviceOptions?.map((option) => (
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
                        balance={balance}
                        selectedAsset={amountInAsset}
                        onSelectAsset={setAmountInAsset}
                        disableAssetChange={true}
                      />
                    </div>

                    {isStakepoolService && (
                      <div>
                        <FormField
                          control={form.control}
                          name="stakepool"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="w-fit">Stakepool</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  Select Stakepool
                                  <CaretSortIcon className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder={`Search Stakepool...`} />
                                    <CommandList>
                                    <CommandGroup>
                                      <CommandItem>Stakepool 1</CommandItem>
                                      <CommandItem>Stakepool 2</CommandItem>
                                      <CommandItem>Stakepool 3</CommandItem>
                                    </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormDescription>&nbsp;</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {isNativeService && (
                      <div className="space-x-4">
                        <FormField
                          control={form.control}
                          name="validatorAddress"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="w-full">Validator Address</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  placeholder="Enter Validator Address"
                                  className="input"
                                />
                              </FormControl>
                              <FormDescription>&nbsp;</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="flex space-x-4 w-full  mt-4">
                      <Button
                        className="w-1/2"
                        variant="ghost"
                        onClick={(event) => handleClear(event)}
                      >
                        Clear
                      </Button>
                      <Button className="w-1/2" type="submit">
                        Stake
                      </Button>
                    </div>
                  </form>
                </Form>
              </FormProvider>
            </div>
          </div>
          <SheetFooter className="mt-4">
            <SheetClose asChild></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContentWrapper>
  );
}
