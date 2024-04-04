import "@carbon/charts-react/styles.css";

import { PublicKey } from "@solana/web3.js";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { LineChart, ScaleTypes } from "@carbon/charts-react";
import {
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Tile
} from "@carbon/react";
import { formatNumber, formatPercent } from "../utils/format-number";
import { useParams, useNavigate, useNavigation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";

import { SideActionBar } from "./SideActionBar";
import { getTokenMetadata } from "@solana/spl-token";
import { gray70Hover } from "@carbon/colors";
import { useQuery } from "@tanstack/react-query";

import {
  useGlamProgramAccount,
  useFundPerfChartData
} from "../glam/glam-data-access";
import { useMemo } from "react";

export default function ProductPage() {
  const grayStyle = {
    color: gray70Hover,
    fontSize: "14px",
    lineHeight: "18px"
  };

  // retrieve the publicKey from the URL
  let { id } = useParams();

  // fetch the fund, for now we default to 2ex...
  const defaultFund = "AdXkDnJpFKqZeoUygLvm5dp2b5JGVPz3rEWfGCtB5Kc2";
  let glam = new PublicKey(defaultFund);
  try {
    glam = new PublicKey(id || defaultFund);
  } catch (_e) {
    // pass
  }

  /*
  const { data: fundPerfData } = useQuery({
    queryKey: ["performance"],
    queryFn: () =>
      fetch(`http://localhost:8080/fund/${id || defaultFund}/perf`).then(
        (res) => res.json()
      )
  });
  console.log(fundPerfData);
  */
  const fundPerfChartData = useFundPerfChartData(id || defaultFund);

  const { account } = useGlamProgramAccount({ glam });
  if (account.isLoading) {
    return ""; //spinner
  }

  const data = account.data;

  const { publicKey } = useWallet();
  const isManager = publicKey?.toString() == data?.manager?.toString();

  const fund = {
    id: glam.toString(),
    symbol: data?.symbol,
    name: data?.name,
    investmentObjective:
      "The iShares Bitcoin Trust seeks to reflect generally the performance of the price of bitcoin.",
    nav: 39.72,
    dailyNavChange: 0.12,
    "24HourNavChange": 0.0029,
    daily: 0.29,
    aum: 15941890385,
    dailyNetInflows: 13987428,
    "24HourNetInflowChange": 0.0089,
    // will optimize looping later once we have all the necessary data
    fees: {
      management: +(
        // data?.additionalMetadata?.find((x) => x[0] === 'fee_management')?.[1] ??
        0
      ),
      performance: +(
        // data?.additionalMetadata?.find(
        //   (x) => x[0] === 'fee_performance'
        // )?.[1] ??
        0
      ),
      subscription: 0.0,
      redemption: 0.0
    },
    facts: {
      launchDate: "",
      // launchDate: data?.additionalMetadata?.find(
      //   (x) => x[0] === 'launch_date'
      // )?.[1],
      fundAsset: "USDC"
    },
    terms: {
      highWaterMark: false,
      hurdleRate: false,
      lockupPeriod: "60", // denominated in minutes
      minimumSubscription: 1,
      maximumSubscription: 10000
    }
  };

  const chartData = {
    data: fundPerfChartData || [],
    options: {
      title: "Performance",
      axes: {
        bottom: {
          mapsTo: "date",
          scaleType: ScaleTypes.TIME
        },
        left: {
          mapsTo: "value",
          scaleType: ScaleTypes.LINEAR
        }
      },
      curve: "curveMonotoneX",
      height: "365px",
      legend: {
        enabled: true
      },
      toolbar: {
        enabled: false
      },
      tooltip: {
        showTotal: false
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col mx-[50px] md:mx-[80px] xl:mx-[180px]">
        <div className="flex gap-[8px] mt-[80px] mb-[32px]">
          <p
            style={{
              color: gray70Hover
            }}
          >
            Products{" "}
          </p>
          <p>{` / ${fund.name}`}</p>
        </div>

        <div className="flex items-center gap-[16px] mb-[32px]">
          <img
            src={`https://api.glam.systems/image/${fund.id}.png`}
            style={{
              width: "64px",
              height: "64px"
            }}
          />
          <h1
            style={{
              fontSize: "32px",
              lineHeight: "40px"
            }}
          >
            {fund.name}
          </h1>
          <Tag type="warm-gray" className="rounded-none">
            {fund.symbol}
          </Tag>
        </div>

        <Tabs>
          <TabList aria-label="List of tabs" className="mb-[32px]">
            <Tab>Overview</Tab>
            <Tab>Positions</Tab>
            <Tab>Policies</Tab>
            <Tab>Share Classes</Tab>
          </TabList>
          <TabPanels>
            <TabPanel style={{ padding: "0px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "8px"
                }}
              >
                <div className="col-span-1">
                  <Tile className="h-full">
                    <p>Investment Objective</p>
                    <br />
                    <p>{fund.investmentObjective}</p>
                  </Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full">
                    <div className="flex flex-col gap-[12px]">
                      <p>NAV</p>
                      <p className="text-xl text-black">{fund.nav}</p>
                    </div>
                    <br />
                    <div className="flex flex-col gap-[12px]">
                      <p>1 Day NAV Change</p>
                      <div className="flex items-center ">
                        <p className="text-xl text-black">
                          {fund.dailyNavChange} (
                          {formatPercent(fund["24HourNavChange"])})
                        </p>
                        {fund["24HourNavChange"] > 0 ? (
                          <IconArrowUpRight size={24} color="#48BF84" />
                        ) : (
                          <IconArrowDownRight size={24} color="#FF5F5F" />
                        )}
                      </div>
                    </div>
                  </Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full">
                    <div className="flex flex-col gap-[12px]">
                      <p>AUM</p>
                      <p className="text-xl text-black">
                        {formatNumber(fund.aum)}
                      </p>
                    </div>
                    <br />
                    <div className="flex flex-col gap-[12px]">
                      <p>1 Day Net Flows</p>
                      <div className="flex items-center">
                        <p className="text-xl text-black">
                          {formatNumber(fund.dailyNetInflows)} (
                          {formatPercent(fund["24HourNetInflowChange"])})
                        </p>
                        {fund["24HourNetInflowChange"] > 0 ? (
                          <IconArrowUpRight size={24} color="#4FC879" />
                        ) : (
                          <IconArrowDownRight size={24} color="#FF5F5F" />
                        )}
                      </div>
                    </div>
                  </Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full">
                    <div className="flex flex-col gap-[32px]">
                      <p>Fees</p>
                      <div className="flex flex-col gap-[8px]">
                        <div className="flex justify-between">
                          <p style={grayStyle}>Management Fee</p>
                          <strong>{formatPercent(fund.fees.management)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Performance Fee</p>
                          <strong>
                            {formatPercent(fund.fees.performance)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Subscription Fee</p>
                          <strong>
                            {formatPercent(fund.fees.subscription)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Redemption Fee</p>
                          <strong>{formatPercent(fund.fees.redemption)}</strong>
                        </div>
                      </div>
                    </div>
                  </Tile>
                </div>
                <div className="row-span-2">
                  <Tabs>
                    <TabList
                      aria-label="List of tabs"
                      contained
                      style={{
                        width: "100%"
                      }}
                    >
                      <Tab disabled={!isManager}>Manage</Tab>
                      <Tab>Subscribe</Tab>
                      <Tab>Redeem</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        <SideActionBar
                          type="Manage"
                          primayButtonFunction={() => {}}
                        />
                      </TabPanel>
                      <TabPanel>
                        <SideActionBar
                          type="Subscribe"
                          primayButtonFunction={() => {}}
                        />
                      </TabPanel>
                      <TabPanel>
                        <SideActionBar
                          type="Redeem"
                          primayButtonFunction={() => {}}
                        />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </div>
                <div className="col-span-2">
                  <Tile className="">
                    <LineChart
                      data={chartData.data}
                      options={chartData.options}
                    />
                  </Tile>
                </div>
                <div className="col-span-2">
                  <Tile className="">
                    <div className="flex flex-col gap-[32px]">
                      <p>Facts</p>
                      <div className="flex flex-col gap-[14px]">
                        <div className="flex justify-between">
                          <p style={grayStyle}>Share Class Asset</p>
                          <strong>{fund.facts.fundAsset}</strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Inception Date</p>
                          <strong>{fund.facts.launchDate}</strong>
                        </div>
                      </div>
                    </div>
                  </Tile>
                  <Tile className="mt-[8px]">
                    <div className="flex flex-col gap-[32px]">
                      <p className="mt-4">Terms</p>
                      <div className="flex flex-col gap-[14px]">
                        <div className="flex justify-between">
                          <p style={grayStyle}>High-Water Mark</p>
                          <strong>
                            {fund.terms.highWaterMark ? "Yes" : "No"}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Hurdle Rate</p>
                          <strong>
                            {fund.terms.hurdleRate ? "Yes" : "No"}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Lockup Period</p>
                          <strong>{`${+fund.terms.lockupPeriod / 60} hour${
                            +fund.terms.lockupPeriod / 60 > 1 ? "s" : ""
                          }`}</strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Minimum Subscription</p>
                          <strong>
                            {formatNumber(fund.terms.minimumSubscription)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Maximum Subscription</p>
                          <strong>
                            {formatNumber(fund.terms.maximumSubscription)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </Tile>
                </div>
              </div>
            </TabPanel>
            <TabPanel style={{ padding: "0px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "8px"
                }}
              >
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
              </div>
            </TabPanel>
            <TabPanel style={{ padding: "0px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "8px"
                }}
              >
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
              </div>
            </TabPanel>
            <TabPanel style={{ padding: "0px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "8px"
                }}
              >
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
                <div className="col-span-1">
                  <Tile className="h-full"></Tile>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}
