"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

import * as anchor from "@coral-xyz/anchor";
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
import {
  CaretSortIcon,
  CheckIcon,
  ColumnSpacingIcon,
} from "@radix-ui/react-icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Asset, AssetInput } from "@/components/AssetInput";
import React, { useEffect, useMemo, useState } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LeverageInput from "@/components/LeverageInput";
import {
  getOrderParams,
  MarketType,
  OrderType,
  PositionDirection,
} from "@drift-labs/sdk";
import {
  DRIFT_ORDER_TYPES,
  DRIFT_PERP_MARKETS,
  DRIFT_SPOT_MARKETS,
} from "@/constants";
import { Skeleton } from "@/components/ui/skeleton";

const spotMarkets = DRIFT_SPOT_MARKETS.map((x) => ({ label: x, value: x }));
const perpsMarkets = DRIFT_PERP_MARKETS.map((x) => ({ label: x, value: x }));

const PERSISTED_FIELDS = {
  swap: [
    "venue",
    "slippage",
    "exactMode",
    "maxAccounts",
    "directRouteOnly",
    "useWSOL",
    "items",
    "versionedTransactions",
  ],
  spot: [
    "venue",
    "spotMarket",
    "spotType",
    "side",
    "spotReduceOnly",
    "post",
    "leverage",
  ],
  perps: [
    "venue",
    "perpsMarket",
    "perpsType",
    "side",
    "perpsReduceOnly",
    "post",
    "leverage",
  ],
};

type FormKey = keyof typeof PERSISTED_FIELDS;

function usePersistedForm<T extends z.ZodTypeAny>(
  formKey: FormKey,
  schema: T,
  defaultValues: z.infer<T>
): UseFormReturn<z.infer<T>> {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    const storedValues = localStorage.getItem(formKey);
    if (storedValues) {
      const parsedValues = JSON.parse(storedValues);
      Object.keys(parsedValues).forEach((key) => {
        if (PERSISTED_FIELDS[formKey].includes(key as any)) {
          form.setValue(key as any, parsedValues[key]);
        }
      });
    }
  }, [formKey, form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const persistedValues: Partial<z.infer<T>> = {};
      PERSISTED_FIELDS[formKey].forEach((field) => {
        if (value[field as keyof z.infer<T>] !== undefined) {
          persistedValues[field as keyof z.infer<T>] =
            value[field as keyof z.infer<T>];
        }
      });
      localStorage.setItem(formKey, JSON.stringify(persistedValues));
    });
    return () => subscription.unsubscribe();
  }, [formKey, form]);

  return form;
}

const swapSchema = z.object({
  venue: z.enum(["Jupiter"]),
  swapType: z.enum(["Swap"]),
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
  spotMarket: z.enum(DRIFT_SPOT_MARKETS),
  spotType: z.enum(DRIFT_ORDER_TYPES),
  side: z.enum(["Buy", "Sell"]),
  limitPrice: z.number().nonnegative(),
  size: z.number().nonnegative(),
  notional: z.number().nonnegative(),
  triggerPrice: z.number().nonnegative().optional(),
  spotReduceOnly: z.boolean().optional(),
  post: z.boolean().optional(),
  showConfirmation: z.boolean().optional(),
  leverage: z.number().nonnegative(),
});

const perpsSchema = z.object({
  venue: z.enum(["Drift"]),
  perpsMarket: z.enum(DRIFT_PERP_MARKETS),
  perpsType: z.enum(DRIFT_ORDER_TYPES),
  side: z.enum(["Buy", "Sell"]),
  limitPrice: z.number().nonnegative(),
  size: z.number().nonnegative(),
  notional: z.number().nonnegative(),
  triggerPrice: z.number().nonnegative().optional(),
  perpsReduceOnly: z.boolean().optional(),
  post: z.boolean().optional(),
  showConfirmation: z.boolean().optional(),
  leverage: z.number().nonnegative().optional(),
});

type SwapSchema = z.infer<typeof swapSchema>;
type SpotSchema = z.infer<typeof spotSchema>;
type PerpsSchema = z.infer<typeof perpsSchema>;

