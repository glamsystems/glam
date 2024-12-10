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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useGlam, MSOL, WSOL } from "@glam/anchor/react";
import { ProductNameGen } from "@/utils/ProductNameGen";
import { UpdateIcon } from "@radix-ui/react-icons";
import PageContentWrapper from "@/components/PageContentWrapper";
import { PublicKey } from "@solana/web3.js";

const createSchema = z.object({
  productName: z.string().min(3, {
    message: "Vault name must be at least 3 characters.",
  }),
});

type CreateSchema = z.infer<typeof createSchema>;

export default function Create() {
  const [isLoading, setIsLoading] = useState(false);
  const { glamClient } = useGlam();
  const form = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      productName: "",
    },
  });

  useEffect(() => {
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  }, [form]);

  const onSubmit = async (values: CreateSchema) => {
    setIsLoading(true);
    try {
      const fund = {
        name: values.productName,
        shareClasses: [],
        isEnabled: true,
        // fundDomicileAlpha2: "XS",
        // legalFundNameIncludingUmbrella: values.productName,
        // fundLaunchDate: new Date().toISOString().split("T")[0],
        // investmentObjective: "Internal Testing",
        // fundCurrency: "SOL",
        // openEndedOrClosedEndedFundStructure: "open-ended fund",
        // fiscalYearEnd: "12-31",
        // legalForm: "other",
        // company: {
        //   fundGroupName: "GLAM GUI",
        //   manCo: "GLAM GUI",
        //   domicileOfManCo: "CH",
        //   emailAddressOfManCo: "build@glam.systems",
        //   fundWebsiteOfManCo: "https://glam.systems",
        // },
        // manager: {
        //   portfolioManagerName: "GLAM",
        // },
      };

      const [txId, fundPDA] = await glamClient.fund.createFund(fund);

      toast({
        title: "Vault created",
        description: (
          <div>
            <p>Fund PDA: {fundPDA.toBase58()}</p>
            <p>Transaction ID: {txId}</p>
          </div>
        ),
      });
    } catch (error) {
      console.error("Error creating vault:", error);
      toast({
        title: "Error",
        description: "Failed to create vault. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  };

  const handleRefresh = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex space-x-4 items-top">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Vault Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Vault name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the public vault name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                className="mt-8 min-w-10"
                onClick={handleRefresh}
              >
                <UpdateIcon />
              </Button>
            </div>
            <div className="flex space-x-4 w-full">
              <Button className="w-1/2" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
              <Button className="w-1/2" type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContentWrapper>
  );
}
