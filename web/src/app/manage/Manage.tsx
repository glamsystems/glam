import { ClickableTile, Column, Grid } from "@carbon/react";

import { Add } from "@carbon/icons-react";
import { Link } from "react-router-dom";
import { formatNumber } from "../utils/format-number";
import { relative } from "path";
import { useGlamProgram } from "../glam/glam-data-access";
import { useWallet } from "@solana/wallet-adapter-react";

export const Manage = () => {
  // const mockApiData = [
  //   {
  //     id: "CWb949XA3vrdiEp2BFtjr9MbUonHke8CVdTb8Cr7Hctd",
  //     symbol: "RHW",
  //     name: "Renaissance Hackathon Winners",
  //     aum: 75_000,
  //     nav: 175.75,
  //     backgroundImage:
  //       'url("https://api.glam.systems/image/4hDzLKRYr8zAnmXLLsmmazkp3Hg8AvHFSiqUTHFktNoF.png")'
  //   },
  //   {
  //     id: "6ZBb3LRddLtBq6DeNtSaUrMipieaFJgTETgTBoiAGBCC",
  //     symbol: "CAF",
  //     name: "Colosseum Accelerator Fund",
  //     aum: 600_000_000,
  //     nav: 600.0,
  //     backgroundImage:
  //       'url("https://api.glam.systems/image/5NsVEVGdYqNSneWBhogA7yLDB9dYTAEyERnSj6wK68V3.png")'
  //   },
  //   {
  //     id: "6a2Jb6fQoH8TZF1qTawrriMoEiqQf2w6KMyj4pPFA3ju",
  //     symbol: "OMMG",
  //     name: "Orca Market Making Group",
  //     aum: 15_941_890,
  //     nav: 139.72,
  //     backgroundImage:
  //       'url("https://api.glam.systems/image/3qs8hDSDKDAPuQfJrXnv9DDdGm4Ki3E1kTETAQRJR4dJ.png")'
  //   },
  //   {
  //     id: "Asytc9KxdgWVQJAp4KrYzu1B21R7AdQfhXx6bBHHnSm4",
  //     symbol: "PDA",
  //     name: "Pyth DAO Treasury",
  //     aum: 101_118_482,
  //     nav: 182.3,
  //     backgroundImage:
  //       'url("https://api.glam.systems/image/3hTZD8KfhTKY18C64tYAbjvTYQXHtggEXGNrFFTmDbgA.png")'
  //   }
  // ];

  const { accounts } = useGlamProgram();
  const { publicKey } = useWallet();
  let data = (accounts.data || [])
    .filter((d) => d.account.manager.toString() == (publicKey || "").toString())
    .map((d) => {
      const fund = d.account;
      const id = d.publicKey.toString();
      return {
        id,
        // symbol: fund.symbol,
        name: fund.name,
        aum: 0,
        nav: 0,
        backgroundImage: `url("https://api.glam.systems/image/${fund.shareClasses[0]}.png")`,
      };
    });
  // if (!data.length) {
  //   data = mockApiData;
  // }

  // when clicking on a tile, navigate to the relevant product page
  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="ml-[200px] text-[42px]">Manage</h1>

      <Grid
        narrow
        className="w-[80vw] h-full mt-[100px] max-h-[67vh] items-center overflow-y-auto hide-scrollbar"
      >
        {data.map((position) => (
          <Column key={position.id} lg={4} md={4} sm={2} className="my-[6px]">
            <Link to={`/products/${position.id}`}>
              <ClickableTile
                key={position.id}
                id={position.id}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-[32px]">
                  <div className="flex flex-col">
                    <p className="gray">{""}</p>
                    <strong>{position.name}</strong>
                  </div>
                  {(position.aum && (
                    <div className="flex flex-col">
                      <p className="gray">AUM</p>
                      <strong>{formatNumber(position.aum)}</strong>
                    </div>
                  )) ||
                    ""}
                  {(position.nav && (
                    <div className="flex flex-col">
                      <p className="gray">NAV</p>
                      <strong>{formatNumber(position.nav)}</strong>
                    </div>
                  )) ||
                    ""}
                  <div
                    className="w-[32px] h-[32px] md:w-[64px] md:h-[64px]"
                    style={{
                      alignSelf: "end",
                      display: "flex",
                      backgroundImage: position.backgroundImage,
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover",
                      position: "relative",
                      top: "15px",
                      left: "15px",
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
              <div className="flex flex-col" style={{ height: 132 }}>
                <strong>Create Product</strong>
                <div className="flex flex-col items-center">
                  <Add
                    height={100}
                    width={100}
                    color="#00000040"
                    // className="mt-6"
                    style={{ margin: "0 auto", position: "static" }}
                  />
                </div>
                <div
                  className="w-[32px] h-[32px] md:w-[64px] md:h-[64px]"
                  style={{
                    marginTop: -50,
                    alignSelf: "end",
                    display: "flex",
                    position: "relative",
                    top: "15px",
                    left: "15px",
                    backgroundImage:
                      'url("https://api.glam.systems/image/11111111111111111111111111111111.png")',
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
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
