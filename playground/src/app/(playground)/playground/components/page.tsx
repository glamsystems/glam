"use client";

import React from "react";
import { useForm } from "react-hook-form";
import PageContentWrapper from "@/components/PageContentWrapper";
import ComponentDebugWrapper from "@/components/ComponentDebugWrapper";
import { FormInput } from "@/components/FormInput";
import { Form } from "@/components/ui/form";

type FormValues = {
  Test: string;
};

export default function Components() {
  const form = useForm<FormValues>({
    defaultValues: {
      Test: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log(data);
  };

  return (
    <PageContentWrapper>
      <ComponentDebugWrapper header="FormInput">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormInput name="Test" label="Test Label" type="string" />
            <FormInput
              name="SlippageTest"
              label="Slippage Test"
              type="number"
            />
            <FormInput
              name="LamportsTest"
              label="Lamports Test"
              type="number"
            />
          </form>
        </Form>
      </ComponentDebugWrapper>
    </PageContentWrapper>
  );
}
