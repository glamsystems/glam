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
  disableInput?: boolean;
  disableSubmitOnEnter?: boolean;
}

const LAMPORTS_PER_SOL = 1_000_000_000; // 1 billion

/**
 * This input component must be used in a `FormProvider` context. The form must have two fields:
 * - `name`: form field name for the input
 * - `${name}Unit`: for the unit of the input value
 *
 * `symbol` is the unit of the input value. It can be either "LMPS" or "SOL".
 */
export const PriorityFeeInput: React.FC<Props> = ({
  name,
  label,
  symbol,
  className,
  disableInput = false,
  disableSubmitOnEnter = true,
}) => {
  const { control, getValues, setValue } = useFormContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSymbolToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const currentValue = getValues()[name] || 0;
    if (symbol === "SOL") {
      setValue(name, currentValue * LAMPORTS_PER_SOL);
      setValue(`${name}Unit`, "LMPS");
    } else if (symbol === "LMPS") {
      setValue(name, currentValue / LAMPORTS_PER_SOL);
      setValue(`${name}Unit`, "SOL");
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
    if (symbol === "LMPS") return "1000"; // Lamports are whole numbers
    if (symbol === "SOL") return "0.000001"; // 1000 Lamport in SOL
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
                disabled={disableInput}
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
