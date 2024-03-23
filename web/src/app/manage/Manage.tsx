import {
  ClickableTile,
  Column,
  Grid,
  SelectableTile,
  Tile,
} from '@carbon/react';

import { Add } from '@carbon/icons-react';
import { formatNumber } from '../utils/format-number';
import { relative } from 'path';

export const Manage = () => {
  const mockApiData = [
    {
      id: 'IBIT',
      name: 'iShares Bitcoin Trust',
      aum: 15941890385,
      nav: 39.72,
      background:
        'conic-gradient(from 57.74deg at 50% 50%, #5B0F48 0deg, rgba(91, 15, 72, 0) 360deg)',
    },
    {
      id: 'IETH',
      name: 'iShares Ethereum Trust',
      aum: 15941890385,
      nav: 39.72,
      background:
        'conic-gradient(from 57.74deg at 50% 50%, #1D3F93 0deg, rgba(21, 55, 23, 0) 360deg)',
    },
    {
      id: 'ISOL',
      name: 'iShares Solana Trust',
      aum: 15941890385,
      nav: 39.72,
      background:
        'conic-gradient(from 57.74deg at 50% 50%, #A1D3F1 0deg, rgba(91, 55, 11, 0) 360deg)',
    },
    {
      id: 'IBNK',
      name: 'iShares Bonk Trust',
      aum: 15941890385,
      nav: 39.72,
      background:
        'conic-gradient(from 57.74deg at 50% 50%, #BBDD33 0deg, rgba(91, 55, 11, 0) 360deg)',
    },
  ];

  return (
    <div>
      <div className="flex max-w-[500px] w-full ml-[25px]">
        <h1 className="mt-[48px] text-[42px]">Manage</h1>
      </div>

      <Grid
        narrow
        className="w-full h-full max-h-[70vh] overflow-y-auto hide-scrollbar"
      >
        {mockApiData.map((position) => (
          <Column
            key={position.id}
            lg={4}
            md={4}
            sm={2}
            className="mx-[4px] my-[4px]"
          >
            <ClickableTile
              key={position.id}
              id={position.id}
              className="cursor-pointer"
              style={{
                height: '290px',
                width: '290px',
              }}
            >
              <div className="flex flex-col gap-[32px]">
                <div className="flex flex-col">
                  <p className="gray">{position.id}</p>
                  <strong>{position.name}</strong>
                </div>
                <div className="flex flex-col">
                  <p className="gray">AUM</p>
                  <strong>{formatNumber(position.aum)}</strong>
                </div>
                <div className="flex flex-col">
                  <p className="gray">NAV</p>
                  <strong>{formatNumber(position.nav)}</strong>
                </div>
                <div
                  style={{
                    width: '64px',
                    alignSelf: 'end',
                    display: 'flex',
                    height: '64px',
                    background: position.background,
                    position: 'relative',
                    top: '5px',
                    left: '15px',
                  }}
                ></div>
              </div>
            </ClickableTile>
          </Column>
        ))}
        <Column lg={4} md={4} sm={2} className="ml-1 mt-1">
          <ClickableTile
            id="create-product"
            href="/create-product"
            className="cursor-pointer"
            style={{
              height: '290px',
              width: '290px',
            }}
          >
            <div className="flex flex-col gap-[32px]">
              <p className="gray">Create Product</p>
              <div className="flex flex-col items-center">
                <Add
                  height={100}
                  width={100}
                  color="#00000040"
                  className="mt-6"
                />
              </div>
              <div
                style={{
                  width: '64px',
                  alignSelf: 'end',
                  display: 'flex',
                  position: 'relative',
                  top: '4px',
                  left: '15px',
                  height: '64px',
                  background:
                    'conic-gradient(from 90deg at 50% 50%, #141414 0deg, rgba(20, 20, 20, 0) 360deg)',
                }}
              ></div>
            </div>
          </ClickableTile>
        </Column>
      </Grid>
    </div>
  );
};

export default Manage;
