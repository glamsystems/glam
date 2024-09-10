import React from 'react';
import { useController, Control } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import CustomSlider from './CustomSlider';  // Assuming CustomSlider is in the same directory

interface LeverageInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export function LeverageInput({
                                name,
                                control,
                                label,
                                description,
                                min = 0,
                                max = 100,
                                step = 1,
                                defaultValue = 0,
                              }: LeverageInputProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue,
  });

  return (
    <FormItem className="w-full -mt-[15px]">
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl className="w-full">
        <CustomSlider
          min={min}
          max={max}
          step={step}
          defaultValue={field.value}
          {...field}
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage>{error?.message}</FormMessage>
    </FormItem>
  );
}

export default LeverageInput;
