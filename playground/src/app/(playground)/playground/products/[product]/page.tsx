"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { StateModel, useGlam } from "@glam/anchor/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import Sparkle from "@/utils/Sparkle";
import SparkleColorMatcher, {
  getColorInfo,
  ColorInfo,
} from "@/utils/SparkleColorMatcher";
import TruncateAddress from "@/utils/TruncateAddress";
import PageContentWrapper from "@/components/PageContentWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator"; // Adjust the import based on your setup
import NumberFormatter from "@/utils/NumberFormatter";
import { ExplorerLink } from "@/components/ExplorerLink";
import { Skeleton } from "@/components/ui/skeleton";
import SparkleBackground from "@/components/SparkleBackground";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareClass {
  shareClassId: string;
  shareClassSymbol: string;
  shareClassDecimals: number; // Add this line to define 'shareClassDecimals'
}

interface HolderData {
  mint: string;
  holders: Array<{ holder: React.ReactNode; shares: number; fill: string }>;
  totalHolders: number;
}

async function fetchHolderData(mint: string): Promise<any> {
  try {
    console.log(`Fetching holder data for mint: ${mint}`);

    // `getTokenAccounts` is a helius only RPC endpoint, we have to hardcode the URL here
    // We cannot use NEXT_PUBLIC_SOLANA_RPC because users may choose to use a non-helius RPC
    const response = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          method: "getTokenAccounts",
          params: {
            mint,
            options: {
              showZeroBalance: true,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`API error: ${data.error.message}`);
    }

    console.log("Fetched holder data:", data);
    return data.result;
  } catch (error) {
    console.error("Error fetching holder data:", error);
    return null;
  }
}

function processHolderData(
  data: any,
  decimals: number,
): {
  holders: Array<{ holder: React.ReactNode; shares: number; fill: string }>;
  totalHolders: number;
} {
  if (!data || !Array.isArray(data.token_accounts)) {
    console.error("Invalid data format:", data);
    return { holders: [], totalHolders: 0 };
  }

  const accounts = data.token_accounts;

  // Extract holder addresses and share amounts, adjusting by decimals
  const holdersArray = accounts.reduce((acc: any[], account: any) => {
    const amount = Number(account.amount) / 10 ** decimals; // Adjust shares
    const address = account.owner;
    if (amount > 0 && address) {
      acc.push({
        holder: <TruncateAddress address={address} start={2} end={2} />,
        shares: amount,
        fill: `var(--color-hld${acc.length % 5})`, // Dynamically assign colors
      });
    }
    return acc;
  }, []);

  const totalHolders = holdersArray.length;

  holdersArray.sort(
    (a: { shares: number }, b: { shares: number }) => b.shares - a.shares,
  );

  let topHolders = holdersArray.slice(0, 4);

  const othersShares = holdersArray
    .slice(4)
    .reduce(
      (sum: number, holder: { shares: number }) => sum + holder.shares,
      0,
    );

  if (othersShares > 0) {
    topHolders.push({
      holder: "Others",
      shares: othersShares,
      fill: `var(--color-hld4)`,
    });
  }

  if (totalHolders === 0) {
    topHolders = [
      {
        holder: "Others",
        shares: 1, // To allow the PieChart to render
        fill: `var(--color-hld0)`,
      },
    ];
  }

  console.log("Processed holders:", topHolders);

  return {
    holders: topHolders,
    totalHolders: totalHolders,
  };
}

async function updateHoldersData(
  stateModel: StateModel,
): Promise<HolderData[]> {
  const holdersData = await Promise.all(
    stateModel.mints.map(async (shareClassModel, i) => {
      const mintAddress = stateModel.shareClassMints[i].toBase58();
      const holderData = await fetchHolderData(mintAddress);
      if (!holderData) {
        console.error(`Failed to fetch holder data for mint: ${mintAddress}`);
        return null;
      }

      const processedData = processHolderData(
        holderData,
        9, // All share classes use hardcoded decimals 9 for now
      );

      return {
        mint: mintAddress,
        holders: processedData.holders,
        totalHolders: processedData.totalHolders,
      };
    }),
  );

  console.log("Aggregated holders data:", holdersData);

  return holdersData.filter((item) => item !== null) as HolderData[];
}

