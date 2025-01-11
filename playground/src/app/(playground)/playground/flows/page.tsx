"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

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
import { toast } from "@/components/ui/use-toast";
import { AssetInput } from "@/components/AssetInput";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import React, { useState, useEffect } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { StateModel, useGlam, WSOL } from "@glam/anchor/react";
import { BN } from "@coral-xyz/anchor";
import { ExplorerLink } from "@/components/ExplorerLink";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import NumberFormatter from "@/utils/NumberFormatter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CaretSortIcon } from "@radix-ui/react-icons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import Sparkle from "@/utils/Sparkle";
import { parseTxError } from "@/lib/error";
import { getPriorityFeeMicroLamports } from "@/app/(shared)/settings/priorityfee";

const flowSchema = z.object({
  method: z.string(),
  amountIn: z.number().nonnegative(),
});

type FlowSchema = z.infer<typeof flowSchema>;

export type assetBalancesMap = {
  [key: string]: number;
};

function InvestorDisclaimers({
  fund,
  direction,
  method,
}: {
  fund?: StateModel;
  direction: string;
  method: string;
}) {
  const share = fund?.mints[0];
  if (!fund || !share) return null;

  const lockUp = Number(share?.lockUpPeriodInSeconds || 0);
  let lockUpStr;
  if (lockUp < 120) {
    lockUpStr = lockUp + " seconds";
  } else if (lockUp < 120 * 60) {
    lockUpStr = lockUp / 60 + " minutes";
  } else if (lockUp < 48 * 60 * 60) {
    lockUpStr = lockUp / 3600 + " hours";
  } else {
    lockUpStr = lockUp / (24 * 3600) + " days";
  }

  return direction === "redeem" ? (
    <TooltipProvider>
      <div className="grid gap-3 text-sm">
        <div className="font-semibold">Redemption Details</div>
        <ul className="grid gap-3">
          {fund?.shareClassMints[0] ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Share Class Address
              </span>
              <span>
                <p className="font-semibold">
                  <ExplorerLink
                    path={`/account/${fund?.shareClassMints[0]}`}
                    label={fund?.shareClassMints[0].toBase58()}
                  />
                </p>
              </span>
            </li>
          ) : null}

          {/* Method: in-kind vs currency */}
          {method === "in-kind" ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                In-Kind
              </span>
              <span>
                <p className="font-semibold">
                  You will receive a portion of existing assets of the fund.
                </p>
              </span>
            </li>
          ) : (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Share Class Currency
              </span>
              <span>
                <p className="font-semibold">
                  You will receive {fund.rawOpenfunds?.fundCurrency}
                </p>
              </span>
            </li>
          )}

          {/* Lockup period */}
          {share.rawOpenfunds?.hasLockUpForRedemption ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Lock-up Period
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="h-4 w-4 p-0 ml-1">
                      <InfoIcon className="h-3 w-3" />
                      <span className="sr-only">More info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>
                      Shares will be restricted from redemption or transfer for
                      a period of{" "}
                      <span className="font-semibold">{lockUpStr}</span>{" "}
                      following subscription.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span>
                <p className="font-semibold">{lockUpStr}</p>
              </span>
            </li>
          ) : null}

          {/* Minimal redemption */}
          {share?.rawOpenfunds?.minimalRedemptionCategory === "amount" ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Minimal Redemption Amount
              </span>
              <span>
                <NumberFormatter
                  value={Number(
                    share?.rawOpenfunds?.minimalInitialRedemptionInAmount,
                  )}
                  maxDecimalPlaces={2}
                  addCommas={true}
                />{" "}
                {share.rawOpenfunds?.currencyOfMinimalOrMaximumRedemption}
              </span>
            </li>
          ) : share.rawOpenfunds?.minimalRedemptionCategory === "shares" ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Minimal Redemption Amount
              </span>
              <span>
                <p className="font-semibold">
                  <NumberFormatter
                    value={Number(
                      share.rawOpenfunds.minimalInitialRedemptionInShares,
                    )}
                    maxDecimalPlaces={2}
                    addCommas={true}
                  />{" "}
                  Share
                </p>
              </span>
            </li>
          ) : null}

          {/* Maximum redemption */}
          {/* TODO: maximumRedemptionCategory (but there's a bug with on-chain data) */}
          {share.rawOpenfunds?.maximumInitialRedemptionInShares ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Maximal Redemption Amount
              </span>
              <span>
                <p className="font-semibold">
                  <NumberFormatter
                    value={Number(
                      share.rawOpenfunds.maximumInitialRedemptionInShares,
                    )}
                    maxDecimalPlaces={2}
                    addCommas={true}
                  />{" "}
                  Share
                </p>
              </span>
            </li>
          ) : null}
        </ul>
      </div>
    </TooltipProvider>
  ) : (
    <TooltipProvider>
      <div className="grid gap-3 text-sm">
        <div className="font-semibold">Subscription Details</div>
        <ul className="grid gap-3">
          {/* Share Class Link */}
          {!!fund?.shareClassMints?.length ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Share Class Address
              </span>
              <span>
                <p className="font-semibold">
                  <ExplorerLink
                    path={`/account/${fund?.shareClassMints[0]}`}
                    label={fund?.shareClassMints[0].toBase58()}
                  />
                </p>
              </span>
            </li>
          ) : null}

          {/* Minimal subscription */}
          {share?.rawOpenfunds?.minimalInitialSubscriptionCategory ===
          "amount" ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Minimal Subscription Amount{" "}
              </span>
              <span>
                <p className="font-semibold">
                  <NumberFormatter
                    value={Number(
                      share.rawOpenfunds.minimalInitialSubscriptionInAmount,
                    )}
                    maxDecimalPlaces={2}
                    addCommas={true}
                  />{" "}
                  {share.rawOpenfunds.currencyOfMinimalSubscription}
                </p>
              </span>
            </li>
          ) : share.rawOpenfunds?.minimalInitialSubscriptionCategory ===
            "shares" ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Minimal Subscription Amount{" "}
              </span>
              <span>
                <p className="font-semibold">
                  {share.rawOpenfunds.minimalInitialSubscriptionInShares} Share
                </p>
              </span>
            </li>
          ) : null}

          {/* Lockup period */}
          {share?.rawOpenfunds?.hasLockUpForRedemption ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Lock-up Period
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="h-4 w-4 p-0 ml-1">
                      <InfoIcon className="h-3 w-3" />
                      <span className="sr-only">More info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>
                      Shares will be restricted from{" "}
                      <span className="font-semibold underline">
                        redemption or transfer
                      </span>{" "}
                      for a period of {lockUpStr}.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span>
                <p className="font-semibold">{lockUpStr}</p>
              </span>
            </li>
          ) : null}

          {/* Minimal redemption */}
          {share.rawOpenfunds?.minimalRedemptionCategory === "amount" ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Minimal Redemption Amount
              </span>
              <span>
                <p className="font-semibold">
                  <NumberFormatter
                    value={Number(
                      share.rawOpenfunds.minimalInitialRedemptionInAmount,
                    )}
                    maxDecimalPlaces={2}
                    addCommas={true}
                  />{" "}
                  {share.rawOpenfunds.currencyOfMinimalOrMaximumRedemption}
                </p>
              </span>
            </li>
          ) : share.rawOpenfunds?.minimalRedemptionCategory === "shares" ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Minimal Redemption Amount
              </span>
              <span>
                <p className="font-semibold">
                  <NumberFormatter
                    value={Number(
                      share.rawOpenfunds.minimalInitialRedemptionInShares,
                    )}
                    maxDecimalPlaces={2}
                    addCommas={true}
                  />{" "}
                  Share
                </p>
              </span>
            </li>
          ) : null}

          {/* Maximum redemption */}
          {/* TODO: maximumRedemptionCategory (but there's a bug with on-chain data) */}
          {share.rawOpenfunds?.maximumInitialRedemptionInShares ? (
            <li className="border-b pb-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                Maximal Redemption Amount
              </span>
              <span>
                <p className="font-semibold">
                  <NumberFormatter
                    value={Number(
                      share.rawOpenfunds.maximumInitialRedemptionInShares,
                    )}
                    maxDecimalPlaces={2}
                    addCommas={true}
                  />{" "}
                  Share
                </p>
              </span>
            </li>
          ) : null}
        </ul>
      </div>
    </TooltipProvider>
  );
}

