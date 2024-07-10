"use client";

import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGlamClient } from "@glam/anchor";

const createSchema = z.object({
  productType: z.enum(["treasury", "onchain", "tokenized"])
});

type CreateSchema = z.infer<typeof createSchema>;

export default function Create() {
  const glamClient = useGlamClient();
  const [productType, setProductType] = useState<string>("treasury");

  const form = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      productType: "treasury"
    },
  });

  const onSubmit: SubmitHandler<CreateSchema> = async (values, _event) => {
    console.log("Create ", values);

    toast({
      title: `Successfully ${productType}`,
      description: "",
    });
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    form.reset();
    setProductType("treasury");
  };

  const handleDirectionChange = (value: string) => {
    if (value) {
      form.setValue("productType", value as "treasury" | "onchain" | "tokenized");
      setProductType(value);
    }
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 w-1/2 mt-16"
        >
          <div className="flex space-x-4 items-top">
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={handleDirectionChange}
                    className="flex space-x-2 justify-start"
                  >
                    <ToggleGroupItem value="treasury" aria-label="Treasury">
                      Treasury
                    </ToggleGroupItem>
                    <ToggleGroupItem value="onchain" aria-label="Onchain">
                      Onchain
                    </ToggleGroupItem>
                    <ToggleGroupItem value="tokenized" aria-label="Tokenized">
                      Tokenized
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormItem>
              )}
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
              Create
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
