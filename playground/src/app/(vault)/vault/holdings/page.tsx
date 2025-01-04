"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React, { useEffect, useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
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
import { AlertTriangle } from "lucide-react";

const SKELETON_ROW_COUNT = 5;

export default function Holdings() {
  const {
    activeFund,
    treasury,
    driftMarketConfigs,
    driftUser,
    jupTokenList,
    prices,
    glamClient,
  } = useGlam();

  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [isLoadingData, setIsLoading] = useState(true);
  const [isTxPending, setIsTxPending] = useState(false);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);

  const createSkeletonHolding = (): Holding => ({
    name: "",
    symbol: "",
    mint: "",
    ata: "",
    price: 0,
    balance: 0,
    decimals: 9,
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

    const solBalance = Number(treasury?.balanceLamports) / LAMPORTS_PER_SOL;
    if (solBalance > 0) {
      const mint = "So11111111111111111111111111111111111111112";
      const price = prices?.find((p) => p.mint === mint)?.price || 0;
      holdings.push({
        name: "Solana",
        symbol: "SOL",
        mint: "",
        ata: "",
        price: price,
        balance: solBalance,
        decimals: 9,
        notional: solBalance * price || 0,
        location: "vault",
        logoURI:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        lst: false,
      });
    }

    if (treasury?.tokenAccounts) {
      holdings.push(
        ...treasury.tokenAccounts.map((ta) => {
          const jupToken = jupTokenList?.find(
            (t) => t.address === ta.mint.toBase58(),
          );
          const logoURI = jupToken?.logoURI || "";
          const name = jupToken?.name || "Unknown";
          const symbol = jupToken?.symbol || ta.mint.toBase58();
          const price =
            prices?.find((p) => p.mint === ta.mint.toBase58())?.price || 0;
          const tags = jupToken?.tags || [];

          return {
            name,
            symbol: symbol === "SOL" ? "wSOL" : symbol,
            mint: ta.mint.toBase58(),
            ata: ta.pubkey.toBase58(),
            price,
            balance: ta.uiAmount,
            decimals: ta.decimals,
            notional: ta.uiAmount * price,
            logoURI,
            location: "vault",
            lst: tags.indexOf("lst") >= 0,
          };
        }),
      );
    }

    const { spotPositions } = driftUser;

    if (spotPositions && spotPositions.length > 0) {
      const spotMarkets = driftMarketConfigs.spot;
      const driftHoldings = spotPositions.map((p) => {
        const market = spotMarkets.find((m) => m.marketIndex === p.marketIndex);
        const price = prices?.find((p) => p.mint === market?.mint)?.price || 0;
        // @ts-ignore: balance is UI amount added by glam api, it doesn't existing in the drift sdk types
        const balance = Number(p.balance);
        return {
          name: `${p.marketIndex}`,
          symbol: market?.symbol || "",
          mint: "NA",
          ata: "NA",
          price,
          balance,
          decimals: market?.decimals || 9,
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
  }, [treasury, driftUser, jupTokenList, prices]);

  useEffect(() => {
    if (activeFund && treasury && jupTokenList && prices) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [treasury, jupTokenList, prices, activeFund]);

  const vaultAddress = treasury?.pubkey ? treasury.pubkey.toBase58() : "";

  const closeVault = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!activeFund?.pubkey) {
      return;
    }

    setIsTxPending(true);
    try {
      const txSig = await glamClient.fund.closeFund(activeFund.pubkey);
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

    setIsTxPending(false);
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
        setShowZeroBalances={setShowZeroBalances}
        onOpenSheet={openSheet}
      />
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent side="right" className="p-12 sm:max-w-none w-1/2">
          <SheetHeader>
            <SheetTitle>Vault Details</SheetTitle>
            <SheetDescription>
              Review vault information, account addresses, and closure controls.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-[200px_1fr] gap-6 py-6">
            <div className="flex flex-col items-center justify-center">
              <QRCodeSVG value={vaultAddress} level="M" size={200} />
              <p className="mt-2 text-sm text-muted-foreground text-left">
                This is the address of your Vault. Deposit funds by scanning the
                QR code or copying the address.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Name</p>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                  <span className="flex-1 text-sm font-medium">
                    {activeFund?.name || "Unnamed Vault"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Vault</p>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
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
                        <ClickToCopyText text={activeFund?.address || ""} />
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
                  <DangerCard message="Before closing your vault, transfer all assets and close all token accounts, noting that any remaining SOL will automatically return to your wallet." />
                  <Button
                    onClick={closeVault}
                    variant="destructive"
                    disabled={isTxPending}
                    className="w-full"
                  >
                    {isTxPending ? "Closing..." : "Close Vault"}
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
