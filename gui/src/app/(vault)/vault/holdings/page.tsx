"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { AssetInput } from "@/components/AssetInput";
import { useForm, FormProvider } from "react-hook-form";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { z } from "zod";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam, WSOL } from "@glamsystems/glam-sdk/react";
import { Holding } from "./data/holdingSchema";
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
import { ClickToCopyText } from "@/components/ClickToCopyText";
import { Button } from "@/components/ui/button";
import QRCodeStyling from "@solana/qr-code-styling";
import { DangerCard } from "@/components/DangerCard";
import { parseTxError } from "@/lib/error";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";
import {
  getPriorityFeeMicroLamports,
  getMaxCapFeeLamports,
} from "@/app/(shared)/settings/priorityfee";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, InfoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { PencilIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { TransferForm } from "./components/transfer-form";

const SKELETON_ROW_COUNT = 5;

const VaultQRCode = React.memo(({ pubkey }: { pubkey: string }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [isQRCodeRendered, setIsQRCodeRendered] = useState(false);

  // Create QR code instance only when we have all required data
  const qrCode = useMemo(() => {
    if (!pubkey || !resolvedTheme) return null;

    const isDark = resolvedTheme === "dark";
    return new QRCodeStyling({
      width: 200,
      height: 200,
      type: "svg",
      data: `solana:${pubkey}`,
      dotsOptions: {
        color: isDark ? "#ffffff" : "#000000",
        type: "rounded",
      },
      cornersSquareOptions: {
        type: "square",
        color: isDark ? "#ffffff" : "#000000",
      },
      cornersDotOptions: {
        type: "square",
        color: isDark ? "#ffffff" : "#000000",
      },
      backgroundOptions: {
        color: isDark ? "#000000" : "#ffffff",
      },
    });
  }, [pubkey, resolvedTheme]);

  // Effect for handling QR code rendering and cleanup
  useEffect(() => {
    if (!qrRef.current || !qrCode) {
      setIsQRCodeRendered(false);
      return;
    }

    const renderQRCode = () => {
      if (!qrRef.current) return;
      qrRef.current.innerHTML = "";
      qrCode.append(qrRef.current);
      setIsQRCodeRendered(true);
    };

    // Initial render
    const timeoutId = setTimeout(renderQRCode, 0);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
        setIsQRCodeRendered(false);
      }
    };
  }, [qrCode]);

  return (
    <div className="relative bg-background rounded-lg p-4">
      <div
        ref={qrRef}
        className="w-[200px] h-[200px] transition-opacity duration-200"
        style={{ opacity: isQRCodeRendered ? 1 : 0 }}
      />
      {!isQRCodeRendered && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-[200px] h-[200px]" />
        </div>
      )}
    </div>
  );
});

