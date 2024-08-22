"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { AssetInput } from "@/components/AssetInput";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import React, { useState, useEffect } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";

const flowSchema = z.object({
  product: z.enum(["GLAM Managed SOL"]),
  category: z.enum(["shares", "amount"]),
  method: z.enum(["share class currency", "in-kind"]),
  amountIn: z.number().nonnegative(),
  amountInAsset: z.string(),
});

type FlowSchema = z.infer<typeof flowSchema>;

const productToAssetMap: { [key in FlowSchema["product"]]: string } = {
  'GLAM Managed SOL': "gmSOL",
};

export type assetBalancesMap = {
  [key: string]: number;
};

export default function Flows() {
  const [direction, setDirection] = useState<string>("subscribe");

  const [amountInAsset, setAmountInAsset] = useState<string>(
    direction === "redeem" ? productToAssetMap["GLAM Managed SOL"] : "SOL"
  );
  const [balance, setBalance] = useState<number>(NaN);
  const [assetBalances, setAssetBalances] = useState<assetBalancesMap>({});

  const defaultValues = {
    subscribe: {
      category: "amount" as "amount", method: "share class currency" as "share class currency",
    }, redeem: {
      category: "shares" as "shares", method: "share class currency" as "share class currency",
    },
  };

  const form = useForm<FlowSchema>({
    resolver: zodResolver(flowSchema), defaultValues: {
      product: "GLAM Managed SOL", amountIn: 0, amountInAsset: "SOL", ...defaultValues.subscribe,
    },
  });

  useEffect(() => {
    // Assuming some async call to fetch assetBalances and set the state
    // setAssetBalances(fetchBalances());
  }, []);

  const onSubmit: SubmitHandler<FlowSchema> = async (values: FlowSchema, event) => {
    const nativeEvent = event as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };

    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") !== "submit") {
      return;
    }

    if (values.amountIn === 0) {
      toast({
        title: "Please enter an amount greater than 0.", variant: "destructive",
      });
      return;
    }
    // Handle form submission here
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    form.reset();
    setAmountInAsset("SOL");
    setDirection("subscribe");
    form.reset({ ...defaultValues.subscribe });
  };

  const handleModeChange = (value: string) => {
    if (!value) return;

    setDirection(value);

    if (value === "subscribe") {
      form.reset({ ...defaultValues.subscribe });
      setAmountInAsset("SOL");  // Ensure SOL is set when subscribing
    } else if (value === "redeem") {
      form.reset({ ...defaultValues.redeem });
      const product = form.getValues("product");
      setAmountInAsset(productToAssetMap[product]);  // Set gmSOL or relevant asset when redeeming
    }
  };

  const handleProductChange = (product: FlowSchema["product"]) => {
    form.setValue("product", product);
    if (direction === "redeem") {
      setAmountInAsset(productToAssetMap[product]);  // Update asset based on product in redeem mode
    } else {
      setAmountInAsset("SOL");  // Set SOL in subscribe mode
    }
  };

  return (<PageContentWrapper>
      <div className="w-4/6 self-center">
        <div>
          <FormProvider {...form}>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="flex">
                  <FormItem className="w-full ">
                    <FormLabel>Direction</FormLabel>
                    <ToggleGroup
                      type="single"
                      value={direction}
                      onValueChange={handleModeChange}
                      className="w-full space-x-4"
                    >
                      <ToggleGroupItem
                        value="subscribe"
                        aria-label="Subscribe"
                        className="w-1/2"
                      >
                        Subscribe
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="redeem"
                        aria-label="Redeem"
                        className="w-1/2"
                      >
                        Redeem
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormItem>
                </div>

                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (<FormItem className="w-1/2">
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => form.setValue("category", value as FlowSchema["category"])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Category">
                                {field.value.charAt(0).toUpperCase() + field.value.slice(1)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {flowSchema.shape.category._def.values.map((option) => (<SelectItem className="capitalize" key={option} value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </SelectItem>))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}
                  />

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (<FormItem className="w-1/2">
                        <FormLabel>Method</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => form.setValue("method", value as FlowSchema["method"])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Method">
                                {field.value === "in-kind"
                                  ? "In-Kind"
                                  : field.value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {flowSchema.shape.method._def.values.map((option) => (<SelectItem className="capitalize" key={option} value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </SelectItem>))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}
                  />
                </div>

                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (<FormItem className="w-1/2">
                        <FormLabel>Product</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => handleProductChange(value as FlowSchema["product"])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Product" />
                            </SelectTrigger>
                            <SelectContent>
                              {flowSchema.shape.product._def.values.map((option) => (<SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}
                  />
                  <AssetInput
                    className="min-w-1/2 w-1/2"
                    name="amountIn"
                    label="Amount"
                    balance={balance}
                    selectedAsset={amountInAsset}
                    onSelectAsset={setAmountInAsset}
                    disableAssetChange={true}
                  />
                </div>

                <div className="flex space-x-4 w-full  mt-4">
                  <Button
                    className="w-1/2"
                    variant="ghost"
                    onClick={(event) => handleClear(event)}
                  >
                    Clear
                  </Button>
                  <Button className="w-1/2" type="submit">
                    {direction.charAt(0).toUpperCase() + direction.slice(1)}
                  </Button>
                </div>
              </form>
            </Form>
          </FormProvider>
        </div>
      </div>
    </PageContentWrapper>);
}
