import React, { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  name: string;
  label: string;
  type: string;
  disableInput?: boolean;
  placeholder?: string;
  className?: string;
  unit?: string;
}

export const FormInput: React.FC<Props> = ({
  name,
  label,
  type,
  disableInput = false,
  placeholder,
  className,
  unit,
}) => {
  const { control, getValues, setValue } = useFormContext();
  const inputRef = useRef<HTMLInputElement>(null);

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
                type={type}
                ref={inputRef}
                value={getValues()[name]}
                className="pr-20"
                placeholder={placeholder}
                disabled={disableInput}
                onChange={(e) => {
                  field.onChange(e);
                  if (type === "number") {
                    setValue(name, Number(e.target.value));
                  }
                }}
              />

              {unit && (
                <Button
                  variant="secondary"
                  className="absolute pr-2 pl-2 h-6 inset-y-0 top-2 right-2 border-l-0"
                >
                  {unit}
                </Button>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
