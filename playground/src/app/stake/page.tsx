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

import { useGlam, JITO_STAKE_POOL } from "@glam/anchor/react";

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

export default function Stake() {
  const { fund: fundPDA, treasury, wallet, glamClient } = useGlam();

  const [ticketsAndStakes, setTicketsAndStakes] = useState<TicketOrStake[]>([]);
  const [isLoadingTableData, setIsLoadingTableData] = useState<boolean>(true); // New loading state
  const [balance, setBalance] = useState<number>(NaN);

  const [isNativeService, setIsNativeService] = useState<boolean>(true);
  const [isStakepoolService, setIsStakepoolService] = useState<boolean>(false);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isStakepoolPopoverOpen, setIsStakepoolPopoverOpen] = useState(false);
  const [selectedStakepool, setSelectedStakepool] = useState<string | null>(
    null
  );

  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);

  const { data } = useQuery({
    queryKey: ["tickets-and-stakes"],
    enabled: (fundPDA && treasury) !== undefined,
    queryFn: () =>
      Promise.all([
        glamClient.marinade.getTickets(fundPDA!),
        glamClient.staking.getStakeAccountsWithStates(
          new PublicKey(treasury!.address)
        ),
      ]),
  });
  useEffect(() => {
    if (!data || data.length !== 2) {
      return;
    }
    const [tickets, stakes] = data;
    const transformedStakes = stakes.map((stakeAccount) => ({
      publicKey: stakeAccount.address.toBase58(),
      lamports: stakeAccount.lamports,
      service: "native",
      validator: " ",
      status: stakeAccount.state,
      type: "account" as const,
    }));
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
    const solBalance = Number(treasury?.balanceLamports) / LAMPORTS_PER_SOL;
    setBalance(solBalance);
  }, [treasury]);

  const form = useForm<StakeService>({
    resolver: zodResolver(stakeServiceSchema),
    defaultValues: {
      service: "Native",
      amountIn: 0,
      amountInAsset: "SOL",
      validatorAddress: "GLAMure5ErqQt7jwa8YG75kguatax2ixyDD5h5rTPH3w",
      stakepool: "",
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

    if (values.service == "Native" && !values.validatorAddress) {
      toast({
        title: "Please enter a validator address.",
        variant: "destructive",
      });
      return;
    }

    if (values.service == "Stakepool" && !selectedStakepool) {
      toast({
        title: "Please select a stakepool.",
        variant: "destructive",
      });
      return;
    }

    const stakeFnMap: any = {
      Native: async () => {
        return await glamClient.staking.initializeAndDelegateStake(
          fundPDA,
          new PublicKey(values.validatorAddress!),
          // new PublicKey("J2nUHEAgZFRyuJbFjdqPrAa9gyWDuc7hErtDQHPhsYRp"), // phantom validator
          new BN(values.amountIn * LAMPORTS_PER_SOL)
        );
      },
      "Marinade Native": async () => {
        // TODO: Implementation for Marinade Native staking
        return "Staking with Marinade Native";
      },
      Stakepool: async () => {
        if (selectedStakepool === "Jito") {
          return await glamClient.staking.stakePoolDepositSol(
            fundPDA,
            JITO_STAKE_POOL,
            new BN(values.amountIn * LAMPORTS_PER_SOL)
          );
        }
        if (selectedStakepool === "Marinade") {
          return await glamClient.marinade.depositSol(
            fundPDA,
            new BN(values.amountIn * LAMPORTS_PER_SOL)
          );
        }
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

  const handleSelect = (stakepool: string) => {
    setSelectedStakepool(stakepool);
    setIsStakepoolPopoverOpen(false); // Close the dropdown
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
  };

  const handleServiceChange = (service: StakeService["service"]) => {
    form.setValue("service", service);
    setIsNativeService(service === "Native");
    setIsStakepoolService(service === "Stakepool");
  };

  return (
    <PageContentWrapper>
      <div>
        {wallet && fundPDA ? (
          <DataTable
            columns={columns}
            data={ticketsAndStakes}
            isLoadingData={isLoadingTableData}
            onOpenSheet={openSheet}
          />
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

                    {isNativeService && (
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

                    {isStakepoolService && (
                      <div>
                        <FormField
                          control={form.control}
                          name="stakepool"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="w-fit">Stakepool</FormLabel>
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
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {selectedStakepool || "Select Stakepool"}
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
                                      placeholder={`Search Stakepool...`}
                                    />
                                    <CommandList>
                                      <CommandGroup>
                                        <CommandItem
                                          onSelect={() => handleSelect("Jito")}
                                        >
                                          Jito
                                        </CommandItem>
                                        <CommandItem
                                          onSelect={() =>
                                            handleSelect("Marinade")
                                          }
                                        >
                                          Marinade
                                        </CommandItem>
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
