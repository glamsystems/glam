import React, { useEffect, useState } from "react";
import { Control, useController } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CustomSlider from "./CustomSlider";

interface LeverageInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function LeverageInput({
  name,
  control,
  label,
  description,
  min = 0,
  max = 100,
  step = 1,
}: LeverageInputProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const [sliderValue, setSliderValue] = useState(field.value);

  useEffect(() => {
    console.log(`LeverageInput: field.value changed to ${field.value}`);
    setSliderValue(field.value);
  }, [field.value]);

  useEffect(() => {
    console.log(`LeverageInput: sliderValue changed to ${sliderValue}`);
    const timeoutId = setTimeout(() => {
      if (sliderValue !== field.value) {
        console.log(`LeverageInput: Updating form value to ${sliderValue}`);
        field.onChange(sliderValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [sliderValue, field]);

  const handleSliderChange = (newValue: number) => {
    console.log(`LeverageInput: CustomSlider value changed to ${newValue}`);
    setSliderValue(newValue);
  };

  const handleValueChange = (newValue: number) => {
    field.onChange(newValue);
  };

  return (
    <FormItem className="w-full -mt-[15px]">
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl className="w-full">
        <CustomSlider
          min={min}
          max={max}
          step={step}
          value={field.value}
          onValueChange={handleValueChange}
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage>{error?.message}</FormMessage>
    </FormItem>
  );
}

export default LeverageInput;