export default function Holdings() {
  const {
    activeGlamState,
    vault,
    driftMarketConfigs,
    driftUser,
    jupTokenList,
    prices,
    glamClient,
    setActiveGlamState,
    refresh,
    userWallet,
  } = useGlam();

  const [showZeroBalances, setShowZeroBalances] = useState(true);
  const [isLoadingData, setIsLoading] = useState(true);
  const [txStatus, setTxStatus] = useState({ rename: false, close: false });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false);
  const [isWithdrawSheetOpen, setIsWithdrawSheetOpen] = useState(false);
  const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<string>("SOL");
  const [assetBalance, setAssetBalance] = useState(
    (userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL,
  );

  useEffect(() => {
    if (selectedAsset === "SOL") {
      setAssetBalance((userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL);
    }
  }, [userWallet?.balanceLamports, selectedAsset]);

  const depositForm = useForm({
    defaultValues: {
      amount: "",
    },
  });

  const handleAssetSelect = (asset: string) => {
    setSelectedAsset(asset);

    // Get balance from user wallet
    if (asset === "SOL") {
      setAssetBalance((userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL);
    } else {
      const tokenAccount = (userWallet?.tokenAccounts || []).find(
        (a) => a.mint.toBase58() === asset,
      );
      if (tokenAccount) {
        setAssetBalance(tokenAccount.uiAmount);
      } else {
        setAssetBalance(0);
      }
    }
  };
  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);
  const openDepositSheet = () => setIsDepositSheetOpen(true);
  const closeDepositSheet = () => setIsDepositSheetOpen(false);
  const openWithdrawSheet = () => setIsWithdrawSheetOpen(true);
  const closeWithdrawSheet = () => setIsWithdrawSheetOpen(false);
  const openTransferSheet = () => setIsTransferSheetOpen(true);
  const closeTransferSheet = () => setIsTransferSheetOpen(false);

  useEffect(() => {
    isSheetOpen ||
      isDepositSheetOpen ||
      isWithdrawSheetOpen ||
      isTransferSheetOpen ||
      refresh();
  }, [
    isSheetOpen,
    isDepositSheetOpen,
    isWithdrawSheetOpen,
    isTransferSheetOpen,
  ]);

  const createSkeletonHolding = (): Holding => ({
    name: "",
    symbol: "",
    mint: "",
    ata: "",
    price: 0,
    amount: "0",
    balance: 0,
    decimals: 0,
    notional: 0,
    logoURI: "",
    location: "",
    lst: false,
  });

  const skeletonData = useMemo(() => {
    return Array(SKELETON_ROW_COUNT).fill(null).map(createSkeletonHolding);
  }, []);

  const [tableData, setTableData] = useState<Holding[]>([]);

  const { resolvedTheme } = useTheme();

  // Effect for handling QR code rendering and cleanup
  useEffect(() => {
    const holdings: Holding[] = [];
    if (vault.uiAmount && vault.balanceLamports > 0) {
      const mint = WSOL.toBase58();
      const price = prices?.find((p) => p.mint === mint)?.price || 0;
      holdings.push({
        name: "Solana",
        symbol: "SOL",
        mint: "",
        ata: "",
        price,
        amount: vault?.balanceLamports.toString() || "NaN",
        balance: vault?.uiAmount || NaN,
        decimals: 9,
        notional: vault.uiAmount * price || 0,
        location: "vault",
        logoURI:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        lst: false,
      });
    }

    if (vault?.tokenAccounts) {
      holdings.push(
        ...vault.tokenAccounts.map(
          ({ mint, pubkey, amount, uiAmount, decimals }) => {
            const jupToken = jupTokenList?.find(
              (t) => t.address === mint.toBase58(),
            );
            const logoURI = jupToken?.logoURI || "";
            const name = jupToken?.name || "Unknown";
            const symbol = jupToken?.symbol || mint.toBase58();
            const price =
              prices?.find((p) => p.mint === mint.toBase58())?.price || 0;
            const tags = jupToken?.tags || [];

            return {
              name,
              symbol: symbol === "SOL" ? "wSOL" : symbol,
              mint: mint.toBase58(),
              ata: pubkey.toBase58(),
              price,
              amount,
              balance: uiAmount,
              decimals,
              notional: uiAmount * price || 0,
              logoURI,
              location: "vault",
              lst: tags.indexOf("lst") >= 0,
            };
          },
        ),
      );
    }

    const { spotPositions } = driftUser;

    if (spotPositions && spotPositions.length > 0) {
      const spotMarkets = driftMarketConfigs.spot;
      const driftHoldings = spotPositions.map((p) => {
        const market = spotMarkets.find((m) => m.marketIndex === p.marketIndex);
        const price = prices?.find((p) => p.mint === market?.mint)?.price || 0;
        // FIXME: balance is UI amount added by glam api, it doesn't existing in the drift sdk types
        // @ts-ignore
        const balance = Number(p.balance);
        const decimals = market?.decimals || 9;
        const amount = new BN(balance).mul(new BN(10 ** decimals));
        return {
          name: `${p.marketIndex}`,
          symbol: market?.symbol || "",
          mint: "NA",
          ata: "NA",
          price,
          amount: amount.toString(),
          balance,
          decimals,
          notional: balance * price || 0,
          logoURI: "https://avatars.githubusercontent.com/u/83389928?s=48&v=4",
          location: "drift",
          lst: false,
        };
      });
      holdings.push(...driftHoldings);
    }

    holdings.sort((a, b) => {
      if (b.location > a.location) return 1;
      if (b.location < a.location) return -1;
      return b.balance - a.balance;
    });
    setTableData(holdings);
  }, [vault, driftUser, jupTokenList, prices]);

  useEffect(() => {
    if (activeGlamState && vault && jupTokenList && prices) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [vault, jupTokenList, prices, activeGlamState]);

  const vaultAddress = vault?.pubkey ? vault.pubkey.toBase58() : "";
  const ownerAddress = activeGlamState?.owner
    ? activeGlamState.owner.toBase58()
    : "";

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const closeVault = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!activeGlamState?.pubkey) {
      return;
    }
    const statePda = activeGlamState.pubkey;

    const tokenAccounts = (tableData || [])
      .filter((d) => d.ata && d.location === "vault")
      .map((d) => new PublicKey(d.ata));

    let preInstructions = (
      await Promise.all(
        (tableData || [])
          .filter((d) => d.balance > 0 && d.mint && d.location === "vault")
          .map(async (d) => {
            console.log(`withdraw ${d.name} from ${d.location}`);
            return await glamClient.state.withdrawIxs(
              statePda,
              new PublicKey(d.mint),
              new BN(d.amount),
              {},
            );
          }),
      )
    ).flat();

    console.log("closing ATAs:", tokenAccounts);
    preInstructions.push(
      await glamClient.state.closeTokenAccountsIx(statePda, tokenAccounts),
    );

    setTxStatus((prev) => ({ ...prev, close: true }));
    try {
      const txSig = await glamClient.state.closeState(statePda, {
        preInstructions,
      });
      toast({
        title: "Vault closed",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });

      // Reload the page after 1 second if vault is closed
      window.setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      toast({
        title: "Error closing vault",
        description: parseTxError(e),
        variant: "destructive",
      });
    }

    setTxStatus((prev) => ({ ...prev, close: false }));
  };

  const renameVault = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!glamClient || !activeGlamState?.pubkey) return;

    setTxStatus((prev) => ({ ...prev, rename: true }));
    try {
      const txSig = await glamClient.state.updateState(activeGlamState.pubkey, {
        name: newName,
      });
      toast({
        title: "Name updated",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
      setIsEditingName(false);
      setActiveGlamState({ ...activeGlamState, name: newName });
    } catch (e) {
      toast({
        title: "Error updating vault name",
        description: parseTxError(e),
        variant: "destructive",
      });
    }
    setTxStatus((prev) => ({ ...prev, rename: false }));
  };

  return (
    <PageContentWrapper>
      <DataTable
        data={
          isLoadingData
            ? skeletonData
            : showZeroBalances
              ? tableData
              : tableData.filter((d) => d.balance > 0)
        }
        columns={columns}
        showZeroBalances={showZeroBalances}
        setShowZeroBalances={setShowZeroBalances}
        onOpenSheet={openSheet}
        onOpenDepositSheet={openDepositSheet}
        onOpenWithdrawSheet={openWithdrawSheet}
        onOpenTransferSheet={openTransferSheet}
      />
      <Sheet
        open={isSheetOpen}
        onOpenChange={(change) => {
          setIsSheetOpen(change);
          setIsEditingName(false);
        }}
      >
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent
          side="right"
          className="p-12 sm:max-w-none w-1/2 overflow-y-auto max-h-screen"
        >
          <SheetHeader>
            <SheetTitle>Vault Details</SheetTitle>
            <SheetDescription>
              Review vault information, account addresses, and closure controls.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-1 2xl:grid-cols-[200px_1fr] gap-6 py-6">
            <div className="flex flex-col items-center justify-start">
              {vault?.pubkey && (
                <VaultQRCode pubkey={vault.pubkey.toBase58()} />
              )}
              <div className="flex flex-row items-center justify-center mt-2">
                <p className="text-sm text-muted-foreground text-center">
                  This is your Vault address.
                </p>
                <Popover>
                  <PopoverTrigger>
                    <InfoIcon className="ml-2 w-4 h-4 text-muted-foreground" />
                  </PopoverTrigger>
                  <PopoverContent>
                    <p className="text-sm text-muted-foreground">
                      Deposit funds by scanning the QR code or copying the
                      address.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Name</p>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter vault name"
                      className="flex-1 py-0 h-10"
                    />
                    <Button
                      loading={txStatus.rename}
                      disabled={txStatus.rename}
                      variant="outline"
                      size="sm"
                      onClick={renameVault}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={txStatus.rename}
                      size="sm"
                      onClick={() => setIsEditingName(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 h-10">
                    <div
                      className="w-full justify-between flex flex-row items-center space-x-2 text-sm text-muted-foreground cursor-pointer"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNewName(activeGlamState?.name || "");
                        setIsEditingName(true);
                      }}
                    >
                      <span className="flex-1 text-sm font-medium">
                        {activeGlamState?.name || "Unnamed Vault"}
                      </span>
                      <PencilIcon className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Vault</p>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 h-10">
                  <ClickToCopyText text={vaultAddress} />
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="state">
                  <AccordionTrigger className="py-2 text-muted-foreground font-normal">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">Owner</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                        <ClickToCopyText text={ownerAddress} />
                      </div>
                      <div className="flex gap-2 items-center">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Assets sent to this account go to the Owner, not the
                          Vault.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="state">
                  <AccordionTrigger className="py-2 text-muted-foreground font-normal">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">State</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                        <ClickToCopyText
                          text={activeGlamState?.address || ""}
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Do not send assets to this account.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="danger-zone">
              <AccordionTrigger className="text-destructive font-semibold">
                Danger Zone
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <DangerCard
                    message={`Only the owner can close this vault.`}
                  />
                  <DangerCard
                    message={`All assets are transferred to the owner as part of the closing transaction.

                    If the vault holds a large number of assets, the closing transaction may exceed network limits and fail.

                    In this case please manually transfer assets and/or close empty token accounts.`}
                  />
                  <DangerCard
                    message={`DO NOT send any asset to this vault while closing, or you risk to permanently lose them.`}
                  />
                  <Button
                    onClick={closeVault}
                    variant="destructive"
                    disabled={txStatus.close}
                    className="w-full"
                  >
                    {txStatus.close ? "Closing..." : "Close Vault"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SheetContent>
      </Sheet>

      <Sheet
        open={isDepositSheetOpen}
        onOpenChange={(change) => {
          setIsDepositSheetOpen(change);
        }}
      >
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent
          side="right"
          className="p-12 sm:max-w-none w-1/4 overflow-y-auto max-h-screen"
        >
          <SheetHeader>
            <SheetTitle>Deposit</SheetTitle>
            <SheetDescription>
              Deposit Solana or any SPL token into your vault.
            </SheetDescription>
          </SheetHeader>

          <FormProvider {...depositForm}>
            <form
              className="flex flex-col space-y-6 py-6"
              onSubmit={depositForm.handleSubmit(async (data) => {
                if (!selectedAsset) {
                  // TODO: Show error toast that asset must be selected
                  return;
                }

                try {
                  // TODO: Execute deposit transaction
                  console.log("Deposit data:", {
                    asset: selectedAsset,
                    amount: data.amount,
                  });

                  // Close the sheet after successful deposit
                  setIsDepositSheetOpen(false);
                  // Reset form
                  depositForm.reset();
                  setSelectedAsset("SOL");
                  setAssetBalance(
                    (userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL,
                  );
                } catch (error) {
                  console.error("Deposit failed:", error);
                  // TODO: Show error toast
                }
              })}
            >
              <div className="flex items-center gap-2">
                <AssetInput
                  name="amount"
                  label="Amount"
                  balance={assetBalance}
                  hideBalance={true}
                  className="flex-1"
                  selectedAsset={selectedAsset}
                  onSelectAsset={handleAssetSelect}
                  assets={[
                    {
                      name: "SOL",
                      symbol: "SOL",
                      balance:
                        (userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL,
                      address: "SOL",
                    },
                    ...(userWallet?.tokenAccounts || []).map((ta) => {
                      const address = ta.mint.toBase58();
                      const tokenInfo = jupTokenList?.find(
                        (t) => t.address === address,
                      );
                      return {
                        name: tokenInfo?.name || address,
                        symbol:
                          tokenInfo?.symbol || address.slice(0, 6) + "...",
                        balance: ta.uiAmount,
                        address: address,
                      };
                    }),
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 h-10 mt-8"
                  onClick={() => {
                    console.log("Current balance:", assetBalance);

                    if (assetBalance <= 0.000001) {
                      // Use small epsilon for floating point comparison
                      toast({
                        title: "No balance available",
                        description: `You don't have any ${selectedAsset} balance to deposit.`,
                        variant: "destructive",
                      });
                      return;
                    }

                    if (selectedAsset === "SOL") {
                      const availableAfterFees = Math.max(
                        0,
                        assetBalance - 0.05,
                      );
                      console.log("Available after fees:", availableAfterFees);

                      if (availableAfterFees <= 0.000001) {
                        toast({
                          title: "Insufficient balance",
                          description:
                            "Need to keep at least 0.05 SOL for transaction fees.",
                          variant: "destructive",
                        });
                        return;
                      }
                      const halfAmount = availableAfterFees / 2;
                      console.log("Setting half amount:", halfAmount);
                      depositForm.setValue("amount", halfAmount.toString());
                    } else {
                      const halfAmount = assetBalance / 2;
                      console.log("Setting half amount:", halfAmount);
                      depositForm.setValue("amount", halfAmount.toString());
                    }
                  }}
                  type="button"
                >
                  Half
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 h-10 mt-8"
                  onClick={() => {
                    if (selectedAsset === "SOL") {
                      const solBalance =
                        (userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL;
                      const maxAmount = Math.max(0, solBalance - 0.05);
                      depositForm.setValue("amount", String(maxAmount));
                    } else {
                      depositForm.setValue("amount", String(assetBalance));
                    }
                  }}
                  type="button"
                >
                  Max
                </Button>
              </div>

              {selectedAsset === "SOL" &&
                (userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL <
                  0.05 && (
                  <div className="text-sm text-red-500 mb-2">
                    Insufficient SOL balance. We recommend leaving 0.05 SOL in
                    your wallet for transaction fees.
                  </div>
                )}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  selectedAsset === "SOL" &&
                  (userWallet?.balanceLamports || 0) / LAMPORTS_PER_SOL < 0.05
                }
              >
                Deposit
              </Button>
            </form>
          </FormProvider>
        </SheetContent>
      </Sheet>

      <Sheet
        open={isWithdrawSheetOpen}
        onOpenChange={(change) => {
          setIsWithdrawSheetOpen(change);
        }}
      >
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent
          side="right"
          className="p-12 sm:max-w-none w-1/4 overflow-y-auto max-h-screen"
        >
          <SheetHeader>
            <SheetTitle>Withdraw</SheetTitle>
            <SheetDescription>
              Withdraw Solana or any SPL token from your vault.
            </SheetDescription>
          </SheetHeader>

          <FormProvider {...depositForm}>
            <form
              className="flex flex-col space-y-6 py-6"
              onSubmit={depositForm.handleSubmit(async (data) => {
                if (!selectedAsset) {
                  toast({
                    title: "Asset not selected",
                    description: "Please select an asset to withdraw",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  if (!activeGlamState?.pubkey || !glamClient) {
                    toast({
                      title: "Vault not available",
                      description:
                        "Please ensure your vault is properly set up",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Find the asset in the vault
                  const asset = tableData.find(
                    (item) =>
                      (item.symbol === "SOL" && selectedAsset === "SOL") ||
                      item.mint === selectedAsset,
                  );

                  if (!asset) {
                    toast({
                      title: "Asset not found in vault",
                      description:
                        "The selected asset was not found in your vault",
                      variant: "destructive",
                    });
                    return;
                  }

                  const amount = parseFloat(data.amount);
                  if (isNaN(amount) || amount <= 0) {
                    toast({
                      title: "Invalid amount",
                      description: "Please enter a valid amount to withdraw",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Calculate amount in base units
                  const amountBaseUnits = new BN(
                    Math.floor(amount * 10 ** asset.decimals),
                  );

                  // Execute withdraw transaction
                  const txId = await glamClient.state.withdraw(
                    activeGlamState.pubkey,
                    new PublicKey(
                      selectedAsset === "SOL" ? WSOL.toBase58() : selectedAsset,
                    ),
                    amountBaseUnits,
                    {
                      getPriorityFeeMicroLamports,
                      maxFeeLamports: getMaxCapFeeLamports(),
                    },
                  );

                  toast({
                    title: `Withdrew ${amount} ${selectedAsset === "SOL" ? "SOL" : asset.symbol}`,
                    description: (
                      <ExplorerLink path={`tx/${txId}`} label={txId} />
                    ),
                  });

                  // Close the sheet after successful withdrawal
                  setIsWithdrawSheetOpen(false);
                  // Reset form
                  depositForm.reset();
                  setSelectedAsset("SOL");
                } catch (error) {
                  console.error("Withdrawal failed:", error);
                  toast({
                    title: "Withdrawal failed",
                    description: parseTxError(error),
                    variant: "destructive",
                  });
                }
              })}
            >
              <div className="flex items-center gap-2">
                <AssetInput
                  name="amount"
                  label="Amount"
                  balance={(() => {
                    // Get balance from vault based on selected asset
                    if (selectedAsset === "SOL") {
                      return vault?.uiAmount || 0;
                    } else {
                      const tokenAccount = (vault?.tokenAccounts || []).find(
                        (a) => a.mint.toBase58() === selectedAsset,
                      );
                      return tokenAccount ? tokenAccount.uiAmount : 0;
                    }
                  })()}
                  hideBalance={true}
                  className="flex-1"
                  selectedAsset={selectedAsset}
                  onSelectAsset={(asset) => {
                    setSelectedAsset(asset);
                    // Reset amount when changing assets
                    depositForm.setValue("amount", "");
                  }}
                  assets={[
                    // Include SOL if vault holds SOL
                    ...(vault.uiAmount > 0
                      ? [
                          {
                            name: "Solana",
                            symbol: "SOL",
                            balance: vault.uiAmount || 0,
                            address: "SOL",
                          },
                        ]
                      : []),
                    // Include all SPL tokens in vault
                    ...(vault?.tokenAccounts || []).map((ta) => {
                      const address = ta.mint.toBase58();
                      const tokenInfo = jupTokenList?.find(
                        (t) => t.address === address,
                      );
                      return {
                        name: tokenInfo?.name || address,
                        symbol:
                          tokenInfo?.symbol || address.slice(0, 6) + "...",
                        balance: ta.uiAmount,
                        address: address,
                      };
                    }),
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 h-10 mt-8"
                  onClick={() => {
                    const currentBalance = (() => {
                      if (selectedAsset === "SOL") {
                        return vault?.uiAmount || 0;
                      } else {
                        const tokenAccount = (vault?.tokenAccounts || []).find(
                          (a) => a.mint.toBase58() === selectedAsset,
                        );
                        return tokenAccount ? tokenAccount.uiAmount : 0;
                      }
                    })();

                    if (currentBalance <= 0) {
                      toast({
                        title: "No balance available",
                        description: `You don't have any ${selectedAsset} balance in your vault.`,
                        variant: "destructive",
                      });
                      return;
                    }

                    const halfAmount = currentBalance / 2;
                    depositForm.setValue("amount", halfAmount.toString());
                  }}
                  type="button"
                >
                  Half
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 h-10 mt-8"
                  onClick={() => {
                    const currentBalance = (() => {
                      if (selectedAsset === "SOL") {
                        return vault?.uiAmount || 0;
                      } else {
                        const tokenAccount = (vault?.tokenAccounts || []).find(
                          (a) => a.mint.toBase58() === selectedAsset,
                        );
                        return tokenAccount ? tokenAccount.uiAmount : 0;
                      }
                    })();

                    if (currentBalance <= 0) {
                      toast({
                        title: "No balance available",
                        description: `You don't have any ${selectedAsset} balance in your vault.`,
                        variant: "destructive",
                      });
                      return;
                    }

                    depositForm.setValue("amount", currentBalance.toString());
                  }}
                  type="button"
                >
                  Max
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!vault || vault.uiAmount === 0}
              >
                Withdraw
              </Button>
            </form>
          </FormProvider>
        </SheetContent>
      </Sheet>

      <Sheet
        open={isTransferSheetOpen}
        onOpenChange={(change) => {
          setIsTransferSheetOpen(change);
        }}
      >
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent
          side="right"
          className="p-12 sm:max-w-none w-2/5 overflow-y-auto max-h-screen"
        >
          <SheetHeader>
            <SheetTitle>Transfer</SheetTitle>
            <SheetDescription>
              Transfer assets between your vault, Drift, and owner.
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">
            <TransferForm onClose={() => setIsTransferSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </PageContentWrapper>
  );
}