const ChartComponent: React.FC<{ fundModel: StateModel; holdersConfig: any }> =
  React.memo(({ fundModel, holdersConfig }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [showSkeleton, setShowSkeleton] = useState(true); // **New State**
    const [localHoldersData, setLocalHoldersData] = useState<
      HolderData[] | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const updatedHoldersData = await updateHoldersData(fundModel);
          setLocalHoldersData(updatedHoldersData);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [fundModel]);

    if (isLoading) {
      return <SkeletonChart />;
    }

    if (error) {
      return <div className="text-red-500">Error: {error}</div>;
    }

    // Ensure we have data before rendering the chart
    if (
      !localHoldersData ||
      localHoldersData.length === 0 ||
      !localHoldersData[0]
    ) {
      return (
        <div className="text-sm text-center text-muted-foreground mt-28">
          No holder data available
        </div>
      );
    }

    const totalHolders = localHoldersData[0]?.totalHolders || 0;

    // Determine what to display
    const displayTotalHolders = totalHolders > 0 ? totalHolders : 0;

    return (
      <ChartContainer
        config={holdersConfig}
        className="flex-1 mx-auto aspect-square max-h-[256px] self-center"
      >
        <PieChart>
          {totalHolders !== 0 && (
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
          )}
          <Pie
            data={localHoldersData[0]?.holders || []}
            isAnimationActive={false}
            dataKey="shares"
            nameKey="holder"
            innerRadius={90}
            strokeWidth={5}
            paddingAngle={2}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-medium"
                      >
                        {displayTotalHolders.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        Holders
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    );
  });

