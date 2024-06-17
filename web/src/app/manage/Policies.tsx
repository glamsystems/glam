import { Dropdown, NumberInput, TextInput } from "@carbon/react";
import {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import { FormFields } from "./CreateProduct";

type PolicyProps = {
  setValue: UseFormSetValue<FormFields>;
  register: UseFormRegister<FormFields>;
  getValues: UseFormGetValues<FormFields>;
  errors: FieldErrors<FormFields>;
  errorStyle: React.CSSProperties;
  disabeld: boolean;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Policies = ({
  setValue,
  register,
  getValues,
  errors,
  errorStyle,
  disabeld,
  setDisabled,
}: PolicyProps) => {
  return (
    <div className="flex flex-col gap-[30px]">
      <div className="flex gap-8">
        <div className="w-full max-w-[300px] mt-[6px]">
          <NumberInput
            {...register("lockupPeriod")}
            id="lockup-period"
            label="Lockup Period"
            onChange={(event, { value, direction }) => {
              console.log("Value", value);
              if (value) {
                setValue("lockupPeriod", +value);
                if (+value === 0) {
                  setDisabled(true);
                  return;
                }
                setDisabled(false);
                return;
              }
              if (direction === "up") {
                setValue("lockupPeriod", getValues("lockupPeriod") + 1);
              } else {
                if (value === 0) {
                  setValue("lockupPeriod", 0);
                  setDisabled(true);
                  return;
                }
                setValue("lockupPeriod", getValues("lockupPeriod") - 1);
              }
              setDisabled(false);
            }}
            min={0}
            max={undefined}
            step={1}
            helperText="The period of time during which an investor cannot redeem shares."
          />
          {errors.lockupPeriod && (
            <p style={errorStyle}>{errors.lockupPeriod.message}</p>
          )}
        </div>
        <div className="w-full max-w-[300px]">
          <Dropdown
            {...register("lockupPeriodUnits")}
            id="lockup-period-units"
            label={getValues("lockupPeriodUnits") ?? "days"}
            selectedItem={{
              id: getValues("lockupPeriodUnits"),
              name: getValues("lockupPeriodUnits"),
            }}
            onChange={(e) => {
              setValue(
                "lockupPeriodUnits",
                e.selectedItem?.id ?? ("days" as any)
              );
            }}
            items={[
              { id: "seconds", name: "seconds" },
              { id: "minutes", name: "minutes" },
              { id: "hours", name: "hours" },
              { id: "days", name: "days" },
              { id: "weeks", name: "weeks" },
              { id: "months", name: "months" },
              { id: "quarters", name: "quarters" },
              { id: "years", name: "years" },
            ]}
            itemToString={(item) => item?.name ?? "days"}
            titleText="Lockup Time Units"
            disabled={disabeld}
          />
          {errors.lockupPeriodUnits && (
            <p style={errorStyle}>{errors.lockupPeriodUnits.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        <div className="w-full max-w-[300px]">
          <NumberInput
            {...register("transferFees")}
            id="transfer-fees"
            label="Transfer Fees (%)"
            min={0}
            max={100}
            value={getValues("transferFees") ?? 0}
            onChange={(event, { value, direction }) => {
              console.log("Value", value);
              if (value) {
                setValue("transferFees", +value);
                if (+value === 0) {
                  return;
                }
                return;
              }
              if (direction === "up") {
                setValue("transferFees", getValues("transferFees") + 1);
              } else {
                if (value === 0) {
                  setValue("transferFees", 0);
                  return;
                }
                setValue("transferFees", getValues("transferFees") - 1);
              }
            }}
            step={1}
            helperText="The fee charged for transferring shares."
          />
          {errors.transferFees && (
            <p style={errorStyle}>{errors.transferFees.message}</p>
          )}
        </div>
        <div className="w-full max-w-[300px]">
          <TextInput
            {...register("permanentDelegate")}
            id="permanent-delegate"
            labelText="Permanent Delegate"
            placeholder="Public Key"
            helperText="Public key of the permanent delegate."
          />
          {errors.permanentDelegate && (
            <p style={errorStyle}>{errors.permanentDelegate.message}</p>
          )}
        </div>
      </div>
      <div className="flex gap-8">
        <Dropdown
          {...register("nonTransferable")}
          id="non-transferable"
          className="w-full max-w-[300px]"
          label={getValues("nonTransferable") ? "Yes" : "No"}
          items={[
            { id: true, name: "Yes" },
            { id: false, name: "No" },
          ]}
          onChange={(e) => {
            setValue("nonTransferable", e.selectedItem?.id ?? false);
          }}
          itemToString={(item) => (item?.name === "Yes" ? "Yes" : "No")}
          titleText="Non-Transferable"
          helperText="Whether the shares are non-transferable."
        />
        <div className="w-full max-w-[300px]">
          <Dropdown
            {...register("redemptions")}
            id="redemptions"
            className="w-full max-w-[300px]"
            label={getValues("redemptions")}
            items={[
              { id: "Share Class Asset", name: "Share Class Asset" },
              { id: "In-Kind", name: "In-Kind" },
              { id: "Both", name: "Both" },
            ]}
            onChange={(e) => {
              setValue(
                "redemptions",
                e.selectedItem?.id ?? ("Share Class Asset" as any)
              );
            }}
            itemToString={(item) => item?.name ?? "Share Class Asset"}
            titleText="Redemptions"
            helperText="The method of redemption for the shares."
          />
          {errors.redemptions && (
            <p style={errorStyle}>Redemptions type cannot be empty</p>
          )}
        </div>
      </div>
    </div>
  );
};
