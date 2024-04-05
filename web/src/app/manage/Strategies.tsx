import {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch
} from "react-hook-form";
import { SelectableTile, TextInput, Tile } from "@carbon/react";

import { FormFields } from "./CreateProduct";
import backpackLogo from "../../assets/backpack.svg";
import driftLogo from "../../assets/drift.svg";
import jupiterLogo from "../../assets/jupyter.svg";
import orcaLogo from "../../assets/orca.svg";

type StrategyProps = {
  getValues: UseFormGetValues<FormFields>;
  setValue: UseFormSetValue<FormFields>;
  register: UseFormRegister<FormFields>;
  watch: UseFormWatch<FormFields>;
  errors: FieldErrors<FormFields>;
  strategies: { id: string; name: string }[];
  errorStyle: React.CSSProperties;
};

export const Strategies = ({
  getValues,
  setValue,
  register,
  watch,
  errors,
  strategies,
  errorStyle
}: StrategyProps) => {
  return (
    <div className="flex gap-[90px]">
      <div className="flex flex-col gap-2 w-full max-w-[200px]">
        {strategies.map((strategy) => (
          <SelectableTile
            id={strategy.id}
            key={strategy.id}
            value={strategy.id}
            disabled={strategy.id !== "Drift"}
            selected={getValues("counterParties")?.includes(strategy.id)}
            onClick={() => {
              // if already selected, remove it
              if (getValues("counterParties")?.includes(strategy.id)) {
                setValue(
                  "counterParties",
                  getValues("counterParties")?.filter(
                    (id) => id !== strategy.id
                  )
                );
                return;
              }
              setValue("counterParties", [strategy.id]);
            }}
          >
            {strategy.id === "Drift" ? (
              <img src={driftLogo} alt="Drift Logo" />
            ) : strategy.id === "Backpack" ? (
              <>
                <img src={backpackLogo} alt="Backpack Logo" />
                <p>Coming Soon...</p>
              </>
            ) : strategy.id === "Jupiter" ? (
              <>
                <img src={jupiterLogo} alt="Jupiter Logo" />
                <p>Coming Soon...</p>
              </>
            ) : (
              <>
                <img src={orcaLogo} alt="Orca Logo" />
                <p>Coming Soon...</p>
              </>
            )}
          </SelectableTile>
        ))}
      </div>
      {/* if drift is selected, show this tile */}
      {watch("counterParties")?.includes("Drift") && (
        <Tile className="w-full h-full">
          <div>
            <TextInput
              {...register("traderIdDrift")}
              className="w-full"
              id="trader-id-drift"
              labelText="Trader ID (Optional)"
              placeholder="Public Key"
              helperText="Public key of the trader."
            />
            {errors.traderIdDrift && (
              <p style={errorStyle}>{errors.traderIdDrift.message}</p>
            )}
          </div>
        </Tile>
      )}
    </div>
  );
};
