"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import PageContentWrapper from "@/components/PageContentWrapper";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define the schema for our form
const formSchema = z.object({
  productName: z.string().min(1, { message: "Product name is required" }),
});

// Infer the type from our schema
type FormValues = z.infer<typeof formSchema>;

const RPCClientForm: React.FC = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log(data);
    // Handle form submission
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom RPC URL</FormLabel>
                  <FormControl>
                    <Input placeholder="http://localhost:8899" {...field} />
                  </FormControl>
                  {/*<FormDescription>This is the RPC URL.</FormDescription>*/}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              Set RPC
            </Button>
          </form>
        </Form>
      </div>
    </PageContentWrapper>
  );
};

export default RPCClientForm;
