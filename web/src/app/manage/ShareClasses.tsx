import { Dropdown, TextInput } from "@carbon/react";
import {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import { FormFields } from "./CreateProduct";
import { tokenList } from "../data/tokenList";

type ShareClassProps = {
  setValue: UseFormSetValue<FormFields>;
  watch: UseFormWatch<FormFields>;
  getValues: UseFormGetValues<FormFields>;
  register: UseFormRegister<FormFields>;
  errors: FieldErrors<FormFields>;
  errorStyle: React.CSSProperties;
  assets: string[] | undefined;
};

export const ShareClasses = ({
  setValue,
  watch,
  getValues,
  register,
  errors,
  errorStyle,
  assets,
}: ShareClassProps) => {
  return (
    <>
      <div className="flex justify-between gap-[125px]">
        <TextInput
          className="w-full"
          id="full-share-class-name"
          labelText="Full Share Class Name"
          value={`${watch("fundName")} ${watch("extension")} ${watch(
            "shareClassAsset"
          )}`}
          helperText="The full name of the share class, including the fund name, extension, and asset."
          readOnly
        />
        <Dropdown
          {...register("extension")}
          className="max-w-[375px] w-full"
          id="extension"
          label={getValues("extension")}
          onChange={(e) => {
            setValue("extension", e.selectedItem?.id ?? ("A" as any));
            setValue(
              "fullShareClassName",
              `${getValues("fundName")} ${e.selectedItem?.id} ${getValues(
                "shareClassAsset"
              )}`
            );
            setValue(
              "shareClassSymbol",
              `${getValues("fundSymbol")}-${e.selectedItem?.id}-${getValues(
                "shareClassAsset"
              )}`
            );
          }}
          items={[
            { id: "A", name: "A" },
            { id: "B", name: "B" },
            { id: "C", name: "C" },
            { id: "D", name: "D" },
            { id: "E", name: "E" },
            { id: "1", name: "1" },
            { id: "2", name: "2" },
            { id: "3", name: "3" },
            { id: "4", name: "4" },
            { id: "5", name: "5" },
          ]}
          itemToString={(item) => item?.name ?? ""}
          titleText="Extension"
          readOnly
        />
      </div>
      <div className="flex justify-between gap-[125px]">
        <div className="w-full max-w-[400px]">
          <Dropdown
            {...register("shareClassAsset")}
            id="share-class-asset"
            label={getValues("shareClassAsset")}
            onChange={(e) => {
              setValue("shareClassAsset", e.selectedItem?.symbol ?? "");
              setValue("shareClassAssetID", e.selectedItem?.tokenMint ?? "");
              setValue(
                "assets",
                (assets ?? []).concat(e.selectedItem?.tokenMint ?? "")
              );
            }}
            items={tokenList}
            itemToString={(item) => (item ? item.symbol : "")}
            titleText="Share Class Asset"
            helperText="The asset in which the share class is denominated."
          />
          {errors.shareClassAsset && (
            <p style={errorStyle}>Share class asset cannot be empty</p>
          )}
        </div>
        <div className="max-w-[200px] w-full">
          <Dropdown
            {...register("investmentStatus")}
            id="investment-status"
            label={getValues("investmentStatus")}
            onChange={(e) => {
              setValue("investmentStatus", e.selectedItem?.id ?? ("" as any));
            }}
            items={[{ id: "open", name: "open" }]}
            itemToString={(item) => item?.name ?? ""}
            titleText="Investment Status"
            readOnly
          />
          {errors.investmentStatus && (
            <p style={errorStyle}>{errors.investmentStatus.message}</p>
          )}
        </div>
        <Dropdown
          {...register("shareClassLifecycle")}
          className="w-full"
          id="share-class-lifecycle"
          label={getValues("shareClassLifecycle")}
          onChange={(e) => {
            setValue(
              "shareClassLifecycle",
              e.selectedItem?.id ?? ("Projected" as any)
            );
          }}
          items={[
            { id: "Projected", name: "Projected" },
            { id: "To Be Launched", name: "To Be Launched" },
            { id: "Offering Period", name: "Offering Period" },
            { id: "Active", name: "Active" },
          ]}
          itemToString={(item) => item?.name ?? ""}
          titleText="Share Class Lifecycle"
          readOnly
        />
      </div>
      <div className="flex justify-between gap-[125px]">
        <Dropdown
          {...register("policyDistribution")}
          className="max-w-[400px] w-full"
          id="policy-distribution"
          label={getValues("policyDistribution")}
          onChange={(e) => {
            setValue(
              "policyDistribution",
              e.selectedItem?.id ?? ("Accumulating" as any)
            );
          }}
          items={[
            { id: "Accumulating", name: "Accumulating" },
            {
              id: "Accumulating & Distributing",
              name: "Accumulating & Distributing",
            },
            { id: "Distributing", name: "Distributing" },
          ]}
          itemToString={(item) => item?.name ?? ""}
          titleText="Policy Distribution"
          readOnly
        />
        <TextInput
          {...register("managementFee")}
          className="max-w-[200px] w-full"
          id="management-fee
      "
          labelText="Management Fee (%)"
          placeholder="0"
          helperText="Annual fee charged by the fund manager for managing the fund."
          readOnly
        />
        <TextInput
          {...register("performanceFee")}
          className="w-full"
          id="performance-fee"
          labelText="Performance Fee (%)"
          placeholder="0"
          helperText="Fee charged by the fund manager based on the fund's performance."
          readOnly
        />
      </div>
    </>
  );
};
