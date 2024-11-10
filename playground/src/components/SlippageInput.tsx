import React, { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface Props {
  name: string;
  label: string;
  symbol: string;
  step?: string;
  className?: string;
  disableSubmitOnEnter?: boolean;
}

const BPS_PER_PERCENT = 100; // 1% = 100 BPS

/**
 * This input component must be used in a `FormProvider` context. The form must have two fields:
 * - `name` for the numeric value
 * - `${name}Unit` for the unit of the value
 *
 * `symbol` is the unit of the input value. It can be either "BPS" or "%".
 */
export const SlippageInput: React.FC<Props> = ({
  name,
  label,
  symbol,
  className,
  disableSubmitOnEnter = true,
}) => {
  const { control, getValues, setValue } = useFormContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSymbolToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const currentValue = getValues()[name] || 0;
    const currentUnit = getValues()[`${name}Unit`] || symbol;

    if (currentUnit === "%") {
      setValue(name, currentValue * BPS_PER_PERCENT);
      setValue(`${name}Unit`, "BPS");
    } else if (currentUnit === "BPS") {
      setValue(name, currentValue / BPS_PER_PERCENT);
      setValue(`${name}Unit`, "%");
    }
  };

  const handleInputChange = (value: string) => {
    // Do nothing on non-numeric or negative values
    if (/^\d*\.?\d*$/.test(value)) {
      const numericValue = parseFloat(value.replace(/,/g, ""));
      if (isNaN(numericValue)) {
        setValue(name, 0);
      } else {
        setValue(name, numericValue);
      }
    }
  };

  // Adjust step based on symbol
  const getStep = () => {
    if (symbol === "BPS") return "5"; // BPS are whole numbers
    if (symbol === "%") return "0.05"; // Standard percentage step
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type="number"
                step={getStep()}
                ref={inputRef}
                value={getValues()[name]}
                className="pr-20"
                placeholder=""
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (disableSubmitOnEnter && e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
              />

              <Button
                variant="secondary"
                className="absolute pr-2 pl-2 h-6 inset-y-0 top-2 right-2 border-l-0"
                onClick={(e) => handleSymbolToggle(e)}
              >
                {symbol}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
