"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { Asset, AssetInput } from "@/components/AssetInput";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import PageContentWrapper from "@/components/PageContentWrapper";
import {
  Vault,
  useGlam,
  WSOL,
  TokenPrice,
  GlamDriftUser,
  DriftMarketConfigs,
  JupTokenListItem,
  TokenAccount,
} from "@glamsystems/glam-sdk/react";
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
import { TransferForm } from "./components/transfer-form";
import { WrapForm } from "./components/wrap-form";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

const depositSchema = z.object({
  amount: z.number(),
});
type DepositSchema = z.infer<typeof depositSchema>;

const withdrawSchema = z.object({
  amount: z.number(),
});
type WithdrawSchema = z.infer<typeof withdrawSchema>;

/**
 * Transforms vault data into a list of holdings
 */
function getVaultToHoldings(
  vault: Vault,
  prices?: TokenPrice[],
  jupTokenList?: JupTokenListItem[],
  driftUser?: GlamDriftUser,
  driftMarketConfigs?: DriftMarketConfigs,
): Holding[] {
  const holdings: Holding[] = [];

  // Add SOL balance if available
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
      notional: vault.uiAmount * price || NaN,
      location: "vault",
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      lst: false,
    });
  }

  (vault?.tokenAccounts || []).forEach(
    ({ mint, pubkey, amount, uiAmount, decimals }) => {
      const jupToken = jupTokenList?.find((t) => t.address === mint.toBase58());
      const logoURI = jupToken?.logoURI || "";
      const name = jupToken?.name || "Unknown";
      const symbol = jupToken?.symbol || mint.toBase58();
      const price = prices?.find((p) => p.mint === mint.toBase58())?.price || 0;
      const tags = jupToken?.tags || [];
      holdings.push({
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
      });
    },
  );

  (driftUser?.spotPositions || []).forEach(({ marketIndex, balance }) => {
    const market = driftMarketConfigs?.spot?.find(
      (m) => m.marketIndex === marketIndex,
    );
    const price = prices?.find((p) => p.mint === market?.mint)?.price || 0;
    const decimals = market?.decimals || 9;
    const amount = Number(balance) * 10 ** decimals;

    holdings.push({
      name: `${marketIndex}`,
      symbol: market?.symbol || "",
      mint: "",
      ata: "",
      price,
      amount: amount.toString(),
      balance: Number(balance),
      decimals,
      notional: Number(balance) * price || 0,
      logoURI: "https://avatars.githubusercontent.com/u/83389928?s=48&v=4",
      location: "drift",
      lst: false,
    });
  });

  holdings.sort((a, b) => {
    if (b.location > a.location) return 1;
    if (b.location < a.location) return -1;
    return b.balance - a.balance;
  });
  return holdings;
}