export default function Trade() {
  const { fund: fundPDA, treasury, wallet, glamClient, tokenList } = useGlam();
  const [fromAsset, setFromAsset] = useState<string>("SOL");
  const [toAsset, setToAsset] = useState<string>("SOL");
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("swap");

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://quote-api.jup.ag/v6/program-id-to-label"
        );
        const data = await response.json();
        const formattedItems = Object.entries(data).map(([id, label]) => ({
          id,
          label: label as string,
        }));

        const sortedItems = formattedItems.sort((a, b) =>
          a.label.localeCompare(b.label)
        );

        setItems(sortedItems);
      } catch (error) {
        console.error("Error fetching program ID to label mapping:", error);
      } finally {
        setIsLoading(false);
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

  const swapForm = usePersistedForm("swap", swapSchema, {
    venue: "Jupiter",
    swapType: "Swap",
    slippage: 0.1,
    items: [""],
    exactMode: "ExactIn",
    maxAccounts: 20,
    from: 0,
    fromAsset: "SOL",
    to: 0,
    toAsset: "USDC",
    directRouteOnly: false,
    useWSOL: false,
    versionedTransactions: false,
  });

  const spotForm = usePersistedForm("spot", spotSchema, {
    venue: "Drift",
    spotMarket: "SOL-USDC",
    spotType: "Limit",
    side: "Buy",
    limitPrice: 0,
    size: 0,
    notional: 0,
    triggerPrice: 0,
    spotReduceOnly: false,
    post: false,
    showConfirmation: true,
    leverage: 0,
  });

  const perpsForm = usePersistedForm("perps", perpsSchema, {
    venue: "Drift",
    perpsMarket: "SOL-PERP",
    perpsType: "Limit",
    side: "Buy",
    limitPrice: 0,
    size: 0,
    notional: 0,
    triggerPrice: 0,
    perpsReduceOnly: false,
    post: false,
    showConfirmation: true,
    leverage: 0,
  });

  useEffect(() => {
    const perpsLeverageValue = perpsForm.watch("leverage");
    console.log("Perps form leverage value:", perpsLeverageValue);
  }, [perpsForm]);

  useEffect(() => {
    const spotLeverageValue = spotForm.watch("leverage");
    console.log("Spot form leverage value:", spotLeverageValue);
  }, [spotForm]);

  const spotOrderType = spotForm.watch("spotType");
  const spotReduceOnly = spotForm.watch("spotReduceOnly");
  const perpsOrderType = perpsForm.watch("perpsType");
  const perpsReduceOnly = perpsForm.watch("perpsReduceOnly");

  const onSubmitSwap: SubmitHandler<SwapSchema> = async (values) => {
    console.log("Submit Swap:", values);
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

  const onSubmitSpot: SubmitHandler<SpotSchema> = async (values) => {
    console.log("Submit Spot:", values);
  };

  const onSubmitPerps: SubmitHandler<PerpsSchema> = async (values) => {
    console.log("Submit Perps:", values);
    if (!fundPDA || !wallet || !treasury) {
      console.error(
        "Cannot submit perps order due to missing fund, wallet, or treasury"
      );
      return;
    }

    console.log(values);
    const orderParams = getOrderParams({
      orderType:
        values.perpsType === "Market" ? OrderType.MARKET : OrderType.LIMIT,
      marketType: MarketType.PERP,
      direction:
        values.side === "Buy"
          ? PositionDirection.LONG
          : PositionDirection.SHORT,
      marketIndex: DRIFT_PERP_MARKETS.indexOf(values.perpsMarket),
      baseAssetAmount: new anchor.BN(values.size * LAMPORTS_PER_SOL),
      price: new anchor.BN(values.limitPrice * 10 ** 6),
    });
    console.log("Drift perps orderParams", orderParams);

    try {
      const txId = await glamClient.drift.placeOrder(fundPDA, orderParams);
      toast({
        title: "Perps order submitted",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      toast({
        title: "Failed to submit perps order",
        variant: "destructive",
      });
    }
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    swapForm.reset({
      venue: "Jupiter",
      swapType: "Swap",
      slippage: 0.1,
      items: [""],
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

  const watchPerpsMarket = perpsForm.watch("perpsMarket");
  const perpsFromAsset = watchPerpsMarket
    .replace("-PERP", "")
    .replace("-BET", "");

  const watchPerpsLimitPrice = perpsForm.watch("limitPrice");
  const watchPerpsSize = perpsForm.watch("size");
  useEffect(() => {
    const perpsNotional = watchPerpsLimitPrice * watchPerpsSize;
    perpsForm.setValue("notional", perpsNotional);
  }, [watchPerpsLimitPrice, watchPerpsSize]);

  const driftUserAccount = fundPDA
    ? glamClient.drift.getUser(fundPDA)[0].toBase58()
    : "";

  const getButtonText = () => {
    switch (activeTab) {
      case "swap":
        return "Swap";
      case "spot":
        return "Place Spot Order";
      case "perps":
        return "Place Perp Order";
      default:
        return "Submit";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    switch (activeTab) {
      case "swap":
        swapForm.handleSubmit(onSubmitSwap)();
        break;
      case "spot":
        spotForm.handleSubmit(onSubmitSpot)();
        break;
      case "perps":
        perpsForm.handleSubmit(onSubmitPerps)();
        break;
    }
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <Tabs
          defaultValue="swap"
          className="w-full"
          onValueChange={setActiveTab}
        >
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
            {/*<TabsTrigger value="options" className="w-full" disabled>*/}
            {/*  Options*/}
            {/*  <span className="opacity-50 ml-1">*/}
            {/*    Soon<sup className="text-[9px]">TM</sup>*/}
            {/*  </span>*/}
            {/*</TabsTrigger>*/}
          </TabsList>

          {/*SWAP TAB*/}

          <TabsContent value="swap">
            <FormProvider {...swapForm}>
              <Form {...swapForm}>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      name="swapType"
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
                                {swapSchema.shape.swapType._def.values.map(
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

                  <div className="flex space-x-4 items-start">
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
                      className="mt-8 min-w-10"
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
                          {/*<FormDescription>&nbsp;</FormDescription>*/}
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
                                {isLoading // Skeleton loading state
                                  ? Array.from({ length: 10 }).map(
                                      (_, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-3 mb-2"
                                        >
                                          <Skeleton className="w-4 h-4" />
                                          <Skeleton className="w-[200px] h-[20px]" />
                                        </div>
                                      )
                                    )
                                  : filteredItems.map((item) => (
                                      <FormField
                                        key={item.id}
                                        control={swapForm.control}
                                        name="items"
                                        render={({ field }) => (
                                          <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0 mb-2"
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
                                        )}
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex space-x-4">
                    <FormField
                      control={spotForm.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
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
                                {spotSchema.shape.venue._def.values.map(
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
                      control={spotForm.control}
                      name="spotMarket"
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
                                    ? spotMarkets.find(
                                        (spotMarket) =>
                                          spotMarket.value === field.value
                                      )?.label || "Select Market"
                                    : "Select Market"}
                                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput placeholder="Search market..." />
                                <CommandList>
                                  <CommandEmpty>No market found.</CommandEmpty>
                                  <CommandGroup>
                                    {spotMarkets.map((spotMarket) => (
                                      <CommandItem
                                        value={spotMarket.label}
                                        key={spotMarket.value}
                                        onSelect={() => {
                                          spotForm.setValue(
                                            "spotMarket",
                                            spotMarket.value as "SOL-USDC"
                                          );
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            spotMarket.value === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {spotMarket.label}
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
                      name="spotType"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
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
                                {spotSchema.shape.spotType._def.values.map(
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

                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex space-x-4 items-center w-full">
                      <FormField
                        control={spotForm.control}
                        name="side"
                        render={({ field }) => (
                          <FormItem className="w-full">
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
                                className="w-full transition-all border-emerald-800 text-emerald-800 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 data-[state=on]:border-emerald-800 data-[state=on]:text-emerald-800 data-[state=on]:bg-emerald-100 dark:border-emerald-950 dark:text-emerald-950 dark:hover:border-emerald-500 dark:hover:text-emerald-500 dark:hover:bg-emerald-950 dark:data-[state=on]:border-emerald-400 dark:data-[state=on]:text-emerald-400 dark:data-[state=on]:bg-emerald-900 dark:data-[state=on]:bg-opacity-25"
                              >
                                Buy
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="sell"
                                aria-label="Sell"
                                variant="outline"
                                className="transition-all w-full border-rose-800 text-rose-800 hover:border-rose-600 hover:text-rose-600 hover:bg-rose-50 data-[state=on]:border-rose-800 data-[state=on]:text-rose-800 data-[state=on]:bg-rose-100 dark:border-rose-950 dark:text-rose-950 dark:hover:border-rose-500 dark:hover:text-rose-500 dark:hover:bg-rose-950 dark:data-[state=on]:border-rose-400 dark:data-[state=on]:text-rose-400 dark:data-[state=on]:bg-rose-900 dark:data-[state=on]:bg-opacity-25"
                              >
                                Sell
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {spotOrderType === "Limit" ? (
                    <>
                      <div className="flex space-x-4 items-start">
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="limitPrice"
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
                        />
                      </div>
                    </>
                  ) : spotOrderType === "Trigger Limit" ? (
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
                          name="limitPrice"
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
                        />
                      </div>
                    </>
                  ) : null}

                  {spotOrderType !== "Trigger Limit" && !spotReduceOnly && (
                    <div className="flex flex-row gap-4 items-start w-full">
                      <LeverageInput
                        control={spotForm.control}
                        name="leverage"
                        label="Leverage: 100x"
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  )}

                  <div className="flex flex-row gap-4 items-start w-full">
                    <div className="w-1/2 flex h-6 items-center text-sm text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center">
                            <InfoIcon className="w-4 h-4 mr-1"></InfoIcon>
                            <p>Margin Trading Disabled</p>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            Please view the Risk Management configuration of the
                            Venue Integration.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="w-1/2 flex flex-row justify-start gap-4">
                      <FormField
                        control={spotForm.control}
                        name="spotReduceOnly"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
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
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={spotForm.control}
                        name="post"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="post"
                              />
                            </FormControl>
                            <FormLabel htmlFor="post" className="font-normal">
                              Post
                            </FormLabel>
                          </FormItem>
                        )}
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
                      Submit
                    </Button>
                  </div>
                </form>
              </Form>
            </FormProvider>
          </TabsContent>

          {/*PERPS TAB*/}

          <TabsContent value="perps">
            <FormProvider {...perpsForm}>
              <Form {...perpsForm}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex space-x-4">
                    <FormField
                      control={perpsForm.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
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
                                {perpsSchema.shape.venue._def.values.map(
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
                      control={perpsForm.control}
                      name="perpsMarket"
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
                                    ? perpsMarkets.find(
                                        (perpsMarket) =>
                                          perpsMarket.value === field.value
                                      )?.label || "Select Market"
                                    : "Select Market"}
                                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput placeholder="Search market..." />
                                <CommandList>
                                  <CommandEmpty>No market found.</CommandEmpty>
                                  <CommandGroup>
                                    {perpsMarkets.map((perpsMarket) => (
                                      <CommandItem
                                        value={perpsMarket.label}
                                        key={perpsMarket.value}
                                        onSelect={() => {
                                          perpsForm.setValue(
                                            "perpsMarket",
                                            perpsMarket.value as "SOL-PERP"
                                          );
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            perpsMarket.value === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {perpsMarket.label}
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
                      control={perpsForm.control}
                      name="perpsType"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
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
                                {perpsSchema.shape.perpsType._def.values.map(
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

                  <div className="flex">
                    <ExplorerLink
                      path={`https://app.drift.trade/?userAccount=${driftUserAccount}`}
                      label={driftUserAccount}
                    />
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex space-x-4 items-center w-full">
                      <FormField
                        control={perpsForm.control}
                        name="side"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <ToggleGroup
                              type="single"
                              value={field.value}
                              onValueChange={handleSideChange}
                              className="w-full gap-4"
                            >
                              <ToggleGroupItem
                                value="Buy"
                                aria-label="Buy"
                                variant="outline"
                                className="w-full transition-all border-emerald-800 text-emerald-800 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 data-[state=on]:border-emerald-800 data-[state=on]:text-emerald-800 data-[state=on]:bg-emerald-100 dark:border-emerald-950 dark:text-emerald-950 dark:hover:border-emerald-500 dark:hover:text-emerald-500 dark:hover:bg-emerald-950 dark:data-[state=on]:border-emerald-400 dark:data-[state=on]:text-emerald-400 dark:data-[state=on]:bg-emerald-900 dark:data-[state=on]:bg-opacity-25"
                              >
                                Buy
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="Sell"
                                aria-label="Sell"
                                variant="outline"
                                className="transition-all w-full border-rose-800 text-rose-800 hover:border-rose-600 hover:text-rose-600 hover:bg-rose-50 data-[state=on]:border-rose-800 data-[state=on]:text-rose-800 data-[state=on]:bg-rose-100 dark:border-rose-950 dark:text-rose-950 dark:hover:border-rose-500 dark:hover:text-rose-500 dark:hover:bg-rose-950 dark:data-[state=on]:border-rose-400 dark:data-[state=on]:text-rose-400 dark:data-[state=on]:bg-rose-900 dark:data-[state=on]:bg-opacity-25"
                              >
                                Sell
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {perpsOrderType === "Limit" ? (
                    <>
                      <div className="flex space-x-4 items-start">
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="limitPrice"
                          label="Limit Price"
                          balance={NaN}
                          selectedAsset="$"
                          hideBalance={true}
                          disableAssetChange={true}
                        />
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="size"
                          label="Size"
                          selectedAsset={perpsFromAsset}
                          balance={NaN}
                          disableAssetChange={true}
                        />
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="notional"
                          label="Notional"
                          selectedAsset={"USDC"}
                          balance={NaN}
                          disableAssetChange={true}
                        />
                      </div>
                    </>
                  ) : perpsOrderType === "Trigger Limit" ? (
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
                          name="limitPrice"
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
                        />
                      </div>
                    </>
                  ) : null}
                  {false && (
                    <>
                      <div className="flex flex-row gap-4 items-start w-full">
                        <LeverageInput
                          control={perpsForm.control}
                          name="leverage"
                          label="Leverage: 100x"
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                      <div className="flex flex-row gap-4 items-start w-full">
                        <div className="w-1/2 flex h-6 items-center text-sm text-muted-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center">
                                <InfoIcon className="w-4 h-4 mr-1"></InfoIcon>
                                <p>Leverage Limit Enabled</p>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                Please view the Risk Management configuration of
                                the Venue Integration.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="w-1/2 flex flex-row justify-start gap-4">
                          <FormField
                            control={perpsForm.control}
                            name="perpsReduceOnly"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
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
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={spotForm.control}
                            name="post"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
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
                              </FormItem>
                            )}
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
                    </>
                  )}
                  <div className="flex space-x-4 w-full">
                    <Button
                      className="w-1/2"
                      variant="ghost"
                      onClick={(event) => handleClear(event)}
                    >
                      Clear
                    </Button>
                    <Button className="w-1/2" type="submit">
                      Submit
                    </Button>
                  </div>
                  <div className="flex space-x-4 w-full">
                    <Button variant="secondary" className="w-1/4">Cancel All Orders</Button>
                    <Button variant="secondary" className="w-1/4">Cancel All &nbsp;<span className="truncate">{perpsForm.watch("perpsMarket").replace("-PERP", "")}</span></Button>
                    <Button variant="secondary" className="w-1/4">Settle P&L</Button>
                    <Button variant="secondary" className="w-1/4">Claim Rewards</Button>
                  </div>
                </form>
              </Form>
            </FormProvider>
          </TabsContent>
        </Tabs>
      </div>
    </PageContentWrapper>
  );
}
