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
} from "@/components/ui/form";
import {
  CaretSortIcon,
  CheckIcon,
  ColumnSpacingIcon,
  ExternalLinkIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Asset, AssetInput } from "@/components/AssetInput";
import React, { useEffect, useMemo, useState } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";
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
import TruncateAddress from "@/utils/TruncateAddress";
import { useQuery } from "@tanstack/react-query";
import { DevOnly } from "@/components/DevOnly";
import { parseTxError } from "@/lib/error";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicKey } from "@solana/web3.js";
import {
  QuoteParams,
  QuoteResponse,
  PerpMarketConfig,
  SpotMarketConfig,
} from "@glam/anchor/react";
import {
  getPriorityFeeMicroLamports,
  getMaxCapFeeLamports,
} from "@/app/(shared)/settings/priorityfee";
import { SlippageInput } from "@/components/SlippageInput";
import { PriorityFeeInput } from "@/components/PriorityFeeInput";
import { ExactOutWarning } from "./warning";

const spotMarkets = DRIFT_SPOT_MARKETS.map((x) => ({ label: x, value: x }));
const perpsMarkets = DRIFT_PERP_MARKETS.map((x) => ({ label: x, value: x }));

const PERSISTED_FIELDS = {
  swap: [
    "venue",
    "slippage",
    "slippageUnit",
    "filterType",
    "exactMode",
    "maxAccounts",
    "directRouteOnly",
    "useWSOL",
    "dexes",
    "versionedTransactions",
    "priorityFeeOverride",
    "priorityFeeOverrideUnit",
  ],
  spot: [
    "venue",
    "spotMarket",
    "spotType",
    "side",
    "spotReduceOnly",
    "post",
    "leverage",
    "slippage",
    "slippageUnit",
    "priorityFeeOverride",
    "priorityFeeOverrideUnit",
  ],
  perps: [
    "venue",
    "perpsMarket",
    "perpsType",
    "side",
    "perpsReduceOnly",
    "post",
    "leverage",
    "slippage",
    "slippageUnit",
    "priorityFeeOverride",
    "priorityFeeOverrideUnit",
  ],
};

type FormKey = keyof typeof PERSISTED_FIELDS;

function usePersistedForm<T extends z.ZodTypeAny>(
  formKey: FormKey,
  schema: T,
  defaultValues: z.infer<T>,
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
  filterType: z.enum(["Include", "Exclude"]),
  slippage: z.number().nonnegative(),
  slippageUnit: z.enum(["BPS", "%"]),
  dexes: z.array(z.string()),
  exactMode: z.enum(["ExactIn", "ExactOut"]),
  maxAccounts: z.number().nonnegative().int(),
  from: z.number(),
  fromAsset: z.string(),
  to: z.number(),
  toAsset: z.string(),
  directRouteOnly: z.boolean().optional(),
  useWSOL: z.boolean().optional(),
  versionedTransactions: z.boolean().optional(),
  priorityFeeOverride: z.number().nonnegative().optional(),
  priorityFeeOverrideUnit: z.enum(["LMPS", "SOL"]).optional(),
});

const spotSchema = z.object({
  venue: z.enum(["Drift"]),
  market: z.enum(DRIFT_SPOT_MARKETS),
  orderType: z.enum(DRIFT_ORDER_TYPES),
  side: z.enum(["Buy", "Sell"]),
  limitPrice: z.number().nonnegative(),
  size: z.number().nonnegative(),
  notional: z.number().nonnegative(),
  triggerPrice: z.number().nonnegative().optional(),
  reduceOnly: z.boolean().optional(),
  post: z.boolean().optional(),
  showConfirmation: z.boolean().optional(),
  leverage: z.number().nonnegative(),
  slippage: z.number().nonnegative().optional(),
  slippageUnit: z.enum(["BPS", "%"]).optional(),
  priorityFeeOverride: z.number().nonnegative().optional(),
  priorityFeeOverrideUnit: z.enum(["LMPS", "SOL"]).optional(),
});

const perpsSchema = z.object({
  venue: z.enum(["Drift"]),
  market: z.enum(DRIFT_PERP_MARKETS),
  orderType: z.enum(DRIFT_ORDER_TYPES),
  side: z.enum(["Buy", "Sell"]),
  limitPrice: z.number().nonnegative(),
  size: z.number().nonnegative(),
  notional: z.number().nonnegative(),
  triggerPrice: z.number().nonnegative().optional(),
  reduceOnly: z.boolean().optional(),
  post: z.boolean().optional(),
  showConfirmation: z.boolean().optional(),
  leverage: z.number().nonnegative().optional(),
  slippage: z.number().nonnegative().optional(),
  slippageUnit: z.enum(["BPS", "%"]).optional(),
  priorityFeeOverride: z.number().nonnegative().optional(),
  priorityFeeOverrideUnit: z.enum(["LMPS", "SOL"]).optional(),
});

type SwapSchema = z.infer<typeof swapSchema>;
type SpotSchema = z.infer<typeof spotSchema>;
type PerpsSchema = z.infer<typeof perpsSchema>;

const DEFAULT_SWAP_FORM_VALUES: SwapSchema = {
  venue: "Jupiter",
  swapType: "Swap",
  filterType: "Exclude",
  slippage: 0.05,
  slippageUnit: "%",
  dexes: [],
  exactMode: "ExactIn",
  maxAccounts: 20,
  from: 0,
  fromAsset: "USDC",
  to: 0,
  toAsset: "SOL",
  directRouteOnly: false,
  useWSOL: false,
  versionedTransactions: true,
  priorityFeeOverride: 0,
  priorityFeeOverrideUnit: "SOL",
};

