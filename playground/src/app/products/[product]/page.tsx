"use client";

import * as React from "react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  XAxis,
  Pie,
  PieChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import Sparkle from "@/utils/Sparkle";
import SparkleColorMatcher, { getColorInfo, ColorInfo } from "@/utils/SparkleColorMatcher";
import TruncateAddress from "@/utils/TruncateAddress";
import PageContentWrapper from "@/components/PageContentWrapper";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CopyIcon, DotsVerticalIcon, DownloadIcon } from "@radix-ui/react-icons";
import { Separator } from "@/components/ui/separator"; // Adjust the import based on your setup
import NumberFormatter from "@/utils/NumberFormatter";

const mintData = [
  { mint: "SC 1", shares: 811, fill: "var(--color-sc0)" },
  { mint: "SC 2", shares: 563, fill: "var(--color-sc1)" },
  { mint: "SC 3", shares: 190, fill: "var(--color-sc2)" },
];

const holdersData = [
  {
    holder: (
      <TruncateAddress address="x4phvuadaSxoNeJxTeeTLg5T8sGePNohR7FZ11x37n6" />
    ),
    shares: 689,
    fill: "var(--color-hld0)",
  },
  {
    holder: (
      <TruncateAddress address="xC8q8zvuZwBwEL62dBsqrKPxoPA9dumgCf6dMctNWAC" />
    ),
    shares: 303,
    fill: "var(--color-hld1)",
  },
  {
    holder: (
      <TruncateAddress address="xZuZNohvFdWjdDzjwLm7yFSw7dAguB3xu9ZvPc3QQk1" />
    ),
    shares: 130,
    fill: "var(--color-hld2)",
  },
  {
    holder: (
      <TruncateAddress address="xzLex8zbvVHeh3TYo9udB9rJBWJVejxA1KvcXNHjTJw" />
    ),
    shares: 115,
    fill: "var(--color-hld3)",
  },
  {
    holder: (
      <TruncateAddress address="xcdcMjqxs7T9wmsyNkHKeY6588xHXDm6U4op5uAz38m" />
    ),
    shares: 112,
    fill: "var(--color-hld4)",
  },
];

