import { ClickableTile, Column, Grid } from "@carbon/react";

import { Add } from "@carbon/icons-react";
import { Link } from "react-router-dom";
import { formatNumber } from "../utils/format-number";
import { relative } from "path";

export const Manage = () => {
  const mockApiData = [
    {
      id: "IBIT",
      name: "iShares Bitcoin Trust",
      aum: 15941890385,
      nav: 39.72,
      background:
        "conic-gradient(from 57.74deg at 50% 50%, #5B0F48 0deg, rgba(91, 15, 72, 0) 360deg)"
    },
    {
      id: "IETH",
      name: "iShares Ethereum Trust",
      aum: 15941890385,
      nav: 39.72,
      background:
        "conic-gradient(from 57.74deg at 50% 50%, #1D3F93 0deg, rgba(21, 55, 23, 0) 360deg)"
    },
    {
      id: "ISOL",
      name: "iShares Solana Trust",
      aum: 15941890385,
      nav: 39.72,
      background:
        "conic-gradient(from 57.74deg at 50% 50%, #A1D3F1 0deg, rgba(91, 55, 11, 0) 360deg)"
    },
    {
      id: "IBNK",
      name: "iShares Bonk Trust",
      aum: 15941890385,
      nav: 39.72,
      background:
        "conic-gradient(from 57.74deg at 50% 50%, #BBDD33 0deg, rgba(91, 55, 11, 0) 360deg)"
    }
    // {
    //   id: 'IETH',
    //   name: 'iShares Ethereum Trust',
    //   aum: 15941890385,
    //   nav: 39.72,
    //   background:
    //     'conic-gradient(from 57.74deg at 50% 50%, #1D3F93 0deg, rgba(21, 55, 23, 0) 360deg)',
    // },
    // {
    //   id: 'ISOL',
    //   name: 'iShares Solana Trust',
    //   aum: 15941890385,
    //   nav: 39.72,
    //   background:
    //     'conic-gradient(from 57.74deg at 50% 50%, #A1D3F1 0deg, rgba(91, 55, 11, 0) 360deg)',
    // },
    // {
    //   id: 'IBNK',
    //   name: 'iShares Bonk Trust',
    //   aum: 15941890385,
    //   nav: 39.72,
    //   background:
    //     'conic-gradient(from 57.74deg at 50% 50%, #BBDD33 0deg, rgba(91, 55, 11, 0) 360deg)',
    // },
    // {
    //   id: 'IETH',
    //   name: 'iShares Ethereum Trust',
    //   aum: 15941890385,
    //   nav: 39.72,
    //   background:
    //     'conic-gradient(from 57.74deg at 50% 50%, #1D3F93 0deg, rgba(21, 55, 23, 0) 360deg)',
    // },
    // {
    //   id: 'ISOL',
    //   name: 'iShares Solana Trust',
    //   aum: 15941890385,
    //   nav: 39.72,
    //   background:
    //     'conic-gradient(from 57.74deg at 50% 50%, #A1D3F1 0deg, rgba(91, 55, 11, 0) 360deg)',
    // },
    // {
    //   id: 'IBNK',
    //   name: 'iShares Bonk Trust',
    //   aum: 15941890385,
    //   nav: 39.72,
    //   background:
    //     'conic-gradient(from 57.74deg at 50% 50%, #BBDD33 0deg, rgba(91, 55, 11, 0) 360deg)',
    // },
  ];

  // when clicking on a tile, navigate to the relevant product page
  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="mt-[100px] ml-[200px] text-[42px]">Manage</h1>

      <Grid
        narrow
        className=" h-full mt-[100px] max-h-[67vh] items-center overflow-y-auto hide-scrollbar"
      >
        {mockApiData.map((position) => (
          <Column key={position.id} lg={4} md={4} sm={2} className="my-[6px]">
            <Link to={`/products/${position.id}`}>
              <ClickableTile
                key={position.id}
                id={position.id}
                className="cursor-pointer"
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
                    className="w-[32px] h-[32px] md:w-[64px] md:h-[64px]"
                    style={{
                      alignSelf: "end",
                      display: "flex",
                      background: position.background,
                      position: "relative",
                      top: "15px",
                      left: "15px"
                    }}
                  ></div>
                </div>
              </ClickableTile>
            </Link>
          </Column>
        ))}
        <Column lg={4} md={4} sm={2} className="my-[6px]">
          <Link to="/create-product">
            <ClickableTile
              id="create-product"
              className="cursor-pointer"
              style={{}}
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
                  className="w-[32px] h-[32px] md:w-[64px] md:h-[64px]"
                  style={{
                    alignSelf: "end",
                    display: "flex",
                    position: "relative",
                    top: "15px",
                    left: "15px",
                    background:
                      "conic-gradient(from 90deg at 50% 50%, #141414 0deg, rgba(20, 20, 20, 0) 360deg)"
                  }}
                ></div>
              </div>
            </ClickableTile>
          </Link>
        </Column>
      </Grid>
    </div>
  );
};

export default Manage;
