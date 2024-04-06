import { ClickableTile, Column, Grid } from "@carbon/react";

import { Add } from "@carbon/icons-react";
import { Link } from "react-router-dom";
import { formatNumber } from "../utils/format-number";
import { relative } from "path";

/*
GLAMsYF1Uo1LG855FVGHS853FyJ4aYkWf6B4E1sVzprc
GLaMc99QpnP1VKNwwFjNgUk4vhrGKu2JanCKzYRmKAgY
GLam9tx5LoYZHWEb2kKz3GqJW8TJJ4Vd2Q5vp1T2vo1c


2X24TzxetDQcKob24wTEBq7gk7Q2KsfWQCvSyf1EfbhD
*/

export const Manage = () => {
  const mockApiData = [
    {
      id: "AdXkDnJpFKqZeoUygLvm5dp2b5JGVPz3rEWfGCtB5Kc2",
      symbol: "iBTC",
      name: "iShares Bitcoin Trust",
      aum: 15941890385,
      nav: 39.72,
      backgroundImage:
        'url("https://api.glam.systems/image/EMAbk6kYhQbvtpqWyfvDPVJBvD5isMZvQT5aM4TyCAeG.png")'
    },
    {
      id: "AdXkDnJpFKqZeoUygLvm5dp2b5JGVPz3rEWfGCtB5Kc2",
      symbol: "iETH",
      name: "iShares Ethereum Trust",
      aum: 15941890385,
      nav: 39.72,
      backgroundImage:
        'url("https://api.glam.systems/image/yurUzfjdrUH2ujsWwQkFsv8eQJiJwgbHQFUZtf5yqoV.png")'
    },
    {
      id: "AdXkDnJpFKqZeoUygLvm5dp2b5JGVPz3rEWfGCtB5Kc2",
      symbol: "iSOL",
      name: "iShares Solana Trust",
      aum: 15941890385,
      nav: 39.72,
      backgroundImage:
        'url("https://api.glam.systems/image/GLaMc99QpnP1VKNwwFjNgUk4vhrGKu2JanCKzYRmKAgY.png")'
    },
    {
      id: "AdXkDnJpFKqZeoUygLvm5dp2b5JGVPz3rEWfGCtB5Kc2",
      symbol: "iBONK",
      name: "iShares Bonk Trust",
      aum: 15941890385,
      nav: 39.72,
      backgroundImage:
        'url("https://api.glam.systems/image/GLam9tx5LoYZHWEb2kKz3GqJW8TJJ4Vd2Q5vp1T2vo1c.png")'
    }
  ];

  // when clicking on a tile, navigate to the relevant product page
  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="mt-[100px] ml-[200px] text-[42px]">Manage</h1>

      <Grid
        narrow
        className="w-[80vw] h-full mt-[100px] max-h-[67vh] items-center overflow-y-auto hide-scrollbar"
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
                    <p className="gray">{position.symbol}</p>
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
                      backgroundImage: position.backgroundImage,
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover",
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
                    backgroundImage:
                      'url("https://api.glam.systems/image/11111111111111111111111111111111.png")',
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover"
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
