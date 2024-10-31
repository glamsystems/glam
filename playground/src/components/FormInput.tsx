import React, { useRef, useState } from "react";
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
}

const LAMPORTS_PER_SOL = 1_000_000_000; // 1 billion
const BPS_PER_PERCENT = 100; // 1% = 100 BPS

export const FormInput: React.FC<Props> = ({
  name,
  label,
  symbol,
  step = "0.05",
  className,
}) => {
  const { control, getValues, setValue } = useFormContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);

  const isConvertible =
    symbol === "SOL" || symbol === "LMPS" || symbol === "%" || symbol === "BPS";

  const handleSymbolToggle = () => {
    const currentValue = getValues()[name] || 0;

    if (currentSymbol === "SOL") {
      setCurrentSymbol("LMPS");
      setValue(name, currentValue * LAMPORTS_PER_SOL);
    } else if (currentSymbol === "LMPS") {
      setCurrentSymbol("SOL");
      setValue(name, currentValue / LAMPORTS_PER_SOL);
    } else if (currentSymbol === "%") {
      setCurrentSymbol("BPS");
      setValue(name, currentValue * BPS_PER_PERCENT);
    } else if (currentSymbol === "BPS") {
      setCurrentSymbol("%");
      setValue(name, currentValue / BPS_PER_PERCENT);
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
    if (currentSymbol === "LMPS") return "1"; // Lamports are whole numbers
    if (currentSymbol === "BPS") return "1"; // BPS are whole numbers
    if (currentSymbol === "SOL") return "0.000000001"; // 1 Lamport in SOL
    if (currentSymbol === "%") return "0.01"; // Standard percentage step
    return step;
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
              />

              <Button
                variant="secondary"
                className="absolute pr-2 pl-2 h-6 inset-y-0 top-2 right-2 border-l-0"
                disabled={!isConvertible}
                onClick={handleSymbolToggle}
              >
                {currentSymbol}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
