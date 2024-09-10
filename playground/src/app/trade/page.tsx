"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  SubmitHandler,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { CaretSortIcon, CheckIcon, ColumnSpacingIcon } from "@radix-ui/react-icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Asset, AssetInput } from "@/components/AssetInput";
import React, { useState, useEffect, useMemo } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { MSOL, useGlam, WSOL } from "@glam/anchor/react";
import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const markets = [
  { label: "SOL/USDC", value: "SOL-USDC" },
] as const;

const swapSchema = z.object({
  venue: z.enum(["Jupiter"]),
  type: z.enum(["Swap"]),
  slippage: z.number().nonnegative().lte(1),
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one exchange.",
  }),
  exactMode: z.enum(["ExactIn", "ExactOut"]),
  maxAccounts: z.number().nonnegative().int(),
  from: z.number(),
  fromAsset: z.string(),
  to: z.number(),
  toAsset: z.string(),
  directRouteOnly: z.boolean().optional(),
  useWSOL: z.boolean().optional(),
  versionedTransactions: z.boolean().optional(),
});

const spotSchema = z.object({
  venue: z.enum(["Jupiter", "Drift"]),
  market: z.enum(["SOL-USDC"]),
  type: z.enum(["Limit","Stop Limit"]),
  side: z.enum(["Buy","Sell"]),
  limitPrice: z.number().nonnegative(),
  size: z.number().nonnegative(),
  notional: z.number().nonnegative(),
  triggerPrice: z.number().nonnegative().optional(),
  reduceOnly: z.boolean().optional(),
  post: z.boolean().optional(),
  showConfirmation: z.boolean().optional(),
});

const perpsSchema = z.object({
  venue: z.enum(["Drift"]),
  type: z.enum(["Limit"]),
});

type SwapSchema = z.infer<typeof swapSchema>;
type SpotSchema = z.infer<typeof spotSchema>;
type PerpsSchema = z.infer<typeof perpsSchema>;