const DEFAULT_SPOT_FORM_VALUES: SpotSchema = {
  venue: "Drift",
  market: "SOL/USDC",
  orderType: "Limit",
  side: "Buy",
  limitPrice: 0,
  size: 0,
  notional: 0,
  triggerPrice: 0,
  reduceOnly: false,
  post: false,
  showConfirmation: true,
  leverage: 0,
  slippage: 0.05,
  slippageUnit: "%",
  priorityFeeOverride: 0,
  priorityFeeOverrideUnit: "SOL",
};

const DEFAULT_PERPS_FORM_VALUES: PerpsSchema = {
  venue: "Drift",
  market: "SOL-PERP",
  orderType: "Limit",
  side: "Buy",
  limitPrice: 0,
  size: 0,
  notional: 0,
  triggerPrice: 0,
  reduceOnly: false,
  post: false,
  showConfirmation: true,
  leverage: 0,
  slippage: 0.05,
  slippageUnit: "%",
  priorityFeeOverride: 0,
  priorityFeeOverrideUnit: "SOL",
};

export default function Trade() {
  const {
    activeGlamState,
    vault,
    userWallet,
    glamClient,
    jupTokenList,
    driftMarketConfigs,
  } = useGlam();

  const [activeTab, setActiveTab] = useState("swap");
  const [fromAsset, setFromAsset] = useState("USDC");
  const [toAsset, setToAsset] = useState("SOL");
  const [dexesList, setDexesList] = useState(
    [] as { id: string; label: string }[],
  );
  const [isDexesListLoading, setIsDexesListLoading] = useState(true);

  const [isSubmitTxPending, setIsSubmitTxPending] = useState(false);
  const [isCancelTxPending, setIsCancelTxPending] = useState(false);
  const [isSettleTxPending, setIsSettleTxPending] = useState(false);
  const [isSwapToAmountLoading, setIsSwapToAmountLoading] = useState(false);
  const [isSwapFromAmountLoading, setIsSwapFromAmountLoading] = useState(false);

  // Cache swap quote params and response
  const [swapQuoteParams, setSwapQuoteParams] = useState({} as QuoteParams);
  const [swapQuoteResponse, setSwapQuoteResponse] = useState(
    {} as QuoteResponse,
  );

  const { data: jupDexes } = useQuery({
    queryKey: ["program-id-to-label"],
    staleTime: 1000 * 60 * 30, // 30 minutes, don't need to refresh too often
    queryFn: async () => {
      setIsDexesListLoading(true);
      const response = await fetch(
        "https://quote-api.jup.ag/v6/program-id-to-label",
      );
      const data = await response.json();
      const formatted = Object.entries(data).map(([id, label]) => ({
        id,
        label: label as string,
      }));

      const sortedDexes = formatted.sort((a, b) =>
        a.label.localeCompare(b.label),
      );

      setIsDexesListLoading(false);
      return sortedDexes; // return the data that will be cached
    },
  });

  useEffect(() => {
    if (jupDexes && jupDexes.length > 0) {
      setIsDexesListLoading(false);
      setDexesList(jupDexes);
    }
  }, [jupDexes]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredDexes = dexesList.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const fromAssetList = useMemo(() => {
    const assets = (vault?.tokenAccounts || [])
      .map((ta) => {
        const jupToken = jupTokenList?.find(
          (t) => t.address === ta.mint.toBase58(),
        );
        const name = jupToken?.name || "Unknown";
        const symbol = jupToken?.symbol || ta.mint.toBase58();
        return {
          name,
          symbol,
          address: ta.mint.toBase58(),
          decimals: ta.decimals,
          balance:
            /* combine SOL + wSOL balances */
            symbol === "SOL"
              ? ta.uiAmount + (vault?.balanceLamports || 0) / LAMPORTS_PER_SOL
              : ta.uiAmount,
        } as Asset;
      })
      .filter((a) => a.balance > 0);

    return assets;
  }, [vault, jupTokenList, activeGlamState]);

  const swapForm = usePersistedForm("swap", swapSchema, {
    ...DEFAULT_SWAP_FORM_VALUES,
    dexes: [],
  });
  const spotForm = usePersistedForm(
    "spot",
    spotSchema,
    DEFAULT_SPOT_FORM_VALUES,
  );
  const perpsForm = usePersistedForm(
    "perps",
    perpsSchema,
    DEFAULT_PERPS_FORM_VALUES,
  );

  const spotOrderType = spotForm.watch("orderType");
  const spotReduceOnly = spotForm.watch("reduceOnly");
  const perpsOrderType = perpsForm.watch("orderType");
  const perpsReduceOnly = perpsForm.watch("reduceOnly");

  const getSwapQuoteParams = (): {
    quoteParams: QuoteParams;
    inputDecimals: number;
    outputDecimals: number;
  } => {
    const {
      dexes: selectedDexes,
      exactMode,
      maxAccounts,
      filterType,
      from,
      to,
      slippage,
      slippageUnit,
      versionedTransactions,
      directRouteOnly,
    } = swapForm.getValues();

    const getAssetMintAndDecimals = (asset: string) =>
      jupTokenList?.find((t) => {
        if (asset === "wSOL") {
          return t.symbol === "SOL";
        }
        return t.symbol === asset;
      }) || ({} as any);

    const { address: inputMint, decimals: inputDecimals } =
      getAssetMintAndDecimals(fromAsset);
    const { address: outputMint, decimals: outputDecimals } =
      getAssetMintAndDecimals(toAsset);

    let dexesParam;
    const dexes = selectedDexes.filter((item) => item !== "");
    if (filterType === "Exclude") {
      dexesParam = { excludeDexes: dexes };
      if (dexes.length === 0) {
        dexesParam = {}; // No dexes selected, don't include the param
      }
    } else {
      dexesParam = { dexes }; // Include only selected dexes
    }

    // maxAccounts is not accepted if exactMode is ExactOut
    let maxAccountsParam = {};
    if (exactMode === "ExactIn") {
      maxAccountsParam = { maxAccounts };
    }

    const amount = Math.floor(
      exactMode === "ExactIn"
        ? from * 10 ** inputDecimals
        : to * 10 ** outputDecimals,
    );

    const quoteParams = {
      inputMint,
      outputMint,
      amount,
      slippageBps: slippage * (slippageUnit === "%" ? 100 : 1),
      swapMode: exactMode,
      onlyDirectRoutes: directRouteOnly,
      asLegacyTransaction: !versionedTransactions,
      ...maxAccountsParam,
      ...dexesParam,
    } as QuoteParams;

    return { quoteParams, inputDecimals, outputDecimals };
  };

  const getSwapQuoteResponse = async (
    quoteParams: QuoteParams,
    inputDecimals: number,
    outputDecimals: number,
  ): Promise<{
    quoteResponse: QuoteResponse;
    uiAmountFrom: number;
    uiAmountTo: number;
  }> => {
    try {
      const quoteResponse =
        await glamClient.jupiter.getQuoteResponse(quoteParams);
      return {
        quoteResponse,
        uiAmountFrom: Number(quoteResponse.inAmount) / 10 ** inputDecimals,
        uiAmountTo: Number(quoteResponse.outAmount) / 10 ** outputDecimals,
      };
    } catch (error: any) {
      toast({
        title: "Failed to get swap quote",
        description: `${error.message}. Some assets may not support ExactOut.`,
        variant: "destructive",
      });
    }
    return {} as any;
  };

  const onSubmitSwap: SubmitHandler<SwapSchema> = async (values) => {
    const { exactMode } = values;
    if (
      (exactMode === "ExactIn" && values.from === 0) ||
      (exactMode === "ExactOut" && values.to === 0)
    ) {
      toast({
        title: "Invalid from/to amount for swap",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
      return;
    }

    const { inputMint, outputMint } = swapQuoteResponse;

    if (!inputMint || !outputMint || inputMint === outputMint) {
      toast({
        title: "Invalid input/output asset for swap",
        variant: "destructive",
      });
      return;
    }

    // At this point we should have cached quote params and response
    // If quote params changed, we need to re-fetch quote response; otherwise, use cached response
    let quoteResponseForSwap = swapQuoteResponse;
    const { quoteParams, inputDecimals, outputDecimals } = getSwapQuoteParams();
    if (JSON.stringify(swapQuoteParams) !== JSON.stringify(quoteParams)) {
      console.log("Quote params changed, re-fetch quote response");
      setSwapQuoteParams(quoteParams);
      const { quoteResponse } = await getSwapQuoteResponse(
        quoteParams,
        inputDecimals,
        outputDecimals,
      );
      quoteResponseForSwap = quoteResponse;
    }

    const getPriorityFeeOverride = () => {
      const { priorityFeeOverride, priorityFeeOverrideUnit } = values;
      if (priorityFeeOverride) {
        return (
          priorityFeeOverride *
          (priorityFeeOverrideUnit === "LMPS" ? 1 : LAMPORTS_PER_SOL)
        );
      }
      return 0;
    };

    setIsSubmitTxPending(true);
    try {
      const txId = await glamClient.jupiter.swap(
        activeGlamState!.pubkey,
        undefined,
        quoteResponseForSwap,
        undefined,
        {
          getPriorityFeeMicroLamports,
          maxFeeLamports: getPriorityFeeOverride() || getMaxCapFeeLamports(),
          useMaxFee: getPriorityFeeOverride() > 0,
        },
      );
      toast({
        title: `Swapped ${fromAsset} to ${toAsset}`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      toast({
        title: `Failed to swap ${fromAsset} to ${toAsset}`,
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsSubmitTxPending(false);
  };

  const validateInput = (
    values: SpotSchema | PerpsSchema,
  ):
    | {
        orderType: OrderType;
        direction: PositionDirection;
        size: number;
        price: number;
        marketConfig: SpotMarketConfig | PerpMarketConfig | undefined;
      }
    | undefined => {
    const { limitPrice, size, market, orderType, side } = values;
    if (!limitPrice || !size) {
      toast({
        title: `Invalid limit price or size for spot order`,
        description: "Please check your input and try again.",
        variant: "destructive",
      });
      return;
    }

    const spotMarketConfig = driftMarketConfigs.spot.find(
      (config) => config.symbol === market.replace("/USDC", ""),
    );
    const perpsMarketConfig = driftMarketConfigs.perp.find(
      (config) => config.symbol === market,
    );
    if (!spotMarketConfig && !perpsMarketConfig) {
      toast({
        title: `Cannot find drift market configs for ${market}`,
        variant: "destructive",
      });
      return;
    }

    // TODO: need to handle other order types in the future
    return {
      orderType: orderType === "Market" ? OrderType.MARKET : OrderType.LIMIT,
      direction:
        side === "Buy" ? PositionDirection.LONG : PositionDirection.SHORT,
      size,
      price: orderType === "Market" ? 0 : limitPrice,
      marketConfig: spotMarketConfig || perpsMarketConfig,
    };
  };

  const onSubmitSpot: SubmitHandler<SpotSchema> = async (values) => {
    console.log("Submit spot order:", values);

    const validated = validateInput(values);
    if (!validated) {
      return;
    }
    const { orderType, direction, size, price } = validated;
    const marketConfig = validated.marketConfig as SpotMarketConfig;

    const orderParams = getOrderParams({
      orderType,
      marketType: MarketType.SPOT,
      direction,
      marketIndex: marketConfig?.marketIndex!,
      baseAssetAmount: new anchor.BN(size * 10 ** marketConfig?.decimals!),
      price: new anchor.BN(
        price * 10 ** driftMarketConfigs.orderConstants.quoteScale,
      ),
    });
    console.log("Drift spot orderParams", orderParams);

    const getPriorityFee = () => {
      const { priorityFeeOverride, priorityFeeOverrideUnit } = values;
      if (priorityFeeOverride) {
        return (
          priorityFeeOverride *
          (priorityFeeOverrideUnit === "LMPS" ? 1 : LAMPORTS_PER_SOL)
        );
      }
      return 0;
    };

    setIsSubmitTxPending(true);
    try {
      const txId = await glamClient.drift.placeOrder(
        activeGlamState!.pubkey,
        orderParams,
        0,
        driftMarketConfigs,
        {
          getPriorityFeeMicroLamports,
          maxFeeLamports: getPriorityFee() || getMaxCapFeeLamports(),
          useMaxFee: getPriorityFee() > 0,
        },
      );
      toast({
        title: "Spot order submitted",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error: any) {
      toast({
        title: "Failed to submit spot order",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsSubmitTxPending(false);
  };

  const onSubmitPerps: SubmitHandler<PerpsSchema> = async (values) => {
    console.log("Submit Perps:", values);

    const validated = validateInput(values);
    if (!validated) {
      return;
    }
    const { orderType, direction, size, price, marketConfig } = validated;

    const orderParams = getOrderParams({
      orderType,
      marketType: MarketType.PERP,
      direction,
      marketIndex: marketConfig?.marketIndex!,
      baseAssetAmount: new anchor.BN(
        size * 10 ** driftMarketConfigs.orderConstants.perpBaseScale,
      ),
      price: new anchor.BN(
        price * 10 ** driftMarketConfigs.orderConstants.quoteScale,
      ),
    });
    console.log("Drift perps orderParams", orderParams);

    const getPriorityFee = () => {
      const { priorityFeeOverride, priorityFeeOverrideUnit } = values;
      if (priorityFeeOverride) {
        return (
          priorityFeeOverride *
          (priorityFeeOverrideUnit === "LMPS" ? 1 : LAMPORTS_PER_SOL)
        );
      }
      return 0;
    };
    setIsSubmitTxPending(true);
    try {
      const txId = await glamClient.drift.placeOrder(
        activeGlamState!.pubkey,
        orderParams,
        0,
        driftMarketConfigs,
        {
          getPriorityFeeMicroLamports,
          maxFeeLamports: getPriorityFee() || getMaxCapFeeLamports(),
          useMaxFee: getPriorityFee() > 0,
        },
      );
      toast({
        title: "Perps order submitted",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error: any) {
      toast({
        title: "Failed to submit perps order",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsSubmitTxPending(false);
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    switch (activeTab) {
      case "swap":
        swapForm.reset({
          ...DEFAULT_SWAP_FORM_VALUES,
          dexes: [],
        });
        setFromAsset("USDC");
        setToAsset("SOL");
        break;
      case "spot":
        spotForm.reset(DEFAULT_SPOT_FORM_VALUES);
        break;
      case "perps":
        perpsForm.reset(DEFAULT_PERPS_FORM_VALUES);
    }

    // console.log("Form reset:", swapForm.getValues());
  };

  const handleFlip = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
  };

  useEffect(() => {
    swapForm.setValue("fromAsset", fromAsset);
    swapForm.setValue("toAsset", toAsset);
    console.log("Assets updated:", { fromAsset, toAsset });
  }, [fromAsset, toAsset, swapForm]);

  const watchSwapFromAmount = swapForm.watch("from");
  const watchSwapToAmount = swapForm.watch("to");

  useEffect(() => {
    const fetchData = async () => {
      const exactMode = swapForm.getValues().exactMode;
      if (exactMode === "ExactIn" && watchSwapFromAmount) {
        setIsSwapToAmountLoading(true);
        const { quoteParams, inputDecimals, outputDecimals } =
          getSwapQuoteParams();

        const { uiAmountTo, quoteResponse } = await getSwapQuoteResponse(
          quoteParams,
          inputDecimals,
          outputDecimals,
        );
        if (uiAmountTo) {
          swapForm.setValue("to", uiAmountTo);
        }
        if (quoteResponse) {
          setSwapQuoteParams(quoteParams);
          setSwapQuoteResponse(quoteResponse);
        }
        setIsSwapToAmountLoading(false);
      }
    };
    fetchData();
  }, [watchSwapFromAmount]);

  useEffect(() => {
    const fetchData = async () => {
      const exactMode = swapForm.getValues().exactMode;
      if (exactMode === "ExactOut" && watchSwapToAmount) {
        setIsSwapFromAmountLoading(true);
        const { quoteParams, inputDecimals, outputDecimals } =
          getSwapQuoteParams();
        const { uiAmountFrom, quoteResponse } = await getSwapQuoteResponse(
          quoteParams,
          inputDecimals,
          outputDecimals,
        );
        if (uiAmountFrom) {
          swapForm.setValue("from", uiAmountFrom);
        }
        if (quoteResponse) {
          setSwapQuoteParams(quoteParams);
          setSwapQuoteResponse(quoteResponse);
        }
        setIsSwapFromAmountLoading(false);
      }
    };
    fetchData();
  }, [watchSwapToAmount]);

  const handleExactModeChange = (value: string) => {
    if (value) {
      swapForm.setValue("exactMode", value as "ExactIn" | "ExactOut");
      swapForm.setValue("from", 0);
      swapForm.setValue("to", 0);
    }
  };

  const handleSideChange = (value: string) => {
    if (value) {
      spotForm.setValue("side", value as "Buy" | "Sell");
      perpsForm.setValue("side", value as "Buy" | "Sell");
    }
  };

  const watchPerpsLimitPrice = perpsForm.watch("limitPrice");
  const watchPerpsSize = perpsForm.watch("size");
  useEffect(() => {
    const perpsNotional = watchPerpsLimitPrice * watchPerpsSize;
    perpsForm.setValue("notional", perpsNotional);
  }, [watchPerpsLimitPrice, watchPerpsSize]);

  const driftUserAccount = activeGlamState?.pubkey
    ? glamClient.drift.getUser(activeGlamState.pubkey)[0].toBase58()
    : "";

  /**
   * All form submissions are routed through this function.
   *
   * We first check required fields before calling the appropriate submit function.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeGlamState?.pubkey || !userWallet.pubkey || !vault) {
      console.error(
        `Cannot submit ${activeTab} order due to missing fund, wallet, or treasury`,
      );
      return;
    }

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

  const [cancelValue, setCancelValue] = React.useState("cancelAll");
  const [settleValue, setSettleValue] = React.useState("settlePnL");

  const handleCancel = async (
    event: React.MouseEvent<HTMLButtonElement>,
    marketType: "Perps" | "Spot",
  ) => {
    event.preventDefault();

    if (!activeGlamState?.pubkey || !userWallet.pubkey || !vault) {
      console.error(
        "Cannot cancel orders due to missing fund, wallet, or treasury",
      );
      return;
    }

    const market =
      marketType === "Perps"
        ? perpsForm.getValues().market
        : spotForm.getValues().market;

    const marketConfig =
      marketType === "Perps"
        ? driftMarketConfigs.perp.find((config) => config.symbol === market)
        : driftMarketConfigs.spot.find(
            (config) => config.symbol === market.replace("/USDC", ""),
          );

    if (!marketConfig) {
      toast({
        title: `Cannot find drift market configs for ${market}`,
        variant: "destructive",
      });
      return;
    }

    console.log("Cancel orders for", marketType, marketConfig);

    let marketAccounts;
    if (marketType === "Perps") {
      marketAccounts = {
        oracle: new PublicKey(marketConfig.oracle),
        perpMarket: new PublicKey(marketConfig.marketPDA),
      };
    } else {
      marketAccounts = {
        oracle: new PublicKey(marketConfig.oracle),
        spotMarket: new PublicKey(marketConfig.marketPDA),
      };
    }

    setIsCancelTxPending(true);
    try {
      const txId = await glamClient.drift.cancelOrders(
        activeGlamState!.pubkey,
        marketType === "Perps" ? MarketType.PERP : MarketType.SPOT,
        marketConfig?.marketIndex!,
        PositionDirection.LONG,
        0,
        driftMarketConfigs,
        { getPriorityFeeMicroLamports, maxFeeLamports: getMaxCapFeeLamports() },
      );
      toast({
        title: "Orders canceled",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      toast({
        title: "Failed to cancel orders",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsCancelTxPending(false);
  };

  const handleSettle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!activeGlamState?.pubkey || !userWallet.pubkey || !vault) {
      console.error(
        "Cannot cancel orders due to missing fund, wallet, or treasury",
      );
      return;
    }

    setIsSettleTxPending(true);
    try {
      const response = await fetch(
        "https://api.glam.systems/v0/drift/settle_pnl",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: driftUserAccount,
            authority: glamClient.getWallet().publicKey.toBase58(),
            simulate: false,
            estimatePriorityFee: true,
          }),
        },
      );
      const tx = await response.text();
      const vTx = VersionedTransaction.deserialize(
        new Uint8Array(Buffer.from(tx, "base64")),
      );
      const txId = await glamClient.sendAndConfirm(vTx);
      toast({
        title: "Successfully settled PnL",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      toast({
        title: "Failed to settle PnL",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsSettleTxPending(false);
  };

  const exactMode = swapForm.watch("exactMode");
  return (
    <PageContentWrapper>
      <div className="w-full xl:w-2/3 self-center">
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
            <DevOnly>
              <TabsTrigger value="options" className="w-full" disabled>
                Options
                <span className="opacity-50 ml-1">
                  Soon<sup className="text-[9px]">TM</sup>
                </span>
              </TabsTrigger>
            </DevOnly>
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
                                  ),
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
                                  ),
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
                      className="min-w-1/3 w-1/3"
                      name="from"
                      label="From"
                      assets={fromAssetList}
                      balance={
                        (fromAssetList || []).find(
                          (asset) => asset.symbol === fromAsset,
                        )?.balance || 0
                      }
                      selectedAsset={fromAsset}
                      onSelectAsset={(from) => {
                        setFromAsset(from);
                        if (from === toAsset) {
                          setToAsset(toAsset === "SOL" ? "USDC" : "SOL");
                        }
                      }}
                      disableAmountInput={exactMode === "ExactOut"}
                      isLoading={isSwapFromAmountLoading}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(event) => handleFlip(event)}
                      className="mt-8 min-w-10"
                    >
                      <ColumnSpacingIcon />
                    </Button>
                    <SlippageInput
                      name="slippage"
                      label="Slippage"
                      symbol={swapForm.watch("slippageUnit")}
                      className="min-w-1/3 w-1/3"
                    />
                    <AssetInput
                      className="min-w-1/3 w-1/3"
                      name="to"
                      label="To"
                      assets={jupTokenList?.map(
                        (t) =>
                          ({
                            name: t.name,
                            symbol: t.symbol,
                            address: t.address,
                            decimals: t.decimals,
                            balance: 0,
                          }) as Asset,
                      )}
                      balance={
                        /* use fromAssetList because that's the list of tokens in treasury.
                           all other tokens have 0 balance. */
                        (fromAssetList || []).find(
                          (asset) => asset.symbol === toAsset,
                        )?.balance || 0
                      }
                      selectedAsset={toAsset}
                      onSelectAsset={(to) => {
                        setToAsset(to);
                        if (to === fromAsset) {
                          setFromAsset(fromAsset === "SOL" ? "USDC" : "SOL");
                        }
                      }}
                      disableAmountInput={exactMode === "ExactIn"}
                      isLoading={isSwapToAmountLoading}
                    />
                  </div>

                  <div className="flex space-x-4 w-full items-end">
                    <PriorityFeeInput
                      className="min-w-1/3 w-1/3"
                      name="priorityFeeOverride"
                      label="Priority Fee"
                      symbol={
                        swapForm.watch("priorityFeeOverrideUnit") || "SOL"
                      }
                    />
                    <Button
                      className="w-1/3"
                      variant="ghost"
                      onClick={(event) => handleClear(event)}
                    >
                      Clear
                    </Button>
                    <Button
                      className="w-1/3"
                      type="submit"
                      loading={isSubmitTxPending}
                    >
                      Swap
                    </Button>
                  </div>

                  {exactMode === "ExactOut" ? <ExactOutWarning /> : null}

                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="font-light text-muted-foreground text-sm hover:text-foreground transition-all hover:no-underline">
                        Advanced Settings
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-row gap-4 items-start">
                          <FormItem>
                            <FormLabel>Venues</FormLabel>
                            <div className="space-y-4">
                              <span className="flex w-full gap-4">
                                <FormField
                                  control={swapForm.control}
                                  name="filterType"
                                  render={({ field }) => (
                                    <ToggleGroup
                                      type="single"
                                      value={field.value}
                                      onValueChange={(value) => {
                                        swapForm.setValue(
                                          "filterType",
                                          value as "Include" | "Exclude",
                                        );
                                      }}
                                      className="justify-start"
                                    >
                                      <ToggleGroupItem value="Exclude">
                                        Exclude
                                      </ToggleGroupItem>
                                      <ToggleGroupItem value="Include">
                                        Include
                                      </ToggleGroupItem>
                                    </ToggleGroup>
                                  )}
                                />

                                <Input
                                  type="search"
                                  placeholder="Search venues..."
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  className=""
                                />
                              </span>

                              <ScrollArea className="h-[300px] w-full border p-4">
                                <FormItem>
                                  {isDexesListLoading // Skeleton loading state
                                    ? Array.from({ length: 10 }).map(
                                        (_, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center space-x-3 mb-2"
                                          >
                                            <Skeleton className="w-4 h-4" />
                                            <Skeleton className="w-[200px] h-[20px]" />
                                          </div>
                                        ),
                                      )
                                    : filteredDexes.map((item) => (
                                        <FormField
                                          key={item.id}
                                          control={swapForm.control}
                                          name="dexes"
                                          render={({ field }) => (
                                            <FormItem
                                              key={item.id}
                                              className="flex flex-row items-start space-x-3 space-y-0 mb-2"
                                            >
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value?.includes(
                                                    item.label,
                                                  )}
                                                  onCheckedChange={(
                                                    checked,
                                                  ) => {
                                                    const val = checked
                                                      ? [
                                                          ...field.value,
                                                          item.label,
                                                        ]
                                                      : field.value?.filter(
                                                          (value) =>
                                                            value !==
                                                            item.label,
                                                        );
                                                    return field.onChange(val);
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
                                        value="ExactIn"
                                        aria-label="Exact In"
                                      >
                                        Exact In
                                      </ToggleGroupItem>
                                      <ToggleGroupItem
                                        value="ExactOut"
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
                                        field.onChange(
                                          parseInt(e.target.value, 10),
                                        )
                                      }
                                      value={field.value}
                                      className="w-full"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
                          <div>
                            <FormLabel>Venue</FormLabel>
                            {field.value === "Drift" && (
                              <DriftUserLink address={driftUserAccount} />
                            )}
                          </div>

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
                                  ),
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
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value
                                    ? spotMarkets.find(
                                        (spotMarket) =>
                                          spotMarket.value === field.value,
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
                                            "market",
                                            spotMarket.value,
                                          );
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            spotMarket.value === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
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
                      name="orderType"
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
                                {spotSchema.shape.orderType._def.values.map(
                                  (option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ),
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
                            <FormLabel>Side</FormLabel>
                            <ToggleGroup
                              type="single"
                              value={field.value}
                              onValueChange={handleSideChange}
                              className="w-full gap-4 mt-2"
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

                  {["Limit", "Market"].includes(spotOrderType) ? (
                    <>
                      <div className="flex space-x-4 items-start">
                        {spotOrderType === "Limit" ? (
                          <AssetInput
                            className="min-w-1/3 w-1/3"
                            name="limitPrice"
                            label="Limit Price"
                            balance={NaN}
                            selectedAsset="USDC"
                            hideBalance={true}
                            disableAssetChange={true}
                          />
                        ) : (
                          <SlippageInput
                            name="slippage"
                            label="Slippage"
                            symbol={spotForm.watch("slippageUnit") || "%"}
                            className="min-w-1/3 w-1/3"
                          />
                        )}
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="size"
                          label="Size"
                          balance={NaN}
                          selectedAsset={spotForm
                            .watch("market")
                            .replace("/USDC", "")}
                          disableAssetChange={true}
                        />
                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="notional"
                          label="Notional"
                          selectedAsset="USDC"
                          balance={NaN}
                          disableAssetChange={true}
                          disableAmountInput={true}
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
                          balance={NaN}
                          selectedAsset="USDC"
                          hideBalance={true}
                          disableAssetChange={true}
                        />
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="limitPrice"
                          label="Limit Price"
                          balance={NaN}
                          selectedAsset="USDC"
                          hideBalance={true}
                          disableAssetChange={true}
                        />
                      </div>
                      <div className="flex space-x-4 items-start">
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="size"
                          label="Size"
                          balance={NaN}
                          selectedAsset={spotForm
                            .watch("market")
                            .replace("/USDC", "")}
                        />
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="notional"
                          label="Notional"
                          balance={NaN}
                          selectedAsset="USDC"
                          disableAssetChange={true}
                          disableAmountInput={true}
                        />
                      </div>
                    </>
                  ) : null}

                  <>
                    {spotOrderType !== "Trigger Limit" &&
                      !spotReduceOnly && ( // <div className="flex flex-row gap-4 items-start w-full">
                        //   <LeverageInput
                        //     control={spotForm.control}
                        //     name="leverage"
                        //     label="Leverage: 100x"
                        //     min={0}
                        //     max={100}
                        //     step={1}
                        //   />
                        // </div>
                        <span></span>
                      )}
                  </>

                  <div className="flex space-x-4 w-full items-end">
                    <PriorityFeeInput
                      className="min-w-1/3 w-1/3"
                      name="priorityFeeOverride"
                      label="Priority Fee"
                      symbol={
                        spotForm.watch("priorityFeeOverrideUnit") || "SOL"
                      }
                    />
                    <Button
                      className="w-1/3"
                      variant="ghost"
                      onClick={(event) => handleClear(event)}
                    >
                      Clear
                    </Button>
                    <Button
                      className="w-1/3"
                      type="submit"
                      loading={isSubmitTxPending}
                    >
                      Submit
                    </Button>
                  </div>
                  <br />
                  <div className="flex space-x-4 w-full">
                    <div className="flex w-1/2">
                      <Button
                        variant="outline"
                        className="rounded-r-none px-8 py-2 w-1/2"
                        loading={isCancelTxPending}
                        onClick={(event) => handleCancel(event, "Spot")}
                      >
                        Cancel
                      </Button>
                      <ToggleGroup
                        type="single"
                        value={cancelValue}
                        onValueChange={(value) => {
                          if (value) setCancelValue(value);
                        }}
                        className="border border-l-0 rounded-l-none h-10 gap-0 w-1/2"
                      >
                        <ToggleGroupItem
                          value="cancelAll"
                          aria-label="Cancel All"
                          className="
                          text-muted-foreground
                          border
                          border-l-0
                          data-[state=on]:border
                          data-[state=on]:border-l-0
                          px-4 data-[state=on]:bg-secondary data-[state=on]:text-foreground h-10 grow"
                        >
                          All
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="cancelMarket"
                          aria-label="Cancel Market"
                          className="
                          text-muted-foreground
                          border
                          border-l-0
                          border-r-0
                          data-[state=on]:border
                          data-[state=on]:border-l-0
                          data-[state=on]:border-r-0
                          px-4 data-[state=on]:bg-secondary data-[state=on]:text-foreground h-10 grow"
                        >
                          <span className="truncate">
                            {spotForm.watch("market").replace("/USDC", "")}
                          </span>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div className="w-1/2"></div>

                    {/*<Button variant="outline" className="w-1/2">*/}
                    {/*  Claim Rewards*/}
                    {/*</Button>*/}
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
                          <div>
                            <FormLabel>Venue</FormLabel>
                            {field.value === "Drift" && (
                              <DriftUserLink address={driftUserAccount} />
                            )}
                          </div>

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
                                  ),
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
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value
                                    ? perpsMarkets.find(
                                        (perpsMarket) =>
                                          perpsMarket.value === field.value,
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
                                            "market",
                                            perpsMarket.value,
                                          );
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            perpsMarket.value === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
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
                      name="orderType"
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
                                {perpsSchema.shape.orderType._def.values.map(
                                  (option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ),
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
                        control={perpsForm.control}
                        name="side"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Side</FormLabel>
                            <ToggleGroup
                              type="single"
                              value={field.value}
                              onValueChange={handleSideChange}
                              className="w-full gap-4 mt-2"
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
                  {["Limit", "Market"].includes(perpsOrderType) ? (
                    <>
                      <div className="flex space-x-4 items-start">
                        {perpsOrderType === "Limit" ? (
                          <AssetInput
                            className="min-w-1/3 w-1/3"
                            name="limitPrice"
                            label="Limit Price"
                            balance={NaN}
                            selectedAsset="USDC"
                            hideBalance={true}
                            disableAssetChange={true}
                          />
                        ) : (
                          <SlippageInput
                            name="slippage"
                            label="Slippage"
                            symbol={perpsForm.watch("slippageUnit") || "%"}
                            className="min-w-1/3 w-1/3"
                          />
                        )}

                        <AssetInput
                          className="min-w-1/3 w-1/3"
                          name="size"
                          label="Size"
                          selectedAsset={perpsForm
                            .watch("market")
                            .replace("-PERP", "")}
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
                          disableAmountInput={true}
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
                          balance={NaN}
                          selectedAsset="USDC"
                          hideBalance={true}
                          disableAssetChange={true}
                        />
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="trigger-price"
                          label="Trigger Price"
                          balance={NaN}
                          selectedAsset="USDC"
                          hideBalance={true}
                          disableAssetChange={true}
                        />
                      </div>
                      <div className="flex space-x-4 items-start">
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="size"
                          label="Size"
                          balance={NaN}
                          selectedAsset={perpsForm
                            .watch("market")
                            .replace("-PERP", "")}
                        />
                        <AssetInput
                          className="min-w-1/2 w-1/2"
                          name="notional"
                          label="Notional"
                          balance={NaN}
                          selectedAsset="USDC"
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
                                <InfoCircledIcon className="w-4 h-4 mr-1"></InfoCircledIcon>
                                <p>Leverage Limit Enabled</p>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                Please view the Risk Management configuration of
                                the Venue Integration.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex space-x-4 w-full items-end">
                    <PriorityFeeInput
                      className="min-w-1/3 w-1/3"
                      name="priorityFeeOverride"
                      label="Priority Fee"
                      symbol={
                        perpsForm.watch("priorityFeeOverrideUnit") || "SOL"
                      }
                    />
                    <Button
                      className="w-1/3"
                      variant="ghost"
                      onClick={(event) => handleClear(event)}
                    >
                      Clear
                    </Button>
                    <Button
                      className="w-1/3"
                      type="submit"
                      loading={isSubmitTxPending}
                    >
                      Submit
                    </Button>
                  </div>
                  <br />
                  <div className="flex space-x-4 w-full">
                    <div className="flex w-1/2">
                      <Button
                        variant="outline"
                        className="rounded-r-none px-8 py-2 w-1/2"
                        loading={isCancelTxPending}
                        onClick={(event) => handleCancel(event, "Perps")}
                      >
                        Cancel
                      </Button>
                      <ToggleGroup
                        type="single"
                        value={cancelValue}
                        onValueChange={(value) => {
                          if (value) setCancelValue(value);
                        }}
                        className="border border-l-0 rounded-l-none h-10 gap-0 w-1/2"
                      >
                        <ToggleGroupItem
                          value="cancelAll"
                          aria-label="Cancel All"
                          className="
                          text-muted-foreground
                          border
                          border-l-0
                          data-[state=on]:border
                          data-[state=on]:border-l-0
                          px-4 data-[state=on]:bg-secondary data-[state=on]:text-foreground h-10 grow"
                        >
                          All
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="cancelMarket"
                          aria-label="Cancel Market"
                          className="
                          text-muted-foreground
                          border
                          border-l-0
                          border-r-0
                          data-[state=on]:border
                          data-[state=on]:border-l-0
                          data-[state=on]:border-r-0
                          px-4 data-[state=on]:bg-secondary data-[state=on]:text-foreground h-10 grow"
                        >
                          <span className="truncate">
                            {perpsForm.watch("market").replace("-PERP", "")}
                          </span>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    <div className="flex w-1/2">
                      <Button
                        variant="outline"
                        className="rounded-r-none px-8 py-2 w-1/2"
                        loading={isSettleTxPending}
                        onClick={(event) => handleSettle(event)}
                      >
                        Settle P&L
                      </Button>
                      <ToggleGroup
                        type="single"
                        value={settleValue}
                        onValueChange={(value) => {
                          if (value) setSettleValue(value);
                        }}
                        className="border border-l-0 rounded-none h-10 gap-0 w-1/2"
                      >
                        <ToggleGroupItem
                          value="settlePnL"
                          aria-label="Settle PnL"
                          className="
                          text-muted-foreground
                          border
                          border-l-0
                          data-[state=on]:border
                          data-[state=on]:border-l-0
                          px-4 data-[state=on]:bg-secondary data-[state=on]:text-foreground h-10 grow"
                        >
                          All
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="settleMarket"
                          aria-label="Settle Market"
                          className="
                          text-muted-foreground
                          border
                          border-l-0
                          border-r-0
                          data-[state=on]:border
                          data-[state=on]:border-l-0
                          data-[state=on]:border-r-0
                          px-4 data-[state=on]:bg-secondary data-[state=on]:text-foreground h-10 grow"
                        >
                          <span className="truncate">
                            {perpsForm.watch("market").replace("-PERP", "")}
                          </span>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    {/*<Button variant="outline" className="w-1/3">*/}
                    {/*  Claim Rewards*/}
                    {/*</Button>*/}
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

function DriftUserLink({ address }: { address: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            className="ml-2 text-muted-foreground inline-flex align-middle"
            href={`https://app.drift.trade/?userAccount=${address}`}
            target="_blank"
          >
            <ExternalLinkIcon></ExternalLinkIcon>
          </a>
        </TooltipTrigger>
        <TooltipContent side="right">
          <TruncateAddress address={address} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
