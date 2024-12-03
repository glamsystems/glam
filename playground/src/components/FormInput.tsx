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

interface Props {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  className?: string;
}

export const FormInput: React.FC<Props> = ({
  name,
  label,
  type,
  placeholder,
  className,
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
                onChange={(e) => {
                  field.onChange(e);
                  if (type === "number") {
                    setValue(name, Number(e.target.value));
                  }
                }}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
