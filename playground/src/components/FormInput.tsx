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
}

export const FormInput: React.FC<Props> = ({
  name,
  label,
  symbol,
  step = 0.05,
  className,
}) => {
  const { control, getValues, setValue } = useFormContext();
  const inputRef = useRef<HTMLInputElement>(null);

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
                step={step}
                ref={inputRef}
                value={getValues()[name]}
                className="pr-20"
                placeholder=""
                onChange={(e) => handleInputChange(e.target.value)}
              />

              <Button
                variant="secondary"
                className="absolute pr-2 pl-2 h-6 inset-y-0 top-2 right-2 border-l-0"
                disabled
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
