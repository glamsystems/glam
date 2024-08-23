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
import SparkleColorMatcher from "@/utils/SparkleColorMatcher";
import TruncateAddress from "@/utils/TruncateAddress";
import PageContentWrapper from "@/components/PageContentWrapper";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  {
    holder: (
      <TruncateAddress address="xfBY6dJ4CkcCjB7R8akvxBMTGmZwVeFZPLwjF1oPN5S" />
    ),
    shares: 68,
    fill: "var(--color-hld5)",
  },
  {
    holder: (
      <TruncateAddress address="xH9as6TSRa2seaGyR4N8DckvW2u1ZNrvXfCTQsmjHWm" />
    ),
    shares: 58,
    fill: "var(--color-hld6)",
  },
  {
    holder: (
      <TruncateAddress address="x2JLb67iizpn5SbWS1TgiZ64tCadVLpsDg36KA7VJzP" />
    ),
    shares: 50,
    fill: "var(--color-hld7)",
  },
  {
    holder: (
      <TruncateAddress address="xfauCwxJYsUUg1ZQG3qupZmvyNRPkcXvZoXmrANhHAe" />
    ),
    shares: 24,
    fill: "var(--color-hld8)",
  },
  {
    holder: (
      <TruncateAddress address="xLoKLKde9CnfvaLJqroaeGq57meboh8YRGfJAZaCP7K" />
    ),
    shares: 15,
    fill: "var(--color-hld9)",
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

const mintConfig = {
  shares: {
    label: "Shares",
  },
  sc0: {
    label: "Share Class 1",
    color: "hsl(var(--chart-1))",
  },
  sc1: {
    label: "Share Class 2",
    color: "hsl(var(--chart-2))",
  },
  sc2: {
    label: "Share Class 3",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const holdersConfig = {
  holders: {
    label: "Holders",
  },
  hld0: {
    label: "Holder 1",
    color: "hsl(var(--chart-1))",
  },
  hld1: {
    label: "Holder 2",
    color: "hsl(var(--chart-2))",
  },
  hld2: {
    label: "Holder 3",
    color: "hsl(var(--chart-3))",
  },
  hld3: {
    label: "Holder 4",
    color: "hsl(var(--chart-4))",
  },
  hld4: {
    label: "Holder 5",
    color: "hsl(var(--chart-5))",
  },
  hld5: {
    label: "Holder 6",
    color: "hsl(var(--chart-4))",
  },
  hld6: {
    label: "Holder 7",
    color: "hsl(var(--chart-3))",
  },
  hld7: {
    label: "Holder 8",
    color: "hsl(var(--chart-2))",
  },
  hld8: {
    label: "Holder 9",
    color: "hsl(var(--chart-1))",
  },
  hld9: {
    label: "Holder 10",
    color: "hsl(var(--chart-2))",
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

  const [color, setColor] = React.useState<string>("");

  const handleColorGenerated = (generatedColor: string) => {
    setColor(generatedColor);
  };

  const sparkleContainerRef = useRef(null);
  const [sparkleSize, setSparkleSize] = useState(50); // Default size

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
          <Card className="border-transparent col-span-1 row-span-1 aspect-square">
            <CardContent className="p-0 h-full" ref={sparkleContainerRef}>
              <Sparkle
                address={publicKey.toBase58()}
                size={sparkleSize}
                onColorGenerated={handleColorGenerated}
              />
            </CardContent>
          </Card>
          <Card className="col-span-4 row-span-1 flex items-center">
            <CardContent className="">
              <TruncateAddress address={publicKey.toBase58()} />
            </CardContent>
          </Card>
          <Card className="col-span-2 row-span-2 aspect-square"></Card>
          <Card className="col-span-2 row-span-2 aspect-square"></Card>

          {/* Bottom row */}
          <div className="col-span-5 row-span-1 grid grid-cols-5 gap-4">
            <Card className="col-span-1 flex flex-col items-start justify-center font-medium text-xl gap-3 pl-2">
              <p className="text-muted-foreground opacity-75 text-xs font-light">
                Symbol
              </p>
              gmSOL
              <p className="text-muted-foreground opacity-25 text-xs font-light">
                <TruncateAddress address={publicKey.toBase58()} />
              </p>
            </Card>
            <Card className="col-span-1 flex flex-col items-start justify-center font-medium text-xl gap-3 pl-2">
              <p className="text-muted-foreground opacity-75 text-xs font-light">
                Fund Asset
              </p>
              SOL
              <p className="text-muted-foreground opacity-25 text-xs font-light">
                <TruncateAddress address="So11111111111111111111111111111111111111112" />
              </p>
            </Card>
            <Card className="col-span-3 flex items-center justify-center font-medium text-xl">
              <SparkleColorMatcher color={color} />
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
                <CardContent className="flex flex-row justify-between gap-4 pl-0 p-0">
                  <Tabs defaultValue="holders" className="w-full">
                    <TabsList className=" mb-6">
                      <TabsTrigger value="holders">Holders</TabsTrigger>
                      <TabsTrigger
                        value="performance"
                        className="select-none"
                        disabled
                      >
                        Performance
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="holders" className="flex flex-row">
                      <ChartContainer
                        config={mintConfig}
                        className="flex-1 mx-auto aspect-square max-h-[200px]"
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
                            innerRadius={60}
                            strokeWidth={5}
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
                                        className="fill-foreground text-3xl font-bold"
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
                        className="flex-1 mx-auto aspect-square max-h-[200px]"
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
                            innerRadius={60}
                            strokeWidth={5}
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
                                        className="fill-foreground text-3xl font-bold"
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
                <CardHeader>
                  <CardTitle>Key Facts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Key performance indicators at a glance.</p>
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
