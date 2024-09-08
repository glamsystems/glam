"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
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
import { ColumnSpacingIcon } from "@radix-ui/react-icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Asset, AssetInput } from "@/components/AssetInput";
import React, { useState, useEffect, useMemo } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { MSOL, useGlam, WSOL } from "@glam/anchor/react";
import { ExplorerLink } from "@/components/ExplorerLink";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const items = [
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
] as const;

const tradeSchema = z.object({
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

type TradeSchema = z.infer<typeof tradeSchema>;

export default function Trade() {
  const { fund: fundPDA, treasury, wallet, glamClient, tokenList } = useGlam();
  const [fromAsset, setFromAsset] = useState<string>("SOL");
  const [toAsset, setToAsset] = useState<string>("SOL");

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

  const form = useForm<TradeSchema>({
    resolver: zodResolver(tradeSchema),
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

  const onSubmit: SubmitHandler<TradeSchema> = async (values, event) => {
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
    form.reset({
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
    console.log("Form reset:", form.getValues());
  };

  const handleFlip = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);

    const fromValue = form.getValues("from");
    const toValue = form.getValues("to");
  };

  useEffect(() => {
    form.setValue("fromAsset", fromAsset);
    form.setValue("toAsset", toAsset);
    console.log("Assets updated:", { fromAsset, toAsset });
  }, [fromAsset, toAsset, form]);

  const handleExactModeChange = (value: string) => {
    if (value) {
      form.setValue("exactMode", value as "ExactIn" | "ExactOut");
    }
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex space-x-4">
                <FormField
                  control={form.control}
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
                            {tradeSchema.shape.venue._def.values.map(
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
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="w-1/2">
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {tradeSchema.shape.type._def.values.map(
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
                  control={form.control}
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
              <div className="flex space-x-4 items-center">
                <FormField
                  control={form.control}
                  name="exactMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={handleExactModeChange}
                        className="flex space-x-2"
                      >
                        <ToggleGroupItem value="exact-in" aria-label="Exact In">
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
                <FormField
                  control={form.control}
                  name="maxAccounts"
                  render={({ field }) => (
                    <FormItem>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex space-x-4 items-center">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                      <FormLabel htmlFor="use-wsol" className="font-normal">
                        Use wSOL
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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

              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Allowed Exchanges</FormLabel>
                  <FormDescription>
                    Select the allowed exchanges.
                  </FormDescription>
                </div>
                {items.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="items"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked: boolean) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value: string) => value !== item.id
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
                <FormMessage />
              </FormItem>

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
      </div>
    </PageContentWrapper>
  );
}