export default function ProductPage() {
  const [clientReady, setClientReady] = useState(false);
  const [sparkleColor, setSparkleColor] = useState<string>(""); // State for sparkle color
  const [useDefaultColors] = useState(false); // State for default colors
  const sparkleContainerRef = useRef<HTMLDivElement>(null); // Initialize the ref here
  const [sparkleSize, setSparkleSize] = useState(50); // State for the size of the sparkle

  const params = useParams();
  const router = useRouter();
  const { product } = params;
  const { allGlamStates: allFunds } = useGlam();

  const isAllFundsLoading = !allFunds;

  const fundPublicKey = useMemo(() => {
    if (!product) return null;
    try {
      return new PublicKey(product);
    } catch (e) {
      console.log("Invalid public key", e);
      return null;
    }
  }, [product]);

  const stateModel = useMemo(() => {
    if (!allFunds || allFunds.length === 0 || !fundPublicKey) return null;
    return allFunds.find((f) => f.idStr === product);
  }, [allFunds, fundPublicKey, product]);

  //Mark the client as ready once mounted (to prevent server-side rendering issues)
  useEffect(() => {
    setClientReady(true);
  }, []);

  // Debug Loading State
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setClientReady(true);
  //   }, 10000); // Delay of 10000 milliseconds
  //   return () => clearTimeout(timer);
  // }, []);

  // Redirect logic moved to an effect
  useEffect(() => {
    console.log(
      "Effect running. ClientReady:",
      clientReady,
      "IsAllFundsLoading:",
      isAllFundsLoading,
    );
    console.log(
      "PublicKey:",
      fundPublicKey,
      "Fund:",
      stateModel,
      "AllFunds:",
      allFunds,
    );

    if (clientReady && !isAllFundsLoading) {
      if (!fundPublicKey) {
        console.log("Redirecting: Invalid public key");
        router.push("/");
        return;
      }
      if (allFunds && allFunds.length > 0 && !stateModel) {
        console.log("Redirecting: Valid public key but no matching fund");
        router.push("/");
      }
    }
  }, [
    clientReady,
    fundPublicKey,
    stateModel,
    isAllFundsLoading,
    router,
    allFunds,
  ]);

  // Calculating color info based on sparkleColor (must be declared at the top level)
  const colorInfo: ColorInfo = useMemo(() => {
    return getColorInfo(sparkleColor); // This hook runs whenever `sparkleColor` changes
  }, [sparkleColor]);

  // Chart colors based on useDefaultColors or colorInfo
  const chartColors = useMemo(() => {
    if (useDefaultColors) {
      return [
        "221.2 83.2% 53.3%",
        "212 95% 68%",
        "216 92% 60%",
        "210 98% 78%",
        "212 97% 87%",
      ];
    }
    return colorInfo.colors; // Use colors based on sparkleColor
  }, [useDefaultColors, colorInfo.colors]);

  const mintConfig = useMemo(
    () => ({
      shares: { label: "Shares" },
      sc0: { label: "Share Class 1", color: `hsl(${chartColors[0]})` },
      sc1: { label: "Share Class 2", color: `hsl(${chartColors[1]})` },
      sc2: { label: "Share Class 3", color: `hsl(${chartColors[2]})` },
    }),
    [chartColors],
  );

  const holdersConfig = useMemo(
    () => ({
      holders: { label: "Holders" },
      hld0: { label: "Holder 1", color: `hsl(${chartColors[0]})` },
      hld1: { label: "Holder 2", color: `hsl(${chartColors[1]})` },
      hld2: { label: "Holder 3", color: `hsl(${chartColors[2]})` },
      hld3: { label: "Holder 4", color: `hsl(${chartColors[3]})` },
      hld4: { label: "Others", color: `hsl(${chartColors[4]})` }, // Changed label to "Others"
    }),
    [chartColors],
  );

  useEffect(() => {
    const updateSparkleSize = () => {
      if (sparkleContainerRef.current) {
        const { width, height } =
          sparkleContainerRef.current.getBoundingClientRect();
        const minDimension = Math.min(width, height);
        setSparkleSize(Math.floor(minDimension));
      }
    };

    updateSparkleSize(); // Initial size calculation
    window.addEventListener("resize", updateSparkleSize);

    return () => window.removeEventListener("resize", updateSparkleSize);
  }, []);

  if (!clientReady || isAllFundsLoading || !stateModel) {
    return (
      <motion.div
        className="flex mt-[30vh] justify-center items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ease: "easeInOut", duration: 0 }}
      >
        {/*<SparkleBackground rows={6} cols={6} size={24} gap={5} static={false} visibleCount={252}  fadeInSpeed={1}/>*/}
        <SparkleBackground
          fadeOut={true}
          rows={6}
          cols={6}
          size={24}
          gap={5}
          fadeInSpeed={0.5}
          fadeOutSpeed={0.5}
          interval={200}
          randomness={0}
          visibleCount={12}
        />
      </motion.div>
    );
  }

  if (!fundPublicKey || (allFunds && allFunds.length > 0 && !stateModel)) {
    router.push("/");
    return null;
  }

  const handleColorGenerated = (generatedColor: string) => {
    setSparkleColor(generatedColor);
  };

  let mintData = (stateModel?.mints || []).map(
    (shareClass: any, j: number) => ({
      mint: shareClass?.shareClassSymbol,
      shares:
        Number(shareClass?.shareClassSupply) /
          10 ** (shareClass?.shareClassDecimals || 0) || 0,
      fill: `var(--color-sc${j})`,
    }),
  );

  const totalShares = mintData.reduce(
    (acc: number, cur: any) => acc + cur.shares,
    0,
  );

  let displayTotalShares = totalShares;

  // If totalShares is 0, set shares to 1 for the first share class to render the chart
  if (totalShares === 0 && mintData.length > 0) {
    mintData[0].shares = 1;
  }

  // If totalShares is 0, set displayTotalShares to 0
  if (totalShares === 0) {
    displayTotalShares = 0;
  }

  // Determine if the supply is zero
  const isZeroSupply = displayTotalShares === 0;

  // Updated Label for Shares PieChart
  const SharesLabel = ({ viewBox }: any) => {
    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
    return displayTotalShares > 0 ? (
      <text
        x={viewBox.cx}
        y={viewBox.cy}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x={viewBox.cx}
          y={viewBox.cy}
          className="fill-foreground text-3xl font-medium"
        >
          {displayTotalShares.toLocaleString()}
        </tspan>
        <tspan
          x={viewBox.cx}
          y={(viewBox.cy || 0) + 24}
          className="fill-muted-foreground"
        >
          Shares
        </tspan>
      </text>
    ) : null; // Hide the label if displayTotalShares is 0
  };

  return (
    <PageContentWrapper>
      <main className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-9 grid-rows-[auto_1fr] gap-4">
          {/* Top row */}
          <Card className="col-span-1 row-span-1 flex flex-col items-start p-0 border-0 shadow-none overflow-hidden aspect-square">
            <CardContent
              className="p-0 h-full flex items-center self-center"
              ref={sparkleContainerRef}
            >
              <Sparkle
                address={stateModel?.mints[0]?.fundId?.toBase58()!}
                size={105}
                onColorGenerated={handleColorGenerated}
              />
            </CardContent>
          </Card>

          <Card className="col-span-4 row-span-1 flex flex-col items-start justify-start p-2 overflow-clip">
            <CardHeader className="p-0 w-full">
              <CardTitle className="text-xl font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                {stateModel.name}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-2 overflow-clip">
                {stateModel.rawOpenfunds?.investmentObjective}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="col-span-2 row-span-2 p-2 flex flex-col justify-between aspect-square">
            <CardHeader className="p-0">
              <CardTitle className="text-muted-foreground opacity-75 text-md font-light">
                NAV per Share
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center text-5xl font-mono">
              {/* <NumberFormatter
                value={123.456789}
                addCommas
                minDecimalPlaces={2}
                maxLength={7}
                useLetterNotation
              /> */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-muted-foreground/50">
                    ...
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Coming soon.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card className="col-span-2 row-span-2 p-2 flex flex-col justify-between aspect-square">
            <CardHeader className="p-0">
              <CardTitle className="text-muted-foreground opacity-75 text-md font-light">
                Assets Under Management
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center text-5xl  font-mono">
              {/* <NumberFormatter
                value={987654321}
                addCommas
                minDecimalPlaces={2}
                maxLength={7}
                useLetterNotation
              /> */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-muted-foreground/50">
                    ...
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Coming soon.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Bottom row */}
          <div className="col-span-5 row-span-1 grid grid-cols-5 gap-4">
            <Card className="col-span-1 flex flex-col items-start justify-start font-medium text-xl gap-3 pl-2 pt-2 aspect-square ">
              <p className="text-muted-foreground opacity-75 text-xs font-light">
                Symbol
              </p>
              {stateModel.mints[0]?.symbol}
              <p className="text-muted-foreground opacity-25 text-xs font-light">
                <ExplorerLink
                  path={`/account/${stateModel?.mints[0]?.fundId?.toBase58()}`}
                  label={stateModel?.mints[0]?.fundId?.toBase58() || ""}
                />
              </p>
            </Card>
            <Card className="col-span-1 flex flex-col items-start justify-start font-medium text-xl gap-3 pl-2 pt-2 aspect-square">
              <p className="text-muted-foreground opacity-75 text-xs font-light">
                Class Asset
              </p>
              {stateModel.mints[0]?.rawOpenfunds?.shareClassCurrency}
              <p className="text-muted-foreground opacity-25 text-xs font-light">
                <ExplorerLink
                  path={`/account/${stateModel?.mints[0]?.rawOpenfunds?.shareClassCurrency}`}
                  label={
                    stateModel?.mints[0]?.rawOpenfunds?.shareClassCurrency || ""
                  }
                />
              </p>
            </Card>
            <Card className="col-span-3 flex flex-col items-start justify-start p-2 text-sm">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-muted-foreground opacity-75 text-xs font-light">
                  Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 w-full">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                        <div className="text-muted-foreground">Management</div>
                        <div className="font-medium text-right text-muted-foreground/50">
                          <NumberFormatter
                            value={0}
                            addCommas
                            minDecimalPlaces={2}
                            maxDecimalPlaces={2}
                            maxLength={6}
                            useLetterNotation
                            isPercentage={true}
                          />
                        </div>
                        <div className="text-muted-foreground">
                          Subscription
                        </div>
                        <div className="font-medium text-right text-muted-foreground/50">
                          <NumberFormatter
                            value={0}
                            addCommas
                            minDecimalPlaces={2}
                            maxDecimalPlaces={2}
                            maxLength={6}
                            useLetterNotation
                            isPercentage={true}
                          />
                        </div>
                        <div className="text-muted-foreground">Performance</div>
                        <div className="font-medium text-right text-muted-foreground/50">
                          <NumberFormatter
                            value={0}
                            addCommas
                            minDecimalPlaces={2}
                            maxDecimalPlaces={2}
                            maxLength={6}
                            useLetterNotation
                            isPercentage={true}
                          />
                        </div>
                        <div className="text-muted-foreground">Redemption</div>
                        <div className="font-medium text-right  text-muted-foreground/50">
                          <NumberFormatter
                            value={0.0}
                            addCommas
                            minDecimalPlaces={2}
                            maxDecimalPlaces={2}
                            maxLength={6}
                            useLetterNotation
                            isPercentage={true}
                          />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Coming soon.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mt-8 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holdings" disabled>
              Holdings
            </TabsTrigger>
            <TabsTrigger value="details" disabled>
              Details
            </TabsTrigger>
            <TabsTrigger value="policies" disabled>
              Policies
            </TabsTrigger>
            <TabsTrigger value="integrations" disabled>
              Integrations
            </TabsTrigger>
            <TabsTrigger value="access" disabled>
              Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-12 grid-rows-[auto_auto] gap-4">
              <Card className="col-span-8 row-span-1 min-h-[391px]">
                <CardContent className="flex flex-row justify-between gap-4 p-2">
                  <Tabs defaultValue="holders" className="w-full">
                    <TabsList>
                      <TabsTrigger value="holders">Supply</TabsTrigger>
                      <TabsTrigger
                        value="performance"
                        className="select-none"
                        disabled
                      >
                        Performance
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="holders"
                      className="flex flex-row  h-full"
                    >
                      <ChartContainer
                        config={mintConfig}
                        className="flex-1 mx-auto aspect-square max-h-[256px] self-center"
                      >
                        <PieChart>
                          {totalShares !== 0 && (
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel />}
                            />
                          )}
                          <Pie
                            isAnimationActive={false}
                            data={mintData}
                            dataKey="shares"
                            nameKey="mint"
                            innerRadius={90}
                            strokeWidth={5}
                            paddingAngle={2}
                          >
                            <Label
                              content={({ viewBox }) => {
                                if (
                                  viewBox &&
                                  "cx" in viewBox &&
                                  "cy" in viewBox
                                ) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="fill-foreground text-3xl font-medium"
                                      >
                                        {displayTotalShares.toLocaleString()}
                                      </tspan>
                                      <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 24}
                                        className="fill-muted-foreground"
                                      >
                                        Shares
                                      </tspan>
                                    </text>
                                  );
                                }
                                return null;
                              }}
                            />
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                      <ChartContainer
                        config={holdersConfig}
                        className="flex-1 mx-auto aspect-square max-h-[256px] self-center"
                      >
                        <ChartComponent
                          fundModel={stateModel}
                          holdersConfig={holdersConfig}
                        />
                      </ChartContainer>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              <Card className="col-span-4 row-span-1 min-h-[391px]">
                <CardContent className="p-2 text-sm">
                  <Tabs defaultValue="keyFacts" className="w-full">
                    <TabsList>
                      <TabsTrigger value="keyFacts">Key Facts</TabsTrigger>
                      <TabsTrigger value="onchain">Onchain</TabsTrigger>
                    </TabsList>
                    <TabsContent value="keyFacts">
                      <div className="grid gap-2">
                        <div className="font-medium">Basic Information</div>
                        <ul className="grid gap-2">
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Base Asset
                            </span>
                            <span>{stateModel.rawOpenfunds?.fundCurrency}</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Launch Date
                            </span>
                            <span>
                              {stateModel.rawOpenfunds?.fundLaunchDate}
                            </span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Domicile
                            </span>
                            <span>
                              {stateModel.rawOpenfunds?.fundDomicileAlpha2 ===
                              "XS"
                                ? "Solana"
                                : stateModel.rawOpenfunds?.fundDomicileAlpha2}
                            </span>
                          </li>
                        </ul>
                      </div>
                      <Separator className="my-4" />
                      <div className="grid gap-2">
                        <div className="font-medium">Share Class Details</div>
                        <dl className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Share Class Asset
                            </dt>
                            <dd>
                              {
                                stateModel.mints[0]?.rawOpenfunds
                                  ?.shareClassCurrency
                              }
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Launch Date
                            </dt>
                            <dd>
                              {
                                stateModel.mints[0]?.rawOpenfunds
                                  ?.shareClassLaunchDate
                              }
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Lifecycle Stage
                            </dt>
                            <dd>
                              {
                                stateModel.mints[0]?.rawOpenfunds
                                  ?.shareClassLifecycle
                              }
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Investment Status
                            </dt>
                            <dd>
                              {
                                stateModel.mints[0]?.rawOpenfunds
                                  ?.investmentStatus
                              }
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Minimal Subscription
                            </dt>
                            <dd>
                              {/* {fundModel.shareClasses[0]
                                ?.rawOpenfunds?.minimalInitialSubscriptionInShares > 0
                                ? fundModel.shareClasses[0]
                                    ?.minimalInitialSubscriptionInShares +
                                  " shares"
                                : fundModel.shareClasses[0]
                                      ?.minimalInitialSubscriptionInAmount > 0
                                  ? fundModel.shareClasses[0]
                                      ?.minimalInitialSubscriptionInAmount +
                                    " " +
                                    fundModel.shareClasses[0]
                                      ?.currencyOfMinimalSubscription
                                  : "-"} */}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Distribution Policy
                            </dt>
                            <dd>
                              {
                                stateModel.mints[0]?.rawOpenfunds
                                  ?.shareClassDistributionPolicy
                              }
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </TabsContent>
                    <TabsContent value="onchain">
                      <div className="grid gap-2">
                        <div className="font-medium">Fund Accounts</div>
                        <ul className="grid gap-2">
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">Fund</span>
                            <ExplorerLink
                              path={`/account/${stateModel?.idStr}`}
                              label={stateModel?.idStr}
                            />
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Manager
                            </span>
                            <ExplorerLink
                              path={`/account/${stateModel?.owner?.portfolioManagerName || stateModel?.owner?.pubkey}`}
                              label={
                                stateModel?.owner?.portfolioManagerName ||
                                stateModel?.owner?.pubkey?.toBase58() ||
                                ""
                              }
                            />
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Treasury
                            </span>
                            <ExplorerLink
                              path={`/account/${stateModel.vaultPda}`}
                              label={stateModel?.vaultPda.toBase58()}
                            />
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Metadata
                            </span>
                            <ExplorerLink
                              path={`/account/${stateModel?.openfundsPda}`}
                              label={stateModel?.openfundsPda.toBase58()}
                            />
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Openfunds
                            </span>
                            <span className="flex gap-2">
                              <a
                                href={`https://api.glam.systems/v0/openfunds?fund=${product}&format=csv`}
                                rel="noopener noreferrer"
                                target="_blank"
                                className="link"
                              >
                                CSV
                              </a>

                              <a
                                href={`https://api.glam.systems/v0/openfunds?fund=${product}&format=json`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                              >
                                JSON
                              </a>
                            </span>
                          </li>
                        </ul>
                      </div>
                      <Separator className="my-4" />
                      <div className="grid gap-2">
                        <div className="font-medium">Share Class Accounts</div>
                        <dl className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Share Class 1 {stateModel?.mints[0]?.symbol}
                            </dt>
                            <ExplorerLink
                              path={`/account/${stateModel?.shareClassMints[0]}`}
                              label={stateModel?.shareClassMints[0].toBase58()}
                            />
                          </div>
                        </dl>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="holdings">
            <div className="grid grid-cols-12 grid-rows-[auto_auto] gap-4">
              <Card className="col-span-12 row-span-1">
                <CardHeader>
                  <CardTitle>Asset Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Detailed breakdown of your current holdings.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="grid grid-cols-12 grid-rows-[auto_auto] gap-4">
              <Card className="col-span-6 row-span-1">
                <CardHeader>
                  <CardTitle>Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Details of the product.</p>
                </CardContent>
              </Card>
              <Card className="col-span-6 row-span-1">
                <CardHeader>
                  <CardTitle>Share Class</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Details of the share class.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="policies">
            <div className="grid grid-cols-12 grid-rows-[auto_auto] gap-4">
              <Card className="col-span-12 row-span-1">
                <CardHeader>
                  <CardTitle>Policies</CardTitle>
                </CardHeader>
                <CardContent>Policies</CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="grid grid-cols-12 grid-rows-[auto_auto] gap-4">
              <Card className="col-span-12 row-span-1">
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                </CardHeader>
                <CardContent>Integrations</CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="access">
            <div className="grid grid-cols-12 grid-rows-[auto_auto] gap-4">
              <Card className="col-span-12 row-span-1">
                <CardHeader>
                  <CardTitle>Access</CardTitle>
                </CardHeader>
                <CardContent>Access</CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </PageContentWrapper>
  );
}

// Skeleton component for the chart
const SkeletonChart = () => {
  return (
    <div className="relative w-[196px] h-[196px] flex mr-auto ml-auto mt-8">
      <Skeleton className="absolute inset-0 rounded-full border-[9px] bg-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-8 mb-2 mt-1 mx-auto" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
      </div>
    </div>
  );
};