export default function Trade() {
  const { fund: fundPDA, treasury, wallet, glamClient, tokenList } = useGlam();
  const [fromAsset, setFromAsset] = useState<string>("SOL");
  const [toAsset, setToAsset] = useState<string>("SOL");
  const [items, setItems] = useState<{ id: string; label: string }[]>([
    {
      id: "meteora",
      label: "Meteora",
    },
    {
      id: "meteora-dlmm",
      label: "Meteora DLMM",
    },
    {
      id: "raydium",
      label: "Raydium",
    },
    {
      id: "raydium-clmm",
      label: "Raydium CLMM",
    },
    {
      id: "raydium-cp",
      label: "Raydium CP",
    },
    {
      id: "whirlpool",
      label: "Whirlpool",
    },
  ] as const);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(
          "https://quote-api.jup.ag/v6/program-id-to-label"
        );
        const data = await response.json();
        const formattedItems = Object.entries(data).map(([id, label]) => ({
          id,
          label: label as string,
        }));

        // Sort the items alphabetically by label
        const sortedItems = formattedItems.sort((a, b) =>
          a.label.localeCompare(b.label)
        );

        setItems(sortedItems);
      } catch (error) {
        console.error("Error fetching program ID to label mapping:", error);
        // If there's an error, we'll keep using the default items
      }
    };

    fetchItems();
  }, []);

  const [filterType, setFilterType] = useState("include");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fromAssetList = useMemo(() => {
    const assets =
      treasury?.tokenAccounts.map((ta) => {
        const name =
          tokenList?.find((t: any) => t.address === ta.mint)?.name || "Unknown";
        const symbol =
          tokenList?.find((t: any) => t.address === ta.mint)?.symbol || ta.mint;
        return {
          name,
          symbol: symbol === "SOL" ? "wSOL" : symbol,
          address: ta.mint,
          decimals: ta.decimals,
          balance: Number(ta.uiAmount),
        } as Asset;
      }) || [];
    assets.push({
      name: "Solana",
      symbol: "SOL",
      address: "",
      decimals: 9,
      balance: (treasury?.balanceLamports || 0) / LAMPORTS_PER_SOL,
    });
    return assets;
  }, [treasury, tokenList]);

  const swapForm = useForm<SwapSchema>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      venue: "Jupiter",
      type: "Swap",
      slippage: 0.1,
      items: ["meteora"],
      exactMode: "ExactIn",
      maxAccounts: 20,
      from: 0,
      to: 0,
      directRouteOnly: false,
      useWSOL: false,
      versionedTransactions: false,
    },
  });

  const spotForm = useForm<SpotSchema>({
    resolver: zodResolver(spotSchema),
    defaultValues: {
      venue: "Drift",
      market: "SOL-USDC",
      type: "Limit",
      side: "Buy",
      limitPrice: 0,
      size: 0,
      notional: 0,
      triggerPrice: 0,
      reduceOnly: false,
      post: false,
      showConfirmation: true
    }
  });

  const orderType = spotForm.watch("type");

  const onSubmit: SubmitHandler<SwapSchema> = async (values, event) => {
    const nativeEvent = event as unknown as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };

    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") !== "submit") {
      return;
    }

    if (!fundPDA || !wallet || !treasury) {
      return;
    }

    const updatedValues = {
      ...values,
      fromAsset,
      toAsset,
    };
    console.log("Submit Trade:", updatedValues);
    const { address: inputMint, decimals } =
      tokenList?.find((t) => {
        if (fromAsset === "wSOL") {
          return t.symbol === "SOL";
        }
        return t.symbol === fromAsset;
      }) || {};

    const outputMint = tokenList?.find((t) => t.symbol === toAsset)?.address;
    if (!inputMint || !outputMint) {
      toast({
        title: "Invalid input/output mint",
        variant: "destructive",
      });
      return;
    }

    if (!decimals) {
      toast({
        title: "Unknown decimals of the input mint",
        variant: "destructive",
      });
      return;
    }

    const amount = values.from * Math.pow(10, decimals);
    try {
      const txId = await glamClient.jupiter.swap(fundPDA, {
        inputMint,
        outputMint,
        amount,
        slippageBps: values.slippage * 100,
        swapMode: values.exactMode,
        onlyDirectRoutes: values.directRouteOnly,
        asLegacyTransaction: !values.versionedTransactions,
        maxAccounts: values.maxAccounts,
      });
      toast({
        title: `Swapped ${amount / LAMPORTS_PER_SOL} SOL to mSOL`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      toast({
        title: `Failed to swap ${amount / LAMPORTS_PER_SOL} SOL to mSOL`,
        variant: "destructive",
      });
    }

    // toast({
    //   title: "You submitted the following trade:",
    //   description: (
    //     <pre className="mt-2 w-[340px] rounded-md bg-zinc-900 p-4">
    //       <code className="text-white">
    //         {JSON.stringify(updatedValues, null, 2)}
    //       </code>
    //     </pre>
    //   ),
    // });
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    swapForm.reset({
      venue: "Jupiter",
      type: "Swap",
      slippage: 0.1,
      items: ["meteora"],
      exactMode: "ExactIn",
      maxAccounts: 20,
      from: 0,
      to: 0,
      directRouteOnly: false,
      useWSOL: false,
      versionedTransactions: false,
      fromAsset: "SOL", // Add this line
      toAsset: "SOL", // Add this line
    });
    setFromAsset("USDC");
    setToAsset("SOL");
    console.log("Form reset:", swapForm.getValues());
  };

  const handleFlip = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);

    const fromValue = swapForm.getValues("from");
    const toValue = swapForm.getValues("to");
  };

  useEffect(() => {
    swapForm.setValue("fromAsset", fromAsset);
    swapForm.setValue("toAsset", toAsset);
    console.log("Assets updated:", { fromAsset, toAsset });
  }, [fromAsset, toAsset, swapForm]);

  const handleExactModeChange = (value: string) => {
    if (value) {
      swapForm.setValue("exactMode", value as "ExactIn" | "ExactOut");
    }
  };

  const handleSideChange = (value: string) => {
    if (value) {
      spotForm.setValue("side", value as "Buy" | "Sell");
    }
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <Tabs defaultValue="spot" className="w-full">
          <TabsList className="w-full select-none mb-2">
            <TabsTrigger value="swap" className="w-full">
              Swap
            </TabsTrigger>
            <TabsTrigger value="spot" className="w-full">
              Spot
            </TabsTrigger>
            <TabsTrigger value="perps" className="w-full">
              Perps
            </TabsTrigger>
            <TabsTrigger value="options" className="w-full" disabled>
              Options
              <span className="opacity-50 ml-1">
                Soon<sup className="text-[9px]">TM</sup>
              </span>
            </TabsTrigger>
          </TabsList>

          {/*SWAP TAB*/}

          <TabsContent value="swap">
            <FormProvider {...swapForm}>
              <Form {...swapForm}>
                <form
                  onSubmit={swapForm.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="flex space-x-4">
                    <FormField
                      control={swapForm.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem className="w-1/2">
                          <FormLabel>Venue</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Venue" />
                              </SelectTrigger>
                              <SelectContent>
                                {swapSchema.shape.venue._def.values.map(
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
                    <FormField
                      control={swapForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="w-1/2">
                          <FormLabel>Order Type</FormLabel>
                          <FormControl>
                            <Select
                              disabled
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {swapSchema.shape.type._def.values.map(
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
                  </div>

                  <div className="flex space-x-4 items-center">
                    <AssetInput
                      className="min-w-1/2 w-1/2"
                      name="from"
                      label="From"
                      assets={fromAssetList}
                      balance={NaN}
                      selectedAsset={fromAsset}
                      onSelectAsset={setFromAsset}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(event) => handleFlip(event)}
                      className="mt-1 min-w-10"
                    >
                      <ColumnSpacingIcon />
                    </Button>
                    <FormField
                      control={swapForm.control}
                      name="slippage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slippage</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Slippage"
                              type="number"
                              min="0.1"
                              step="0.1"
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                              value={field.value}
                            />
                          </FormControl>
                          <FormDescription>&nbsp;</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <AssetInput
                      className="min-w-1/2 w-1/2"
                      name="to"
                      label="To"
                      assets={tokenList?.map(
                        (t) =>
                          ({
                            name: t.name,
                            symbol: t.symbol,
                            address: t.address,
                            decimals: t.decimals,
                            balance: 0,
                          } as Asset)
                      )}
                      balance={NaN}
                      selectedAsset={toAsset}
                      onSelectAsset={setToAsset}
                    />{" "}
                  </div>

                  <div className="flex flex-row gap-4 items-start">
                    <FormItem>
                      <FormLabel className="text-base">Venues</FormLabel>
                      <div className="space-y-4">
                        <span className="flex w-full gap-4">
                          <ToggleGroup
                            type="single"
                            value={filterType}
                            onValueChange={(value) =>
                              setFilterType(value || "include")
                            }
                            className="justify-start"
                          >
                            <ToggleGroupItem value="include">
                              Include
                            </ToggleGroupItem>
                            <ToggleGroupItem value="exclude">
                              Exclude
                            </ToggleGroupItem>
                          </ToggleGroup>

                          <Input
                            type="search"
                            placeholder="Search venues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className=""
                          />
                        </span>

                        <ScrollArea className="h-[300px] w-full border p-4">
                          <FormField
                            control={swapForm.control}
                            name="items"
                            render={() => (
                              <FormItem>
                                {filteredItems.map((item) => (
                                  <FormField
                                    key={item.id}
                                    control={swapForm.control}
                                    name="items"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={item.id}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(
                                                item.id
                                              )}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([
                                                      ...field.value,
                                                      item.id,
                                                    ])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) =>
                                                          value !== item.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {item.label}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </FormItem>
                            )}
                          />
                        </ScrollArea>
                      </div>
                    </FormItem>

                    <div className="flex flex-col gap-4 w-1/2">
                      <div className="flex space-x-4 items-center">
                        <FormField
                          control={swapForm.control}
                          name="exactMode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mode</FormLabel>
                              <ToggleGroup
                                type="single"
                                value={field.value}
                                onValueChange={handleExactModeChange}
                                className="justify-start"
                              >
                                <ToggleGroupItem
                                  value="exact-in"
                                  aria-label="Exact In"
                                >
                                  Exact In
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="exact-out"
                                  aria-label="Exact Out"
                                >
                                  Exact Out
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={swapForm.control}
                        name="maxAccounts"
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel>Max. Accounts</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Max. Accounts"
                                type="number"
                                min="5"
                                step="1"
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value, 10))
                                }
                                value={field.value}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormLabel>Advanced</FormLabel>
                      <FormField
                        control={swapForm.control}
                        name="directRouteOnly"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="direct-route-only"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor="direct-route-only"
                              className="font-normal"
                            >
                              Direct Route Only
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={swapForm.control}
                        name="useWSOL"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="use-wsol"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor="use-wsol"
                              className="font-normal"
                            >
                              Use wSOL
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={swapForm.control}
                        name="versionedTransactions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="versioned-transactions"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor="versioned-transactions"
                              className="font-normal"
                            >
                              Versioned Transactions
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
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
                      Swap
                    </Button>
                  </div>
                </form>
              </Form>
            </FormProvider>
          </TabsContent>

          {/*SPOT TAB*/}

          <TabsContent value="spot">
            <FormProvider {...spotForm}>
              <Form {...spotForm}>
                <form
                  onSubmit={spotForm.handleSubmit(onSubmit)}
                  className="space-y-4"
                >

                  <div className="flex space-x-4">
                    <FormField
                      control={spotForm.control}
                      name="venue"
                      render={({ field }) => (<FormItem className="w-1/3">
                          <FormLabel>Venue</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Venue" />
                              </SelectTrigger>
                              <SelectContent>
                                {spotSchema.shape.venue._def.values.map((option) => (<SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}
                    />

                    <FormField
                      control={spotForm.control}
                      name="market"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormLabel>Market</FormLabel>
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
                                  {field.value
                                    ? markets.find(
                                    (market) => market.value === field.value
                                  )?.label || "Select Market"
                                    : "Select Market"}
                                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search market..." />
                                <CommandList>
                                  <CommandEmpty>No market found.</CommandEmpty>
                                  <CommandGroup>
                                    {markets.map((market) => (
                                      <CommandItem
                                        value={market.label}
                                        key={market.value}
                                        onSelect={() => {
                                          spotForm.setValue("market", market.value as "SOL-USDC")
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            market.value === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {market.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={spotForm.control}
                      name="type"
                      render={({ field }) => (<FormItem className="w-1/3">
                          <FormLabel>Order Type</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {spotSchema.shape.type._def.values.map((option) => (<SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}
                    />



                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex space-x-4 items-center w-full">
                      <FormField
                        control={spotForm.control}
                        name="side"
                        render={({ field }) => (<FormItem className="w-full">
                            <ToggleGroup
                              type="single"
                              value={field.value}
                              onValueChange={handleSideChange}
                              className="w-full gap-4 mt-2"
                            >
                              <ToggleGroupItem
                                value="buy"
                                aria-label="Buy"
                                variant="outline"
                                className="
                                  w-full
                                  transition-all
                                  border-emerald-800
                                  text-emerald-800
                                  hover:border-emerald-600
                                  hover:text-emerald-600
                                  hover:bg-emerald-50
                                  data-[state=on]:border-emerald-800
                                  data-[state=on]:text-emerald-800
                                  data-[state=on]:bg-emerald-100
                                  dark:border-emerald-950
                                  dark:text-emerald-950
                                  dark:hover:border-emerald-500
                                  dark:hover:text-emerald-500
                                  dark:hover:bg-emerald-950
                                  dark:data-[state=on]:border-emerald-400
                                  dark:data-[state=on]:text-emerald-400
                                  dark:data-[state=on]:bg-emerald-900
                                  dark:data-[state=on]:bg-opacity-25
                                  ">
                                Buy
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="sell"
                                aria-label="Sell"
                                variant="outline"
                                className="
                                  transition-all
                                  w-full
                                  border-rose-800
                                  text-rose-800
                                  hover:border-rose-600
                                  hover:text-rose-600
                                  hover:bg-rose-50
                                  data-[state=on]:border-rose-800
                                  data-[state=on]:text-rose-800
                                  data-[state=on]:bg-rose-100
                                  dark:border-rose-950
                                  dark:text-rose-950
                                  dark:hover:border-rose-500
                                  dark:hover:text-rose-500
                                  dark:hover:bg-rose-950
                                  dark:data-[state=on]:border-rose-400
                                  dark:data-[state=on]:text-rose-400
                                  dark:data-[state=on]:bg-rose-900
                                  dark:data-[state=on]:bg-opacity-25
                                  ">
                                Sell
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </FormItem>)}
                      />
                    </div>
                  </div>

                  {orderType === "Limit" ? (
                    <>
                      <div className="flex space-x-4 items-start">
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="limit-price"
                          label="Limit Price"
                          assets={fromAssetList}
                          balance={NaN}
                          selectedAsset={fromAsset}
                          onSelectAsset={setFromAsset}
                          hideBalance={true}
                          disableAssetChange={true}
                        />
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="size"
                          label="Size"
                          assets={fromAssetList}
                          balance={NaN}
                          selectedAsset={fromAsset}
                          onSelectAsset={setFromAsset}
                        />
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="notional"
                          label="Notional"
                          assets={tokenList?.map((t) => ({
                            name: t.name, symbol: t.symbol, address: t.address, decimals: t.decimals, balance: 0,
                          } as Asset))}
                          balance={NaN}
                          selectedAsset={toAsset}
                          onSelectAsset={setToAsset}
                        />
                      </div>
                    </>
                  ) : orderType === "Stop Limit" ? (
                    <>
                      <div className="flex space-x-4 items-start">
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="trigger-price"
                          label="Trigger Price"
                          assets={fromAssetList}
                          balance={NaN}
                          selectedAsset={fromAsset}
                          onSelectAsset={setFromAsset}
                          hideBalance={true}
                          disableAssetChange={true}
                        />
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="limit-price"
                          label="Limit Price"
                          assets={fromAssetList}
                          balance={NaN}
                          selectedAsset={fromAsset}
                          onSelectAsset={setFromAsset}
                          hideBalance={true}
                          disableAssetChange={true}
                        />
                      </div>
                      <div className="flex space-x-4 items-start">
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="size"
                          label="Size"
                          assets={fromAssetList}
                          balance={NaN}
                          selectedAsset={fromAsset}
                          onSelectAsset={setFromAsset}
                        />
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="notional"
                          label="Notional"
                          assets={tokenList?.map((t) => ({
                            name: t.name, symbol: t.symbol, address: t.address, decimals: t.decimals, balance: 0,
                          } as Asset))}
                          balance={NaN}
                          selectedAsset={toAsset}
                          onSelectAsset={setToAsset}
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="flex flex-row gap-4 items-start w-full">

                    <div className="w-1/2 flex flex-row">

                    </div>

                    <div className="w-1/2 flex flex-row justify-start gap-4">
                      <FormField
                      control={spotForm.control}
                      name="reduceOnly"
                      render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="reduce-only"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="reduce-only"
                        className="font-normal"
                      >
                        Reduce Only
                      </FormLabel>
                    </FormItem>)}
                      />
                      <FormField
                        control={spotForm.control}
                        name="post"
                        render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="post"
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor="post"
                            className="font-normal"
                          >
                            Post
                          </FormLabel>
                        </FormItem>)}
                      />
                    </div>

                    {/*<FormField*/}
                    {/*  control={spotForm.control}*/}
                    {/*  name="showConfirmation"*/}
                    {/*  render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0">*/}
                    {/*      <FormControl>*/}
                    {/*        <Switch*/}
                    {/*          checked={field.value}*/}
                    {/*          onCheckedChange={field.onChange}*/}
                    {/*          id="show-confirmation"*/}
                    {/*        />*/}
                    {/*      </FormControl>*/}
                    {/*      <FormLabel*/}
                    {/*        htmlFor="show-confirmation"*/}
                    {/*        className="font-normal"*/}
                    {/*      >*/}
                    {/*        Show Confirmation*/}
                    {/*      </FormLabel>*/}
                    {/*    </FormItem>)}*/}
                    {/*/>*/}

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
                      Swap
                    </Button>
                  </div>
                </form>
              </Form>
            </FormProvider>
          </TabsContent>

          {/*PERPS TAB*/}

          <TabsContent value="perps">Perps</TabsContent>
        </Tabs>
      </div>
    </PageContentWrapper>);
}
