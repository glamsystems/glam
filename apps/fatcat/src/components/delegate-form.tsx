"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExplorerLink } from "@/components/ExplorerLink";
import Link from "next/link";
import { useGlamClient } from "@/providers/clientProvider";
import { parseTxError } from "@/lib/error";
import { useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@/components/skeleton";
import { DynamicVotingPower } from "@/components/dynamic-voting-power";
import { BN } from "@coral-xyz/anchor";
import { EscrowData } from "@/lib/client";

interface UnstakeItem {
  amount: number;
  endTime: number;
}

export default function DelegateForm() {
  const { publicKey } = useWallet();
  const { glamClient: client } = useGlamClient();

  const [stakeAmount, setStakeAmount] = useState<string>("0");
  const [unstakeAmount, setUnstakeAmount] = useState<string>("0");
  const [unstakeItems, setUnstakeItems] = useState<UnstakeItem[]>([]);
  const [spinner, setSpinner] = useState<boolean>(false);
  const [nowSec, setNowSec] = useState(Date.now() / 1000);
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingVotingPower, setIsLoadingVotingPower] = useState(true);
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);

  useEffect(() => {
    const { amount, escrowStartedAt, escrowEndsAt } = escrowData || {};
    if (amount && escrowStartedAt) {
      if (nowSec > escrowStartedAt.toNumber()) {
        setUnstakeItems([
          {
            amount: parseFloat(amount.toString()) / 1_000_000,
            endTime: escrowEndsAt?.toNumber() || 0,
          },
        ]);
      }
    }
  }, [escrowData]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!publicKey || !client) {
        return;
      }

      try {
        const { vault } = client.getFatcatState();
        const escrow = client.jupiterVote.getEscrowPda(vault);
        const escrowData = await client.getEscrowData(escrow);
        setEscrowData(escrowData ? escrowData : null);

        const { votingPower, jupBalance } = await client.fetchBalances();

        if (mounted) {
          console.log("Fetched balances:", { votingPower, jupBalance });
          setWalletBalance(jupBalance);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (mounted) {
          setIsLoadingVotingPower(false);
          setIsLoadingBalance(false);
        }
      }
    };

    setIsLoadingVotingPower(true);
    setIsLoadingBalance(true);
    fetchData();

    return () => {
      mounted = false;
    };
  }, [publicKey, client]);

  const handleMaxClick = (type: "stake" | "unstake") => {
    if (type === "stake") {
      const maxAmount = parseFloat(walletBalance) / 1_000_000;
      console.log("Max amount:", maxAmount);
      setStakeAmount(maxAmount.toString());
    } else {
      setUnstakeAmount("50.00"); // Keep original unstake logic
    }
  };

  const handleHalfClick = (type: "stake" | "unstake") => {
    if (type === "stake") {
      const halfAmount = Math.ceil(parseFloat(walletBalance) / 2) / 1_000_000;
      console.log("Half amount:", halfAmount);
      setStakeAmount(halfAmount.toString());
    } else {
      setUnstakeAmount("25.00"); // Keep original unstake logic
    }
  };

  const handleTx = async (action: string, tx: Promise<any>) => {
    setSpinner(true);
    try {
      const txId = await tx;
      console.log(`${action} successful: ${txId}`);
      toast({
        title: `${action} successful`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });

      // Refresh data after successful transaction
      if (client) {
        const { jupBalance } = await client.fetchBalances();
        setWalletBalance(jupBalance);
      }
    } catch (error) {
      toast({
        title: `${action} failed`,
        description: parseTxError(error),
        variant: "destructive",
      });
    }
    setSpinner(false);
  };

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (amount > 0) {
      console.log(`Staking ${amount} JUP...`);
      await handleTx("Staking", client.stakeJup(amount));
    }
  };

  const handleUnstake = async () => {
    const amount = parseFloat(unstakeAmount);
    if (amount > 0) {
      console.log(`Unstaking ${amount} JUP...`);
      await handleTx("Unstaking", client.unstakeJup(amount));
    }
  };

  const handleCancelUnstake = async (index: number) => {
    setUnstakeItems(unstakeItems.filter((_, i) => i !== index));
    await handleTx("Cancel unstake", client.cancelUnstake());
  };

  const formatCountdown = (endTime: number) => {
    const diff = Math.max(0, endTime - nowSec) * 1000;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <Card className="bg-card text-card-foreground p-0 sm:p-4 rounded border-muted select-none">
        <CardHeader>
          <CardTitle className="text-2xl">Votes on Autopilot</CardTitle>
          <CardDescription style={{ marginTop: 20, marginBottom: 10 }}>
            <p>Stake JUP tokens to receive your voting power.</p>
            <p>
              Unstaking takes 30 days. During the countdown, you will be able to
              vote but with decreased voting power.{" "}
              <Link
                href="https://www.jupresear.ch/t/dao-x-vote-faq/7418"
                target="_blank"
                className="underline hover:text-primary"
              >
                Learn More.
              </Link>
            </p>
          </CardDescription>
          <CardDescription>
            <span className="text-xl font-medium">Voting power: </span>
            {isLoadingVotingPower ? (
              <Skeleton className="h-7 w-16 inline-block align-middle" />
            ) : escrowData ? (
              <DynamicVotingPower
                baseAmount={new BN(escrowData.amount)}
                escrowEndsAt={new BN(escrowData.escrowEndsAt)}
                className="text-xl font-medium"
              />
            ) : (
              <span className="text-xl font-medium">0</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stake" className="w-full select-none">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="stake">Stake</TabsTrigger>
              <TabsTrigger value="unstake">Unstake</TabsTrigger>
              <TabsTrigger value="claim">Claim</TabsTrigger>
            </TabsList>
            <div className="h-[200px]">
              <TabsContent value="stake" className="h-full">
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <Label htmlFor="stake-amount">JUP</Label>
                    <div className="flex justify-between space-x-2">
                      <div className="h-8 leading-8 text-sm text-muted-foreground">
                        {isLoadingBalance ? (
                          <Skeleton className="h-6 w-16 inline-block" />
                        ) : (
                          parseFloat(walletBalance) / 1_000_000
                        )}
                      </div>
                      <div className="h-8 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHalfClick("stake")}
                          disabled={isLoadingBalance}
                        >
                          HALF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMaxClick("stake")}
                          disabled={isLoadingBalance}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                    <Input
                      id="stake-amount"
                      type="text"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="text-right text-xl sm:text-2xl"
                      disabled={isLoadingBalance}
                    />
                  </div>
                  <Button
                    className="w-full py-2 sm:py-3 text-foreground dark:text-background"
                    onClick={handleStake}
                    disabled={
                      !(parseFloat(stakeAmount) > 0) ||
                      spinner ||
                      isLoadingBalance
                    }
                  >
                    Stake {spinner ? "..." : ""}
                  </Button>
                </div>
              </TabsContent>

              {/* TODO: Previous version with manual amount input - keep for future reference*/}
              {/*<TabsContent value="unstake" className="h-full">*/}
              {/*  <div className="space-y-4 h-full flex flex-col justify-between">*/}
              {/*    <div className="space-y-2">*/}
              {/*      <Label htmlFor="unstake-amount">Staked JUP</Label>*/}
              {/*      <div className="flex justify-end space-x-2">*/}
              {/*        <Button*/}
              {/*          variant="outline"*/}
              {/*          size="sm"*/}
              {/*          onClick={() => handleHalfClick("unstake")}*/}
              {/*        >*/}
              {/*          HALF*/}
              {/*        </Button>*/}
              {/*        <Button*/}
              {/*          variant="outline"*/}
              {/*          size="sm"*/}
              {/*          onClick={() => handleMaxClick("unstake")}*/}
              {/*        >*/}
              {/*          MAX*/}
              {/*        </Button>*/}
              {/*      </div>*/}
              {/*      <Input*/}
              {/*        id="unstake-amount"*/}
              {/*        type="text"*/}
              {/*        value={unstakeAmount}*/}
              {/*        onChange={(e) => setUnstakeAmount(e.target.value)}*/}
              {/*        onFocus={(e) => setUnstakeAmount("")}*/}
              {/*        className="text-right text-xl sm:text-2xl"*/}
              {/*      />*/}
              {/*    </div>*/}
              {/*    <Button*/}
              {/*      className="w-full py-2 sm:py-3 text-foreground dark:text-background"*/}
              {/*      onClick={handleUnstake}*/}
              {/*      disabled={!(parseFloat(unstakeAmount) > 0) || spinner}*/}
              {/*    >*/}
              {/*      Unstake{spinner ? "..." : ""}*/}
              {/*    </Button>*/}
              {/*  </div>*/}
              {/*</TabsContent>*/}
              <TabsContent value="unstake" className="h-full">
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <Label>Click below to unstake all your JUP tokens</Label>
                  </div>
                  <Button
                    className="w-full py-2 sm:py-3 text-foreground dark:text-background"
                    onClick={handleUnstake}
                    disabled={
                      spinner ||
                      Boolean(escrowData?.escrowEndsAt.toString() !== "0")
                    }
                  >
                    Unstake All{spinner ? "..." : ""}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="claim" className="h-full">
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <Label>Claimable JUP</Label>
                    <div className="relative">
                      <ScrollArea className="h-[180px] sm:h-[210px] w-full rounded p-4">
                        {unstakeItems.length === 0 ? (
                          <p className="text-center text-muted-foreground">
                            No unstaking in progress.
                          </p>
                        ) : (
                          unstakeItems.map((item, index) => (
                            <div
                              key={index}
                              className="rounded mb-2 last:mb-16"
                            >
                              <div className="flex justify-between items-center">
                                <span className="w-full text-sm sm:text-base">
                                  {item.amount} JUP
                                </span>
                                {nowSec < item.endTime ? (
                                  <>
                                    <span className="w-full text-sm sm:text-base font-mono text-lime-500 dark:text-primary text-right mr-4">
                                      {formatCountdown(item.endTime)}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancelUnstake(index)}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="text-foreground dark:text-background"
                                  >
                                    Withdraw
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </ScrollArea>
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
