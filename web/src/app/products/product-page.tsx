import '@carbon/charts-react/styles.css';

import { Column, FlexGrid, Grid, Row, Tag, Tile } from '@carbon/react';
import { IconArrowDownRight, IconArrowUpRight } from '@tabler/icons-react';
import { LineChart, ScaleTypes } from '@carbon/charts-react';
import { formatNumber, formatPercent } from '../utils/format-number';

import { gray70Hover } from '@carbon/colors';

export default function ProductPage() {
  const grayStyle = {
    color: gray70Hover,
    fontSize: '14px',
    lineHeight: '18px',
  };

  const mockApiData = {
    id: 'IBIT',
    name: 'iShares Bitcoin Trust',
    investmentObjective:
      'The iShares Bitcoin Trust seeks to reflect generally the performance of the price of bitcoin.',
    nav: 39.72,
    dailyNavChange: 0.12,
    '24HourNavChange': 0.0029,
    daily: 0.29,
    aum: 15941890385,
    dailyNetInflows: 139874284,
    '24HourNetInflowChange': 0.0089,
    fees: {
      management: 0.01,
      performance: 0.1,
      subscription: 0.0,
      redemption: 0.0,
    },
    facts: {
      inceptionDate: '2021-10-15',
      shareClassAsset: 'USDC',
    },
    terms: {
      highWaterMark: false,
      hurdleRate: false,
      lockupPeriod: '60', // denominated in minutes
      minimumSubscription: 1,
      maximumSubscription: 10000,
    },
  };

  const chartData = {
    data: [
      {
        group: 'Dataset 2',
        date: '2019-01-01T23:00:00.000Z',
        value: 0,
        surplus: 17255.932138665936,
      },
      {
        group: 'Dataset 2',
        date: '2019-01-05T23:00:00.000Z',
        value: 57312,
        surplus: 291763818.4413581,
      },
      {
        group: 'Dataset 2',
        date: '2019-01-07T23:00:00.000Z',
        value: 27432,
        surplus: 457548830.72550297,
      },
      {
        group: 'Dataset 2',
        date: '2019-01-14T23:00:00.000Z',
        value: 70323,
        surplus: 280347099.3874301,
      },
      {
        group: 'Dataset 2',
        date: '2019-01-18T23:00:00.000Z',
        value: 21300,
        surplus: 278114597.9106252,
      },
      {
        group: 'Dataset 4',
        date: '2019-01-01T23:00:00.000Z',
        value: 20000,
        surplus: 126288547.22020511,
      },
      {
        group: 'Dataset 4',
        date: '2019-01-05T23:00:00.000Z',
        value: 37312,
        surplus: 860489943.1729329,
      },
      {
        group: 'Dataset 4',
        date: '2019-01-07T23:00:00.000Z',
        value: 51432,
        surplus: 42770848.79525397,
      },
      {
        group: 'Dataset 4',
        date: '2019-01-14T23:00:00.000Z',
        value: 25332,
        surplus: 463373976.2648476,
      },
      {
        group: 'Dataset 4',
        date: '2019-01-18T23:00:00.000Z',
        value: null,
        surplus: 24611.575340218762,
      },
    ],
    options: {
      title: 'Performance',
      axes: {
        bottom: {
          mapsTo: 'date',
          scaleType: ScaleTypes.TIME,
        },
        left: {
          mapsTo: 'value',
          scaleType: ScaleTypes.LINEAR,
        },
      },
      curve: 'curveMonotoneX',
      height: '400px',
      legend: {
        enabled: false,
      },
      toolbar: {
        enabled: false,
      },
    },
  };

  return (
    <div>
      <div className="flex mt-[20px] ml-[40px] mb-[32px]">
        <p>Products </p>
        <p>{` / ${mockApiData.name}`}</p>
      </div>

      <div className="flex ml-[40px] items-center gap-[16px] mb-[32px]">
        <div
          style={{
            width: '64px',
            height: '64px',
            background:
              'conic-gradient(from 57.74deg at 50% 50%, #5B0F48 0deg, rgba(91, 15, 72, 0) 360deg)',
          }}
        ></div>
        <h1
          style={{
            fontSize: '32px',
            lineHeight: '40px',
          }}
        >
          {mockApiData.name}
        </h1>
        <Tag type="warm-gray" className="rounded-none">
          {mockApiData.id}
        </Tag>
      </div>

      <Grid narrow>
        <Column lg={4} md={2} sm={1} className="max-h-[180px] h-full">
          <Tile className="h-full">
            <p className="">Investment Objective</p>
            <br />
            <p>{mockApiData.investmentObjective}</p>
          </Tile>
        </Column>
        <Column lg={4} md={2} sm={1} className="max-h-[180px] h-full">
          <Tile className="h-full">
            <div className="flex flex-col gap-[12px]">
              <p>NAV</p>
              <p className="text-xl text-black">{mockApiData.nav}</p>
            </div>
            <br />
            <div className="flex flex-col gap-[12px]">
              <p>1 Day NAV Change</p>
              <div className="flex items-center ">
                <p className="text-xl text-black">
                  {mockApiData.dailyNavChange} (
                  {formatPercent(mockApiData['24HourNavChange'])})
                </p>
                {mockApiData['24HourNavChange'] > 0 ? (
                  <IconArrowUpRight size={24} color="#4FC879" />
                ) : (
                  <IconArrowDownRight size={24} color="#FF5F5F" />
                )}
              </div>
            </div>
          </Tile>
        </Column>
        <Column lg={4} md={2} sm={1} className="max-h-[180px] h-full">
          <Tile className="h-full">
            <div className="flex flex-col gap-[12px]">
              <p>AUM</p>
              <p className="text-xl text-black">
                {formatNumber(mockApiData.aum)}
              </p>
            </div>
            <br />
            <div className="flex flex-col gap-[12px]">
              <p>1 Day Net Flows</p>
              <div className="flex items-center">
                <p className="text-xl text-black">
                  {formatNumber(mockApiData.dailyNetInflows)} (
                  {formatPercent(mockApiData['24HourNetInflowChange'])})
                </p>
                {mockApiData['24HourNetInflowChange'] > 0 ? (
                  <IconArrowUpRight size={24} color="#4FC879" />
                ) : (
                  <IconArrowDownRight size={24} color="#FF5F5F" />
                )}
              </div>
            </div>
          </Tile>
        </Column>
        <Column lg={4} md={2} sm={1} className="max-h-[180px] h-full">
          <Tile className="h-full">
            <div className="flex flex-col gap-[32px]">
              <p>Fees</p>
              <div className="flex flex-col gap-[8px]">
                <div className="flex justify-between">
                  <p style={grayStyle}>Management Fee</p>
                  <strong>{formatPercent(mockApiData.fees.management)}</strong>
                </div>
                <div className="flex justify-between">
                  <p style={grayStyle}>Performance Fee</p>
                  <strong>{formatPercent(mockApiData.fees.performance)}</strong>
                </div>
                <div className="flex justify-between">
                  <p style={grayStyle}>Subscription Fee</p>
                  <strong>
                    {formatPercent(mockApiData.fees.subscription)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <p style={grayStyle}>Redemption Fee</p>
                  <strong>{formatPercent(mockApiData.fees.redemption)}</strong>
                </div>
              </div>
            </div>
          </Tile>
        </Column>
        <Column lg={12} md={6} sm={4} className="mt-2">
          <Tile>
            <LineChart data={chartData.data} options={chartData.options} />
          </Tile>
        </Column>
        <Column lg={4} md={2} sm={1}>
          <Tile className="mt-2">
            <div className="flex flex-col gap-[32px]">
              <p>Facts</p>
              <div className="flex flex-col gap-[14px]">
                <div className="flex justify-between">
                  <p style={grayStyle}>Share Class Asset</p>
                  <strong>{mockApiData.facts.shareClassAsset}</strong>
                </div>
                <div className="flex justify-between">
                  <p style={grayStyle}>Inception Date</p>
                  <strong>{mockApiData.facts.inceptionDate}</strong>
                </div>
              </div>
            </div>
          </Tile>
          <Tile className="h-full max-h-[297px]">
            <div className="flex flex-col gap-[32px]">
              <p className="mt-4">Terms</p>
              <div className="flex flex-col gap-[14px]">
                <div className="flex justify-between">
                  <p style={grayStyle}>High-Water Mark</p>
                  <strong>
                    {mockApiData.terms.highWaterMark ? 'Yes' : 'No'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <p style={grayStyle}>Hurdle Rate</p>
                  <strong>{mockApiData.terms.hurdleRate ? 'Yes' : 'No'}</strong>
                </div>
                <div className="flex justify-between">
                  <p style={grayStyle}>Lockup Period</p>
                  <strong>{`${+mockApiData.terms.lockupPeriod / 60} hour${
                    +mockApiData.terms.lockupPeriod / 60 > 1 ? 's' : ''
                  }`}</strong>
                </div>
                <div className="flex justify-between">
                  <p style={grayStyle}>Minimum Subscription</p>
                  <strong>
                    {formatNumber(mockApiData.terms.minimumSubscription)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <p style={grayStyle}>Maximum Subscription</p>
                  <strong>
                    {formatNumber(mockApiData.terms.maximumSubscription)}
                  </strong>
                </div>
              </div>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
