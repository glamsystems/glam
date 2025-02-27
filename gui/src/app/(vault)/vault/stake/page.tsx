"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";

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
} from "@/components/ui/form";
import { BN } from "@coral-xyz/anchor";
import { toast } from "@/components/ui/use-toast";
import { AssetInput } from "@/components/AssetInput";
import React, { useState, useEffect, useMemo } from "react";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

import { useGlam } from "@glamsystems/glam-sdk/react";

import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import PageContentWrapper from "@/components/PageContentWrapper";
import {
  StakeService,
  stakeServiceSchema,
  serviceOptions,
  TicketOrStake,
} from "./data/schema";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { stakePoolsStateAccounts } from "./data/data";

export default function Stake() {
  const { activeGlamState, vault, userWallet, glamClient, jupTokenList } =
    useGlam();

  const [ticketsAndStakes, setTicketsAndStakes] = useState<TicketOrStake[]>([]);
  const [isLoadingTableData, setIsLoadingTableData] = useState<boolean>(true); // New loading state
  const [balance, setBalance] = useState<number>(NaN);

  const createSkeleton = (): TicketOrStake => ({
    publicKey: "",
    lamports: 0,
    service: "",
    validator: "",
    status: "",
    type: "ticket",
  });

  const skeletonData = useMemo(() => {
    return Array(3).fill(null).map(createSkeleton);
  }, []);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isStakepoolPopoverOpen, setIsStakepoolPopoverOpen] = useState(false);

  const stakePools = useMemo(() => {
    return stakePoolsStateAccounts.map(({ mint, stateAccount }) => {
      const jupToken = jupTokenList?.find((t) => t.address === mint);
      return {
        symbol: jupToken?.symbol || mint,
        mint,
        stateAccount,
      };
    });
  }, [jupTokenList]);

  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);

  const { data } = useQuery({
    queryKey: ["tickets-and-stakes"],
    enabled: (activeGlamState?.pubkey && vault) !== undefined,
    queryFn: () =>
      Promise.all([
        glamClient.marinade.getParsedTickets(activeGlamState!.pubkey),
        glamClient.staking.getStakeAccountsWithStates(
          new PublicKey(vault!.pubkey),
        ),
      ]),
  });
  useEffect(() => {
    if (!data || data.length !== 2) {
      return;
    }
    const [tickets, stakes] = data;
    const transformedStakes = stakes.map((stakeAccount) => {
      const { address, lamports, state, voter } = stakeAccount;
      return {
        publicKey: address.toBase58(),
        lamports: lamports,
        service: "native",
        validator: voter ? voter.toBase58() : "-",
        status: state,
        type: "stake-account" as const,
      };
    });
    const transformedTickets = tickets.map((ticket) => ({
      publicKey: ticket.address.toBase58(),
      lamports: ticket.lamports,
      service: "marinade",
      status: ticket.isDue ? "claimable" : "pending",
      type: "ticket" as const,
    }));

    setTicketsAndStakes([...transformedTickets, ...transformedStakes]);
    setIsLoadingTableData(false); // Update loading state
  }, [data]);

  useEffect(() => {
    const solBalance = Number(vault?.balanceLamports) / LAMPORTS_PER_SOL;
    setBalance(solBalance);
  }, [vault]);

  const form = useForm<StakeService>({
    resolver: zodResolver(stakeServiceSchema),
    defaultValues: {
      service: "Native Staking",
      amountIn: 0,
      amountInAsset: "SOL",
      validatorAddress: "",
      stakePool: "",
      poolTokenSymbol: "",
    },
  });

  const selectedService = form.watch("service");

  const onSubmit: SubmitHandler<StakeService> = async (
    values: StakeService,
    event,
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

    if (!userWallet.pubkey) {
      toast({
        title: "Please connected your wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!activeGlamState?.pubkey) {
      toast({
        title: "Fund not found for the connected wallet.",
        variant: "destructive",
      });
      return;
    }

    if (values.service == "Native Staking" && !values.validatorAddress) {
      toast({
        title: "Please enter a validator address.",
        variant: "destructive",
      });
      return;
    }

    if (values.service == "Liquid Staking" && !values.stakePool) {
      toast({
        title: "Please select a stake pool.",
        variant: "destructive",
      });
      return;
    }

    const stakeFnMap: any = {
      "Native Staking": async () => {
        return await glamClient.staking.initializeAndDelegateStake(
          activeGlamState.pubkey,
          new PublicKey(values.validatorAddress!),
          new BN(values.amountIn * LAMPORTS_PER_SOL),
        );
      },
      "Liquid Staking": async () => {
        if (values.poolTokenSymbol === "mSOL") {
          return await glamClient.marinade.deposit(
            activeGlamState.pubkey,
            new BN(values.amountIn * LAMPORTS_PER_SOL),
          );
        }
        // Other LSTs
        const stateAccount = new PublicKey(values.stakePool!);
        return await glamClient.staking.stakePoolDepositSol(
          activeGlamState.pubkey,
          stateAccount,
          new BN(values.amountIn * LAMPORTS_PER_SOL),
        );
      },
      "Marinade Native": async () => {
        // TODO: Implementation for Marinade Native staking
        return "Staking with Marinade Native";
      },
    };
    try {
      const txId = await stakeFnMap[values.service]();
      toast({
        title: `Staked ${values.amountIn} ${values.amountInAsset}`,
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

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
  };

  return (
    <PageContentWrapper>
      <div>
        <DataTable
          columns={columns}
          data={isLoadingTableData ? skeletonData : ticketsAndStakes}
          onOpenSheet={openSheet}
        />
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent side="right" className="p-12 sm:max-w-none w-1/2">
          <SheetHeader>
            <SheetTitle>Stake</SheetTitle>
            <SheetDescription>
              Stake SOL natively or to a stake pool to earn rewards.
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
                                  form.setValue(
                                    "service",
                                    value as StakeService["service"],
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
                          </FormItem>
                        )}
                      />
                      <AssetInput
                        className="min-w-1/2 w-1/2"
                        name="amountIn"
                        label="Amount"
                        balance={balance}
                        selectedAsset="SOL"
                        disableAssetChange={true}
                      />
                    </div>

                    {selectedService === "Native Staking" && (
                      <div className="space-x-4">
                        <FormField
                          control={form.control}
                          name="validatorAddress"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="w-full">
                                Validator Address
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  placeholder="Enter Validator Address"
                                  className="input"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {selectedService === "Liquid Staking" && (
                      <div>
                        <FormField
                          control={form.control}
                          name="stakePool"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="w-fit">
                                Stake Pool
                              </FormLabel>
                              <Popover
                                open={isStakepoolPopoverOpen}
                                onOpenChange={setIsStakepoolPopoverOpen}
                              >
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value &&
                                      form.getValues("poolTokenSymbol")
                                        ? `${form.getValues("poolTokenSymbol")} - ${field.value}`
                                        : "Select a stake pool"}
                                      <CaretSortIcon className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-full p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput
                                      placeholder={`Search stake pool...`}
                                    />
                                    <CommandList>
                                      <CommandGroup>
                                        {(stakePools || []).map(
                                          ({ symbol, mint, stateAccount }) => (
                                            <CommandItem
                                              key={mint}
                                              onSelect={() => {
                                                form.setValue(
                                                  "stakePool",
                                                  stateAccount?.toBase58(),
                                                );
                                                form.setValue(
                                                  "poolTokenSymbol",
                                                  symbol,
                                                );
                                                setIsStakepoolPopoverOpen(
                                                  false,
                                                );
                                              }}
                                            >
                                              {`${symbol} - ${stateAccount}`}
                                            </CommandItem>
                                          ),
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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
