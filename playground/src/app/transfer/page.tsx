"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetInput } from "@/components/AssetInput";
import { Button } from "@/components/ui/button";
import { ColumnSpacingIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import PageContentWrapper from "@/components/PageContentWrapper";

const transferSchema = z.object({
  origin: z.enum(["Treasury"]),
  destination: z.enum(["Drift"]),
  amount: z.number(),
  amountAsset: z.string(),
});

type TransferSchema = z.infer<typeof transferSchema>;

export default function Transfer() {
  const [amountAsset, setAmountAsset] = useState<string>("SOL");

  const form = useForm<TransferSchema>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      origin: "Treasury",
      destination: "Drift",
      amount: 0,
      amountAsset: "SOL",
    },
  });

  const onSubmit: SubmitHandler<TransferSchema> = (values, event) => {
    const nativeEvent = event as unknown as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };
    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") === "submit") {
      const updatedValues = {
        ...values,
        amountAsset,
      };

      toast({
        title: "You submitted the following trade:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-zinc-900 p-4">
            <code className="text-white">
              {JSON.stringify(updatedValues, null, 2)}
            </code>
          </pre>
        ),
      });
    }
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    form.reset();
    setAmountAsset("SOL");
  };

  return (<PageContentWrapper>
    <div className="w-4/6 self-center">
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="flex space-x-4">
              <AssetInput
                className="min-w-1/2 w-1/2"
                name="amount"
                label="Amount"
                balance={100}
                selectedAsset={amountAsset}
                onSelectAsset={setAmountAsset}
              />
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (<FormItem className="w-1/2">
                    <FormLabel>From</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Treasury" />
                        </SelectTrigger>
                        <SelectContent>
                          {transferSchema.shape.origin._def.values.map((option) => (<SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (<FormItem className="w-1/2">
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Drift" />
                        </SelectTrigger>
                        <SelectContent>
                          {transferSchema.shape.destination._def.values.map((option) => (<SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}
              />
            </div>

            <div className="flex space-x-4 w-full">
              <Button
                className="w-1/2"
                variant="ghost"
                onClick={(event) => handleClear(event)}
              >
                Clear
              </Button>
              <Button className="w-1/2" type="submit">
                Transfer
              </Button>
            </div>
          </form>
        </Form>
      </FormProvider>
    </div>
  </PageContentWrapper>
);
}
