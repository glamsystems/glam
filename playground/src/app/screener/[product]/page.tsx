"use client";

import * as React from "react"
import { CartesianGrid, Label, Line, LineChart, XAxis, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import Sparkle from "@/utils/Sparkle";
import SparkleColorMatcher from "@/utils/SparkleColorMatcher";
import TruncateAddress from "@/utils/TruncateAddress";
import PageContentWrapper from "@/components/PageContentWrapper";

const mintData = [
  { mint: "SC 1", shares: 811, fill: "var(--color-sc0)" },
  { mint: "SC 2", shares: 563, fill: "var(--color-sc1)" },
  { mint: "SC 3", shares: 190, fill: "var(--color-sc2)" },
]

const holdersData = [
  { holder: <TruncateAddress address="x4phvuadaSxoNeJxTeeTLg5T8sGePNohR7FZ11x37n6" />, shares: 689, fill: "var(--color-hld0)" },
  { holder: <TruncateAddress address="xC8q8zvuZwBwEL62dBsqrKPxoPA9dumgCf6dMctNWAC" />, shares: 303, fill: "var(--color-hld1)" },
  { holder: <TruncateAddress address="xZuZNohvFdWjdDzjwLm7yFSw7dAguB3xu9ZvPc3QQk1" />, shares: 130, fill: "var(--color-hld2)" },
  { holder: <TruncateAddress address="xzLex8zbvVHeh3TYo9udB9rJBWJVejxA1KvcXNHjTJw" />, shares: 115, fill: "var(--color-hld3)" },
  { holder: <TruncateAddress address="xcdcMjqxs7T9wmsyNkHKeY6588xHXDm6U4op5uAz38m" />, shares: 112, fill: "var(--color-hld4)" },
  { holder: <TruncateAddress address="xfBY6dJ4CkcCjB7R8akvxBMTGmZwVeFZPLwjF1oPN5S" />, shares: 68, fill: "var(--color-hld5)" },
  { holder: <TruncateAddress address="xH9as6TSRa2seaGyR4N8DckvW2u1ZNrvXfCTQsmjHWm" />, shares: 58, fill: "var(--color-hld6)" },
  { holder: <TruncateAddress address="x2JLb67iizpn5SbWS1TgiZ64tCadVLpsDg36KA7VJzP" />, shares: 50, fill: "var(--color-hld7)" },
  { holder: <TruncateAddress address="xfauCwxJYsUUg1ZQG3qupZmvyNRPkcXvZoXmrANhHAe" />, shares: 24, fill: "var(--color-hld8)" },
  { holder: <TruncateAddress address="xLoKLKde9CnfvaLJqroaeGq57meboh8YRGfJAZaCP7K" />, shares: 15, fill: "var(--color-hld9)" },
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
  }
} satisfies ChartConfig

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
} satisfies ChartConfig

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

  const [color, setColor] = React.useState<string>("");

  const handleColorGenerated = (generatedColor: string) => {
    setColor(generatedColor);
  };

  const total = React.useMemo(
    () => ({
      aum: 123456,
      nav: 78.91,
      mgmtFee: "1.00%"
    }),
    []
  )

  const totalShares = React.useMemo(() => {
    return mintData.reduce((acc, curr) => acc + curr.shares, 0)
  }, [])

  const totalHolders = React.useMemo(() => {
    return holdersData.reduce((acc, curr) => acc + curr.shares, 0)
  }, [])

  return (
      <PageContentWrapper>
        <Card className="w-full">
          <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="pt-7 pl-7">
              <Sparkle address={publicKey.toBase58()} size={50} onColorGenerated={handleColorGenerated}/>
            </div>
            <div className="flex flex-col flex-1 justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle><TruncateAddress address={publicKey.toBase58()} /></CardTitle>
              <CardDescription>
                <SparkleColorMatcher color={color} />
              </CardDescription>
            </div>
            <div className="flex">
              {["aum", "nav","mgmtFee"].map((key) => {
                const chart = key as keyof typeof headerConfig
                return (<div
                    key={chart}
                    className="relative z-30 flex flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                  >
                <span className="text-xs text-muted-foreground">
                  {headerConfig[chart].label}
                </span>
                    <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
                  </div>)
              })}
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={mintConfig}
              className="mx-auto aspect-square max-h-[250px]"
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
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ChartContainer
              config={holdersConfig}
              className="mx-auto aspect-square max-h-[250px]"
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
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </PageContentWrapper>
    )
}
