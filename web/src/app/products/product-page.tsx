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
import { ExplorerLink } from "../cluster/cluster-ui";
import { ellipsify } from "../ui/ui-layout";


class FundModel {
  key: PublicKey;
  data: any;
 
  constructor(key: PublicKey, data: any) {
    this.key = key;
    this.data = data || {};
  }

  getImageUrl() {
    const pubkey = this.data?.shareClasses[0].toBase58() || '1111111111111111111111111111111111';
    return `https://api.glam.systems/image/${pubkey}.png`;
  }

  getManagementFee() {
    return this.data?.shareClassesMetadata[0].feeManagement / 1_000_000.0;
  }
  getPerformanceFee() {
    return this.data?.shareClassesMetadata[0].feePerformance / 1_000_000.0;
  }

}


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
  let fundKey = new PublicKey(defaultFund);
  try {
    fundKey = new PublicKey(id || defaultFund);
  } catch (_e) {
    // pass
  }
  const fundId = fundKey.toString();

  const fundPerfChartData = useFundPerfChartData(fundId);

  const { account } = useGlamProgramAccount({ fundKey });
  if (account.isLoading) {
    return ""; //spinner
  }

  const data = account.data;
  const fundModel = new FundModel(fundKey, account.data);

  const { publicKey } = useWallet();
  const isManager = publicKey?.toString() == data?.manager?.toString();

  const aum = 417.758475 + 0.2*66_891.80;
  const totalShares = 1_366.124012344;

  const fund = {
    id: fundId,
    symbol: data?.symbol || "",
    name: data?.name,
    manager: data?.manager,
    treasury: data?.treasury,
    managerName: "ema1.sol",
    shareClass0: data?.shareClasses[0],
    investmentObjective:
      "The Glam Investment Fund seeks to reflect generally the performance of the price of Bitcoin and Solana.",
    nav: aum/totalShares,
    dailyNavChange: fundPerfChartData[fundPerfChartData.length-2].value,
    // daily: 0.29,
    aum,
    // dailyNetInflows: 13987428,
    // "24HourNetInflowChange": 0.0089,
    // will optimize looping later once we have all the necessary data
    fees: {
      management: fundModel.getManagementFee(),
      performance: fundModel.getPerformanceFee(),
      subscription: 0.0,
      redemption: 0.0
    },
    facts: {
      launchDate: data?.shareClassesMetadata[0].launchDate,
      fundAsset: data?.shareClassesMetadata[0].shareClassAsset,
    },
    terms: {
      highWaterMark: false,
      hurdleRate: false,
      lockupPeriod: "60", // denominated in minutes
      minimumSubscription: 0,
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
          <img src={fundModel.getImageUrl()}
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
            <ExplorerLink
              path={`account/${fund.shareClass0}`}
              label={fund.symbol}
            />
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
                      <p className="text-xl text-black">{formatNumber(fund.nav)}</p>
                    </div>
                    <br />
                    <div className="flex flex-col gap-[12px]">
                      <p>15 Days NAV Change</p>
                      <div className="flex items-center ">
                        <p className="text-xl text-black">
                          {formatPercent(fund.dailyNavChange)}
                        </p>
                        {fund.dailyNavChange > 0 ? (
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
                      <ExplorerLink
                        path={`account/${fund.treasury}/tokens`}
                        label={"Treasury"}
                      />
                    </div>
                    {/*
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
                    */}
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
                          fund={fundModel}
                          primayButtonFunction={() => {}}
                        />
                      </TabPanel>
                      <TabPanel>
                        <SideActionBar
                          type="Subscribe"
                          fund={fundModel}
                          primayButtonFunction={() => {}}
                        />
                      </TabPanel>
                      <TabPanel>
                        <SideActionBar
                          type="Redeem"
                          fund={fundModel}
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
                        <div className="flex justify-between">
                          <p style={grayStyle}>Fund Account</p>
                          <strong>
                            <ExplorerLink
                              path={`account/${fund.id}`}
                              label={ellipsify(fund.id)}
                            />
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <p style={grayStyle}>Manager</p>
                          <strong>
                            <ExplorerLink
                              path={`account/${fund.manager}`}
                              label={fund.managerName}
                            />
                          </strong>
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