function tokenAccountsToAssets(
  tokenAccounts: TokenAccount[],
  jupTokenList?: JupTokenListItem[],
) {
  return tokenAccounts
    .filter((ta) => ta.uiAmount > 0)
    .map(({ mint, uiAmount, decimals }) => {
      const address = mint.toBase58();
      const token = jupTokenList?.find((t) => t.address === address);
      const symbol =
        (token?.symbol === "SOL" ? "wSOL" : token?.symbol) ||
        address.slice(0, 6) + "...";
      const name = token?.name || address;
      return {
        name,
        symbol,
        balance: uiAmount,
        address,
        decimals,
      };
    });
}

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

  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false);
  const [isWithdrawSheetOpen, setIsWithdrawSheetOpen] = useState(false);
  const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
  const [isWrapSheetOpen, setIsWrapSheetOpen] = useState(false);

  const [txStatus, setTxStatus] = useState({
    rename: false,
    close: false,
    deposit: false,
    withdraw: false,
  });

  const depositForm = useForm<DepositSchema>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: 0 },
  });
  const withdrawForm = useForm<WithdrawSchema>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: 0 },
  });

  const defaultDepositAsset = useMemo(
    () => ({
      name: "Solana",
      symbol: "SOL",
      address: "",
      decimals: 9,
      balance: userWallet?.uiAmount || 0,
    }),
    [userWallet],
  );
  const [depositAsset, setDepositAsset] = useState<Asset>(defaultDepositAsset);
  const [withdrawAsset, setWithdrawAsset] = useState<Asset>({
    ...defaultDepositAsset,
    balance: vault?.uiAmount || 0,
  });

  useEffect(() => {
    setWithdrawAsset({
      ...defaultDepositAsset,
      balance: vault?.uiAmount || 0,
    });
  }, [vault]);

  // On wallet changes reset states
  useEffect(() => {
    depositForm.reset();
    setDepositAsset(defaultDepositAsset);
  }, [userWallet]);

  const userWalletAssets = useMemo(
    () => [
      {
        name: "Solana",
        symbol: "SOL",
        balance: userWallet?.uiAmount || 0,
        address: "",
        decimals: 9,
      },
      ...tokenAccountsToAssets(userWallet?.tokenAccounts || [], jupTokenList),
    ],
    [userWallet, jupTokenList],
  );
  const vaultAssets = useMemo(
    () => [
      {
        name: "Solana",
        symbol: "SOL",
        balance: vault.uiAmount || 0,
        address: "",
        decimals: 9,
      },
      ...tokenAccountsToAssets(vault?.tokenAccounts || [], jupTokenList),
    ],
    [vault, jupTokenList],
  );

  const openDetailsSheet = () => setIsDetailsSheetOpen(true);
  const closeDetailsSheet = () => setIsDetailsSheetOpen(false);
  const openDepositSheet = () => setIsDepositSheetOpen(true);
  const closeDepositSheet = () => setIsDepositSheetOpen(false);
  const openWithdrawSheet = () => setIsWithdrawSheetOpen(true);
  const closeWithdrawSheet = () => setIsWithdrawSheetOpen(false);
  const openTransferSheet = () => setIsTransferSheetOpen(true);
  const closeTransferSheet = () => setIsTransferSheetOpen(false);
  const openWrapSheet = () => setIsWrapSheetOpen(true);
  const closeWrapSheet = () => setIsWrapSheetOpen(false);

  useEffect(() => {
    isDetailsSheetOpen ||
      isDepositSheetOpen ||
      isWithdrawSheetOpen ||
      isTransferSheetOpen ||
      isWrapSheetOpen ||
      refresh();
  }, [
    isDetailsSheetOpen,
    isDepositSheetOpen,
    isWithdrawSheetOpen,
    isTransferSheetOpen,
    isWrapSheetOpen,
  ]);

  const skeletonData = useMemo(
    () =>
      Array(SKELETON_ROW_COUNT).fill({
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
      } as Holding),
    [],
  );

  const [tableData, setTableData] = useState<Holding[]>([]);

  useEffect(() => {
    const vaultHoldings = getVaultToHoldings(
      vault,
      prices,
      jupTokenList,
      driftUser,
      driftMarketConfigs,
    );
    setTableData(vaultHoldings);
  }, [vault, driftUser, jupTokenList, prices, driftMarketConfigs]);

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

    const glamState = activeGlamState.pubkey;
    const tokenAccounts = (tableData || [])
      .filter((row) => row.ata && row.location === "vault")
      .map((row) => new PublicKey(row.ata));

    const preInstructions = (
      await Promise.all(
        (tableData || [])
          .filter(
            (row) => row.balance > 0 && row.mint && row.location === "vault",
          )
          .map(async (row) => {
            console.log(`withdraw ${row.name} from ${row.location}`);
            return await glamClient.state.withdrawIxs(
              glamState,
              new PublicKey(row.mint),
              new BN(row.amount),
              {},
            );
          }),
      )
    ).flat();

    console.log("closing ATAs:", tokenAccounts);
    preInstructions.push(
      await glamClient.state.closeTokenAccountsIx(glamState, tokenAccounts),
    );

    setTxStatus((prev) => ({ ...prev, close: true }));
    try {
      const txSig = await glamClient.state.closeState(glamState, {
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

  const onSetAmount = useCallback(
    (
      input: "half" | "max",
      action: "deposit" | "withdraw",
      asset: Asset,
      form: any,
    ) => {
      console.log(
        `${action} ${asset.symbol} (${asset.address}), current balance:`,
        asset.balance,
      );

      if (asset.balance <= 0.000001) {
        toast({
          title: "No balance available",
          description: `You don't have any ${asset.symbol} balance to ${action}.`,
          variant: "destructive",
        });
        return;
      }

      let amount: number;
      if (asset.symbol === "SOL" && action === "deposit") {
        const availableAfterFees = Math.max(0, asset.balance - 0.005);
        console.log("Available after fees:", availableAfterFees);

        if (availableAfterFees <= 0.000001) {
          toast({
            title: "Insufficient balance",
            description:
              "Need to keep at least 0.005 SOL for transaction fees.",
            variant: "destructive",
          });
          return;
        }
        amount = availableAfterFees / (input === "half" ? 2 : 1);
      } else {
        amount = asset.balance / (input === "half" ? 2 : 1);
      }

      console.log(`Setting ${input} amount:`, amount.toPrecision(6));
      form.setValue("amount", Number(amount.toPrecision(6)));
    },
    [],
  );

  const onSubmitDeposit: SubmitHandler<DepositSchema> = useCallback(
    async (values, event) => {
      if (!activeGlamState) {
        return;
      }

      setTxStatus((prev) => ({ ...prev, deposit: true }));
      const { amount } = values;
      try {
        console.log("Deposit data:", {
          asset: depositAsset,
          amount,
        });

        const txSig =
          depositAsset.symbol === "SOL"
            ? await glamClient.state.depositSol(
                activeGlamState.pubkey,
                amount * LAMPORTS_PER_SOL,
              )
            : await glamClient.state.deposit(
                activeGlamState.pubkey,
                depositAsset.address!,
                amount * 10 ** depositAsset.decimals!,
              );

        toast({
          title: "Deposit sent",
          description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
        });

        // Close the sheet after successful deposit and reset states
        setIsDepositSheetOpen(false);
        depositForm.reset();
        setDepositAsset(defaultDepositAsset);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Deposit failed",
          description: parseTxError(error),
        });
      }
      setTxStatus((prev) => ({ ...prev, deposit: false }));
    },
    [activeGlamState, depositAsset, depositForm, userWallet],
  );

  const onSubmitWithdraw: SubmitHandler<WithdrawSchema> = useCallback(
    async (values, event) => {
      if (!withdrawAsset) {
        toast({
          title: "Asset not selected",
          description: "Please select an asset to withdraw",
          variant: "destructive",
        });
        return;
      }

      if (!activeGlamState?.pubkey || !glamClient) {
        console.log("activeGlamState", activeGlamState);
        toast({
          title: "Vault not available",
          description: "Please ensure your vault is properly set up",
          variant: "destructive",
        });
        return;
      }

      const { amount } = values;
      if (amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount to withdraw",
          variant: "destructive",
        });
        return;
      }

      try {
        setTxStatus((prev) => ({ ...prev, withdraw: true }));

        const txId = await glamClient.state.withdraw(
          activeGlamState.pubkey,
          withdrawAsset.symbol === "SOL"
            ? WSOL.toBase58()
            : new PublicKey(withdrawAsset.address!),
          amount * 10 ** withdrawAsset.decimals!,
          {
            getPriorityFeeMicroLamports,
            maxFeeLamports: getMaxCapFeeLamports(),
          },
        );

        toast({
          title: `Withdrew ${amount} ${withdrawAsset.symbol === "SOL" ? "SOL" : withdrawAsset.symbol}`,
          description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
        });

        // Close the sheet after successful withdrawal and reset states
        setIsWithdrawSheetOpen(false);
        withdrawForm.reset();
        setWithdrawAsset({
          ...defaultDepositAsset,
          balance: vault?.uiAmount || 0,
        });
      } catch (error) {
        toast({
          title: "Withdrawal failed",
          description: parseTxError(error),
          variant: "destructive",
        });
      }
      setTxStatus((prev) => ({ ...prev, withdraw: false }));
    },
    [],
  );

  return (
    <PageContentWrapper>
      <DataTable
        data={
          tableData.length === 0
            ? skeletonData
            : tableData.filter((d) => d.balance > 0 || showZeroBalances)
        }
        columns={columns}
        showZeroBalances={showZeroBalances}
        setShowZeroBalances={setShowZeroBalances}
        onOpenDetailsSheet={openDetailsSheet}
        onOpenDepositSheet={openDepositSheet}
        onOpenWithdrawSheet={openWithdrawSheet}
        onOpenTransferSheet={openTransferSheet}
        onOpenWrapSheet={openWrapSheet}
      />
      <Sheet
        open={isDetailsSheetOpen}
        onOpenChange={(change) => {
          setIsDetailsSheetOpen(change);
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

      <Sheet open={isDepositSheetOpen} onOpenChange={setIsDepositSheetOpen}>
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent
          side="right"
          className="p-12 sm:max-w-none w-2/5 overflow-y-auto max-h-screen"
        >
          <SheetHeader>
            <SheetTitle>Deposit</SheetTitle>
            <SheetDescription>
              Deposit Solana or any SPL token into your vault.
            </SheetDescription>
          </SheetHeader>

          <FormProvider {...depositForm}>
            <Form {...depositForm}>
              <form
                className="flex flex-col space-y-6 py-6"
                onSubmit={depositForm.handleSubmit(onSubmitDeposit)}
              >
                <div className="flex items-top gap-2">
                  <AssetInput
                    name="amount"
                    label="Amount"
                    className="flex-1"
                    selectedAsset={depositAsset.symbol}
                    onSelectAsset={setDepositAsset}
                    assets={userWalletAssets}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 h-10 mt-8"
                    onClick={() =>
                      onSetAmount("half", "deposit", depositAsset, depositForm)
                    }
                    type="button"
                  >
                    Half
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 h-10 mt-8"
                    onClick={() =>
                      onSetAmount("max", "deposit", depositAsset, depositForm)
                    }
                    type="button"
                  >
                    Max
                  </Button>
                </div>

                {depositAsset.symbol === "SOL" &&
                  userWallet.uiAmount < 0.005 && (
                    <div className="text-sm text-red-500 mb-2">
                      Insufficient SOL balance. We recommend leaving 0.005 SOL
                      in your wallet for transaction fees.
                    </div>
                  )}

                <Button
                  type="submit"
                  className="w-full"
                  loading={txStatus.deposit}
                  disabled={
                    depositAsset.symbol === "SOL" && userWallet.uiAmount < 0.005
                  }
                >
                  Deposit
                </Button>
              </form>
            </Form>
          </FormProvider>
        </SheetContent>
      </Sheet>

      <Sheet open={isWithdrawSheetOpen} onOpenChange={setIsWithdrawSheetOpen}>
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent
          side="right"
          className="p-12 sm:max-w-none w-2/5 overflow-y-auto max-h-screen"
        >
          <SheetHeader>
            <SheetTitle>Withdraw</SheetTitle>
            <SheetDescription>
              Withdraw Solana or any SPL token from your vault.
            </SheetDescription>
          </SheetHeader>

          <FormProvider {...withdrawForm}>
            <Form {...withdrawForm}>
              <form
                className="flex flex-col space-y-6 py-6"
                onSubmit={withdrawForm.handleSubmit(onSubmitWithdraw)}
              >
                <div className="flex items-top gap-2">
                  <AssetInput
                    name="amount"
                    label="Amount"
                    className="flex-1"
                    selectedAsset={withdrawAsset.symbol}
                    onSelectAsset={setWithdrawAsset}
                    assets={vaultAssets}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 h-10 mt-8"
                    onClick={() =>
                      onSetAmount(
                        "half",
                        "withdraw",
                        withdrawAsset,
                        withdrawForm,
                      )
                    }
                    type="button"
                  >
                    Half
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 h-10 mt-8"
                    onClick={() =>
                      onSetAmount(
                        "max",
                        "withdraw",
                        withdrawAsset,
                        withdrawForm,
                      )
                    }
                    type="button"
                  >
                    Max
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={vaultAssets.length === 0}
                  loading={txStatus.withdraw}
                >
                  Withdraw
                </Button>
              </form>
            </Form>
          </FormProvider>
        </SheetContent>
      </Sheet>

      <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent
          side="right"
          className="p-12 sm:max-w-none w-2/5 overflow-y-auto max-h-screen"
        >
          <SheetHeader>
            <SheetTitle>Transfer</SheetTitle>
            <SheetDescription>
              Transfer assets between your vault and DeFi protocols (e.g.,
              Drift).
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">
            <TransferForm onClose={() => setIsTransferSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isWrapSheetOpen} onOpenChange={setIsWrapSheetOpen}>
        <SheetTrigger asChild></SheetTrigger>
        <SheetContent
          side="right"
          className="p-12 sm:max-w-none w-2/5 overflow-y-auto max-h-screen"
        >
          <SheetHeader>
            <SheetTitle>Wrap/Unwrap SOL</SheetTitle>
            <SheetDescription>
              Wrap SOL into wSOL or unwrap wSOL back to SOL within your vault.
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">
            <WrapForm onClose={() => setIsWrapSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </PageContentWrapper>
  );
}
