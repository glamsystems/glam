import { UseFormSetValue, UseFormWatch } from "react-hook-form";

import { FormFields } from "./CreateProduct";
import { SelectableTile } from "@carbon/react";
import { tokenList } from "../data/tokenList";

type AssetProps = {
  setValue: UseFormSetValue<FormFields>;
  watch: UseFormWatch<FormFields>;
  assets: string[] | undefined;
};

export const Assets = ({ setValue, watch, assets }: AssetProps) => {
  return (
    <>
      <h1 className="lg:text-[22px]">
        Select assets that can be deposited in the fund
      </h1>
      <div className="flex flex-wrap gap-2 ">
        {tokenList.map((token) => (
          <SelectableTile
            className="max-w-[40px] max-h-[40px] lg:max-w-[170px] lg:max-h-[80px] w-full h-full"
            style={{
              // if not selected, white background
              backgroundColor:
                assets?.includes(token.tokenMint) ||
                watch("fundAsset") === token.symbol
                  ? "#e5e7eb"
                  : "#FFFFFF"
            }}
            id={token.symbol}
            key={token.tokenMint}
            value={token.symbol}
            disabled={token.symbol === watch("fundAsset")}
            selected={
              token.symbol === watch("fundAsset") ||
              assets?.includes(token.tokenMint)
            }
            onClick={() => {
              // if already selected, remove it
              if (assets?.includes(token.tokenMint)) {
                setValue(
                  "assets",
                  assets?.filter((asset) => asset !== token.tokenMint)
                );
                return;
              } else {
                setValue("assets", (assets ?? []).concat(token.tokenMint));
              }
            }}
          >
            <div className="flex items-center gap-2 justify-center h-full">
              <img
                src={token.imgURL}
                className="h-[10px] w-[10px] lg:h-[30px] lg:w-[30px] rounded-full"
                alt="Token Logo"
              />
              <p className="lg:text-[22px] font-bold">{token.symbol}</p>
            </div>
          </SelectableTile>
        ))}
      </div>
    </>
  );
};
