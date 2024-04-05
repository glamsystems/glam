import { Dropdown, TextArea, TextInput } from "@carbon/react";
import {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch
} from "react-hook-form";

import { FormFields } from "./CreateProduct";
import { countryList } from "../data/countryList";
import { tokenList } from "../data/tokenList";

type BasicInformationProps = {
  setValue: UseFormSetValue<FormFields>;
  watch: UseFormWatch<FormFields>;
  getValues: UseFormGetValues<FormFields>;
  register: UseFormRegister<FormFields>;
  errors: FieldErrors<FormFields>;
  errorStyle: React.CSSProperties;
  fundName: string;
};

export const BasicInformation = ({
  setValue,
  watch,
  getValues,
  register,
  errors,
  errorStyle,
  fundName
}: BasicInformationProps) => {
  return (
    <>
      <div className="flex justify-between gap-[125px]">
        <div className="w-full max-w-[400px] gap-2">
          <TextInput
            {...register("fundName")}
            id="fund-name"
            labelText="Fund Name"
            value={fundName}
            placeholder="Global Asset Management Layer Fund"
            helperText="Legal name of the collective investment scheme."
            required
          />
          {errors.fundName && (
            <p style={errorStyle}>{errors.fundName.message}</p>
          )}
        </div>
        <div className="w-full max-w-[200px] gap-2">
          <TextInput
            {...register("fundSymbol")}
            id="fund-symbol"
            labelText="Fund Symbol"
            value={watch("fundSymbol")}
            placeholder="GLAM"
            helperText="Unique alphanumeric code representing the fund."
          />
          {errors.fundSymbol && (
            <p style={errorStyle}>{errors.fundSymbol.message}</p>
          )}
        </div>
        <TextInput
          {...register("openEndedStructure")}
          className="w-full"
          id="fund-structure"
          labelText="Fund Structure"
          value={getValues("openEndedStructure")}
          readOnly
        />
      </div>
      <div className="flex justify-between gap-[125px]">
        <div className="w-full max-w-[400px] mt-2">
          <TextArea
            {...register("investmentObjective")}
            enableCounter
            id="investment-objective"
            invalidText="Text too long."
            labelText="Investment Objective"
            maxCount={100}
            placeholder="The investment objective of the Fund is to seek to provide investment results that correspond generally to the price and yield performance, before fees and expenses, of the Nasdaq Blockchain Economy Index."
            rows={4}
            required
          />
          {errors.investmentObjective && (
            <p style={errorStyle}>{errors.investmentObjective.message}</p>
          )}
        </div>
        <div className="flex flex-col max-w-[200px] w-full gap-[32px]">
          <Dropdown
            {...register("fundAsset")}
            className="w-full"
            id="fund-asset"
            label={getValues("fundAsset")}
            onChange={(e) => {
              setValue("fundAsset", e.selectedItem?.symbol ?? "");
              setValue("fundAssetID", e.selectedItem?.tokenMint ?? "");
            }}
            items={tokenList}
            itemToString={(item) => (item ? item.symbol : "")}
            titleText="Fund Asset"
            helperText="The asset in which the fund is denominated."
          />
          {errors.fundAsset && (
            <p style={errorStyle}>Fund asset cannot be empty</p>
          )}
        </div>
        <div className="flex flex-col w-full h-full justify-between gap-[50px]">
          <Dropdown
            {...register("countryAlpha2")}
            className="w-full"
            id="country"
            label={getValues("countryAlpha2")}
            selectedItem={countryList.find(
              (item) => item.code_alpha_2 === getValues("countryAlpha2")
            )}
            items={countryList}
            onChange={(e) => {
              setValue("countryAlpha2", e.selectedItem?.code_alpha_2 ?? "");
              setValue("countryAlpha3", e.selectedItem?.code_alpha_3 ?? "");
            }}
            itemToString={(item) => item?.name ?? ""}
            titleText="Country"
            helperText="Domicile of the fund."
          />
          {errors.countryAlpha2 && (
            <p style={errorStyle}>Country cannot be empty.</p>
          )}
        </div>
      </div>
    </>
  );
};