const headerConfig = {
  views: {
    label: "Overview",
  },
  aum: {
    label: "Assets Under Management",
    color: "hsl(var(--chart-1))",
  },
  nav: {
    label: "NAV per Share",
    color: "hsl(var(--chart-1))",
  },
  mgmtFee: {
    label: "Management Fee",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ProductPage() {
  const params = useParams();
  const { product } = params;

  const publicKey = useMemo(() => {
    if (!product) {
      return;
    }
    try {
      return new PublicKey(product);
    } catch (e) {
      console.log(`Invalid public key`, e);
    }
  }, [product]);

  if (!publicKey) {
    return <div>Error loading product</div>;
  }

  const total = React.useMemo(
    () => ({
      aum: 123456,
      nav: 78.91,
      mgmtFee: "1.00%",
    }),
    []
  );

  const totalShares = React.useMemo(() => {
    return mintData.reduce((acc, curr) => acc + curr.shares, 0);
  }, []);

  const totalHolders = React.useMemo(() => {
    return holdersData.reduce((acc, curr) => acc + curr.shares, 0);
  }, []);

  const [sparkleColor, setSparkleColor] = useState<string>("");
  const [useDefaultColors, setUseDefaultColors] = React.useState(false);

  const handleColorGenerated = (generatedColor: string) => {
    setSparkleColor(generatedColor);
  };

  const colorInfo: ColorInfo = useMemo(() => {
    return getColorInfo(sparkleColor);
  }, [sparkleColor]);

  const sparkleContainerRef = useRef<HTMLDivElement>(null);
  const [sparkleSize, setSparkleSize] = useState(50); // Default size

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
    return colorInfo.colors;
  }, [useDefaultColors, colorInfo.colors]);

  const mintConfig = useMemo(() => ({
    shares: { label: "Shares" },
    sc0: { label: "Share Class 1", color: `hsl(${chartColors[0]})` },
    sc1: { label: "Share Class 2", color: `hsl(${chartColors[1]})` },
    sc2: { label: "Share Class 3", color: `hsl(${chartColors[2]})` },
  }), [chartColors]);

  const holdersConfig = useMemo(() => ({
    holders: { label: "Holders" },
    hld0: { label: "Holder 1", color: `hsl(${chartColors[0]})` },
    hld1: { label: "Holder 2", color: `hsl(${chartColors[1]})` },
    hld2: { label: "Holder 3", color: `hsl(${chartColors[2]})` },
    hld3: { label: "Holder 4", color: `hsl(${chartColors[3]})` },
    hld4: { label: "Holder 5", color: `hsl(${chartColors[4]})` },
  }), [chartColors]);

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

  return (
    <PageContentWrapper>
      <main className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-9 grid-rows-[auto_1fr] gap-4">
          {/* Top row */}
          <Card className="border-transparent border-0 col-span-1 row-span-1 aspect-square shadow-none">
            <CardContent className="p-0 h-full" ref={sparkleContainerRef}>
              <Sparkle
                address={publicKey.toBase58()}
                size={sparkleSize}
                onColorGenerated={handleColorGenerated}
              />
            </CardContent>
          </Card>
          <Card className="col-span-4 row-span-1 flex flex-col items-start justify-start p-2 h-[102px] overflow-hidden">
            <CardHeader className="p-0 w-full">
              <CardTitle className="text-xl font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                GLAM Managed SOL
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-2 overflow-hidden">
                GLAM Managed SOL is a managed fund that invests in SOL.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="col-span-2 row-span-2 aspect-square p-2 flex flex-col justify-between">
            <CardHeader className="p-0">
              <CardTitle className="text-muted-foreground opacity-75 text-md font-light">
                NAV per Share
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center text-5xl">
              <NumberFormatter
                value={123.456789}
                addCommas
                minDecimalPlaces={2}
                maxLength={7}
                useLetterNotation
              />
            </CardContent>
          </Card>

          <Card className="col-span-2 row-span-2 aspect-square p-2 flex flex-col justify-between">
            <CardHeader className="p-0">
              <CardTitle className="text-muted-foreground opacity-75 text-md font-light">
                Assets Under Management
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center text-5xl">
              <NumberFormatter
                value={987654321}
                addCommas
                minDecimalPlaces={2}
                maxLength={7}
                useLetterNotation
              />
            </CardContent>
          </Card>

          {/* Bottom row */}
          <div className="col-span-5 row-span-1 grid grid-cols-5 gap-4">
            <Card className="col-span-1 flex flex-col items-start justify-start font-medium text-xl gap-3 pl-2 pt-2 aspect-square">
              <p className="text-muted-foreground opacity-75 text-xs font-light">
                Symbol
              </p>
              gmSOL
              <p className="text-muted-foreground opacity-25 text-xs font-light">
                <TruncateAddress address={publicKey.toBase58()} />
              </p>
            </Card>
            <Card className="col-span-1 flex flex-col items-start justify-start font-medium text-xl gap-3 pl-2 pt-2 aspect-square">
              <p className="text-muted-foreground opacity-75 text-xs font-light">
                Class Asset
              </p>
              SOL
              <p className="text-muted-foreground opacity-25 text-xs font-light">
                <TruncateAddress address="So11111111111111111111111111111111111111112" />
              </p>
            </Card>
            <Card className="col-span-3 flex flex-col items-start justify-start p-2 text-sm">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-muted-foreground opacity-75 text-xs font-light">
                  Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 w-full">
                <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                  <div className="text-muted-foreground">Management</div>
                  <div className="font-medium text-right">
                    <NumberFormatter
                      value={0.0123546}
                      addCommas
                      minDecimalPlaces={2}
                      maxDecimalPlaces={2}
                      maxLength={6}
                      useLetterNotation
                      isPercentage={true}
                    />
                  </div>
                  <div className="text-muted-foreground">Subscription</div>
                  <div className="font-medium text-right">
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
                  <div className="font-medium text-right">
                    <NumberFormatter
                      value={0.1}
                      addCommas
                      minDecimalPlaces={2}
                      maxDecimalPlaces={2}
                      maxLength={6}
                      useLetterNotation
                      isPercentage={true}
                    />
                  </div>
                  <div className="text-muted-foreground">Redemption</div>
                  <div className="font-medium text-right">
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
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mt-8 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-12 grid-rows-[auto_auto] gap-4">
              <Card className="col-span-8 row-span-1">
                <CardContent className="flex flex-row justify-between gap-4 p-2">
                  <Tabs defaultValue="holders" className="w-full">
                    <TabsList>
                      <TabsTrigger value="holders">Holders</TabsTrigger>
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
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                          />
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
                                        {totalShares.toLocaleString()}
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
                              }}
                            />
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                      <ChartContainer
                        config={holdersConfig}
                        className="flex-1 mx-auto aspect-square max-h-[256px]  self-center"
                      >
                        <PieChart>
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Pie
                            data={holdersData}
                            isAnimationActive={false}
                            dataKey="shares"
                            nameKey="holder"
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
                                        {holdersData.length.toLocaleString()}
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
                              }}
                            />
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              <Card className="col-span-4 row-span-1 aspect-square">
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
                            <span>SOL</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Launch Date
                            </span>
                            <span>August 20, 2024</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Domicile
                            </span>
                            <span>Solana</span>
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
                            <dd>SOL</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Launch Date
                            </dt>
                            <dd>August 20, 2024</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Lifecycle Stage
                            </dt>
                            <dd>Active</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Investment Satus
                            </dt>
                            <dd>Open</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Minimal Subscription
                            </dt>
                            <dd>
                              1 <span>SOL</span>
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Distribution Policy
                            </dt>
                            <dd>Accumulating</dd>
                          </div>
                        </dl>
                      </div>
                    </TabsContent>
                    <TabsContent value="onchain">
                      <div className="grid gap-2">
                        <div className="font-medium">Fund Accounts</div>
                        <ul className="grid gap-2">
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Fund
                            </span>
                            <span>
                              <TruncateAddress address="G8NKLJ2Y3TFrjXpfkpGJQZLXvbKKyvNDzc84C8P3DDU8" />
                            </span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Manager
                            </span>
                            <span>
                              <TruncateAddress address="gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff" />
                            </span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Treasury
                            </span>
                            <span><TruncateAddress address="5SVdBngSHNGtYaQxkzJxso4S7ggaVb3vaKy5LSqbrFpZ"/></span>
                          </li>
                        </ul>
                      </div>
                      <Separator className="my-4" />
                      <div className="grid gap-2">
                        <div className="font-medium">Share Class Accounts</div>
                        <dl className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">
                              Share Class 1 gmSOL
                            </dt>
                            <dd><TruncateAddress address="4DR9bKNPeCcdHaVhdHPh8ge2vEevwZpFpuwyMnWyF3Fu"/></dd>
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