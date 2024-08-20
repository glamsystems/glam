"use client";

import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import React, {useEffect, useState} from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useGlam } from "@glam/anchor/react";
import { ProductNameGen } from "@/utils/ProductNameGen";
import {UpdateIcon} from "@radix-ui/react-icons";
import PageContentWrapper from "@/components/PageContentWrapper";


const createSchema = z.object({
  productName: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
});

type CreateSchema = z.infer<typeof createSchema>;

export default function Create() {
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

  const onSubmit: SubmitHandler<CreateSchema> = async (values, event) => {
    const nativeEvent = event as unknown as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };

    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") === "submit") {
      console.log("Create product");
      const updatedValues = {
        ...values,
      };

      toast({
        title: "Product Created",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-zinc-900 p-4">
            <code className="text-white">{JSON.stringify(values, null, 2)}</code>
          </pre>
        ),
      });
    }
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  }

  const handleRefresh = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  }

  return (
    <PageContentWrapper>
      <div className="w-1/2 self-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex space-x-4 items-top">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product Name" {...field} />
                  </FormControl>
                  <FormDescription>This is the public product name.</FormDescription>
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
            <Button
              className="w-1/2"
              variant="ghost"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button className="w-1/2" type="submit">
              Create
            </Button>
          </div>
        </form>
      </Form>
      </div>
    </PageContentWrapper>
  );
}