function InvestorWidget({ fundModel }: { fundModel?: StateModel }) {
  const { glamClient, userWallet } = useGlam();
  const queryClient = useQueryClient();
  const [isTxPending, setIsTxPending] = useState(false);

  const [direction, setDirection] = useState<string>("subscribe");
  const [method, setMethod] = useState<string>("share class currency");
  const [amountIn, setAmountIn] = useState<number>(0);

  const [amountInAsset, setAmountInAsset] = useState<string>("SOL");
  const [balance, setBalance] = useState<number>(
    (userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL,
  );

  const form = useForm<FlowSchema>({
    resolver: zodResolver(flowSchema),
    defaultValues: {
      method,
      amountIn,
    },
  });

  // reset form values when fundId changes
  useEffect(() => {
    setAmountIn(0);
    setBalance(0);

    if (direction === "redeem") {
      const symbol = fundModel?.mints[0]?.symbol || "Share";
      const mint = fundModel?.shareClassMints[0];
      setAmountInAsset(symbol);

      if (mint) {
        const tokenAccount = (userWallet?.tokenAccounts || []).find(
          (a) => a.mint.toBase58() === mint.toBase58(),
        );
        if (tokenAccount) {
          setBalance(tokenAccount.uiAmount);
        }
      }
      return;
    }

    // direction === "subscribe"
    setAmountInAsset(fundModel?.rawOpenfunds?.fundCurrency || "SOL");

    // update balance
    const mint = fundModel?.assets[0] || WSOL;
    if (WSOL.equals(mint)) {
      setBalance((userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL);
    } else {
      const tokenAccount = (userWallet?.tokenAccounts || []).find(
        (a) => a.mint.toBase58() === mint.toBase58(),
      );
      if (tokenAccount) {
        setBalance(tokenAccount.uiAmount);
      }
    }
  }, [fundModel, direction, userWallet]);

  const getDecimals = (asset: PublicKey, mintsList: any[]) => {
    if (WSOL.equals(asset)) {
      return 9;
    } else {
      const mint = (mintsList || []).find((t) => t.mint === asset.toBase58());
      if (!mint) {
        throw Error("Invalid asset or zero balance");
      }
      return mint.decimals;
    }
  };

  const onSubmit: SubmitHandler<FlowSchema> = async (
    values: FlowSchema,
    event,
  ) => {
    const nativeEvent = event as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };
    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") !== "submit") {
      return;
    }

    // Validation:
    // - fund must be valid
    // - amount > 0

    if (!fundModel) {
      toast({
        title: "Please select a product.",
        variant: "destructive",
      });
      return;
    }

    if (values.amountIn <= 0) {
      toast({
        title: "Please enter an amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    // Submit tx
    //
    // The user can only subscribe/redeem if he has a positive balance.
    // To keep the code simpler, we fetch the decimals from the user's
    // wallet balances.
    // TODO: fetch decimals from a known list of all assets.
    //
    // Note: there's an edge case where the user doesn't have a
    // token account, but he manually inputs a value > 0.
    // In that case we throw Error("Invalid asset or zero balance").
    setIsTxPending(true);
    let txId;
    try {
      if (direction === "redeem") {
        const shareClassMint = fundModel?.shareClassMints[0];
        const ata = (userWallet?.tokenAccounts || []).find((a) =>
          a.mint.equals(shareClassMint),
        )!;
        const amount = new BN(values.amountIn * 10 ** ata.decimals);

        txId = await glamClient.investor.redeem(
          fundModel.id!,
          amount,
          method === "in-kind",
          undefined,
          0,
          true,
          {
            getPriorityFeeMicroLamports,
          },
        );
      } else {
        const asset = fundModel.assets[0];
        const ata = (userWallet?.tokenAccounts || []).find((a) =>
          a.mint.equals(asset),
        )!;

        const amount = new BN(values.amountIn * 10 ** ata.decimals);
        txId = await glamClient.investor.subscribe(
          fundModel.id!,
          asset,
          amount,
          fundModel,
          0,
          true,
          {
            getPriorityFeeMicroLamports,
          },
        );
      }

      queryClient.invalidateQueries({ queryKey: userWallet?.queryKey });
      toast({
        title: `Successful ${direction}`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      toast({
        title: `Failed to ${direction}`,
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setIsTxPending(false);
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
    setAmountIn(0);
  };

  const handleModeChange = (value: string) => {
    if (!value) return;
    setDirection(value);
  };

  return (
    <div>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex">
              <FormItem className="w-full">
                <FormLabel>Direction</FormLabel>
                <ToggleGroup
                  disabled={!fundModel}
                  type="single"
                  value={direction}
                  onValueChange={handleModeChange}
                  className="w-full space-x-4"
                >
                  <ToggleGroupItem
                    value="subscribe"
                    aria-label="Subscribe"
                    className="w-1/2"
                  >
                    Subscribe
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="redeem"
                    aria-label="Redeem"
                    className="w-1/2"
                  >
                    Redeem
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormItem>
            </div>

            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem
                    className="w-1/2"
                    style={{
                      visibility: direction === "redeem" ? "visible" : "hidden",
                    }}
                  >
                    <FormLabel>Method</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          form.setValue(
                            "method",
                            value as FlowSchema["method"],
                          );
                          setMethod(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Method">
                            {field.value === "in-kind"
                              ? "In-Kind"
                              : field.value
                                  .split(" ")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1),
                                  )
                                  .join(" ")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {["share class currency", "in-kind"].map((option) => (
                            <SelectItem
                              className="capitalize"
                              key={option}
                              value={option}
                            >
                              {option.charAt(0).toUpperCase() + option.slice(1)}
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
            <div className="flex space-x-4 w-full  mt-4">
              <Button
                className="w-1/2"
                variant="ghost"
                onClick={(event) => handleClear(event)}
              >
                Clear
              </Button>
              <Button className="w-1/2" type="submit" loading={isTxPending}>
                {direction.charAt(0).toUpperCase() + direction.slice(1)}
              </Button>
            </div>
          </form>
        </Form>
      </FormProvider>
      <br />
      <br />
      <InvestorDisclaimers
        fund={fundModel}
        direction={direction}
        method={method}
      />
    </div>
  );
}

export default function Flows() {
  const { allFunds } = useGlam();
  const [selectedFund, setSelectedFund] = useState<StateModel>();
  const [open, setOpen] = React.useState(false);

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild className="mb-4">
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full pl-2 justify-between"
            >
              <span className="flex flex-row align-center">
                <span className="mr-2">
                  {selectedFund ? (
                    <Sparkle address={selectedFund.sparkleKey} size={24} />
                  ) : (
                    <div className="h-[24px] w-[24px] border"></div>
                  )}
                </span>
                <span className="leading-6">
                  {selectedFund ? selectedFund.name : "Select product..."}
                </span>
              </span>
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search product..." />
              <CommandList>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  {allFunds
                    .filter((f) => f.mints.length > 0)
                    .map((f) => (
                      <CommandItem
                        key={f.idStr}
                        onSelect={() => {
                          setSelectedFund(f);
                          setOpen(false);
                        }}
                        className="flex items-center"
                      >
                        <span className="mr-2">
                          <Sparkle address={f.sparkleKey} size={24} />
                        </span>
                        {f.name}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <InvestorWidget fundModel={selectedFund} />
      </div>
    </PageContentWrapper>
  );
}
