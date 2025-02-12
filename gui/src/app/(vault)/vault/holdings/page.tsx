"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React, { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam, WSOL } from "@glam/anchor/react";
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
import QRCodeSVG from "qrcode.react";
import { DangerCard } from "@/components/DangerCard";
import { parseTxError } from "@/lib/error";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";
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

const SKELETON_ROW_COUNT = 5;

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
  } = useGlam();

  const [showZeroBalances, setShowZeroBalances] = useState(true);
  const [isLoadingData, setIsLoading] = useState(true);
  const [txStatus, setTxStatus] = useState({ rename: false, close: false });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);

  useEffect(() => {
    isSheetOpen || refresh();
  }, [isSheetOpen]);

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
              <QRCodeSVG value={`solana:vaultAddress`} level="M" size={200} />
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
    </PageContentWrapper>
  );
}
