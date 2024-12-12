"use client";

import React, { useState } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const policyFormSchema = z.object({
  lockUp: z.number(),
  permanentDelegate: z.string().optional(),
  defaultAccountStateFrozen: z.boolean(),
});
type PolicyFormSchema = z.infer<typeof policyFormSchema>;

export default function MintPoliciesPage() {
  const [policyFormData, setPolicyFormData] = useState({
    lockUp: 0,
    permanentDelegate: "",
    defaultAccountStateFrozen: true,
  });

  const handlePolicyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPolicyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDefaultAccountStateChange = (defaultFrozen: boolean) => {
    setPolicyFormData((prev) => ({
      ...prev,
      defaultAccountStateFrozen: defaultFrozen,
    }));
  };

  return (
    <PageContentWrapper>
      <div className="flex flex-col space-y-4">
        <PolicyForm
          formData={policyFormData}
          handleInputChange={handlePolicyInputChange}
          handleDefaultAccountStateChange={handleDefaultAccountStateChange}
        />
        <div className="flex space-x-4 w-full">
          <Button className="w-1/2" variant="ghost" onClick={(event) => {}}>
            Reset
          </Button>
          <Button className="w-1/2" type="submit" loading={false}>
            Update
          </Button>
        </div>
      </div>
    </PageContentWrapper>
  );
}

function PolicyForm({
  formData,
  handleInputChange,
  handleDefaultAccountStateChange,
}: {
  formData: PolicyFormSchema;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDefaultAccountStateChange: (value: boolean) => void;
}) {
  const form = useForm<PolicyFormSchema>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: formData,
  });

  return (
    <div>
      <h2 className="text-xl mb-6 text-muted-foreground font-extralight">
        Policies
      </h2>
      <Form {...form}>
        <form className="space-y-8">
          <FormField
            control={form.control}
            name="lockUp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Lock-Up Period
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleInputChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-gray-500">
                  Lock-up period in hours
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="permanentDelegate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Permanent Delegate (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleInputChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-gray-500">
                  The public key of the permanent delegate who will be able to
                  mint, burn, and force transfer share class tokens
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultAccountStateFrozen"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Default Account State
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={
                      formData.defaultAccountStateFrozen ? "frozen" : "active"
                    }
                    onValueChange={(v) => {
                      handleDefaultAccountStateChange(v === "frozen");
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div key="frozen">
                        <RadioGroupItem
                          className="peer sr-only cursor-pointer"
                          value="frozen"
                          id="frozen"
                        />
                        <Label
                          htmlFor="frozen"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Frozen
                        </Label>
                      </div>
                      <div key="active">
                        <RadioGroupItem
                          className="peer sr-only cursor-pointer"
                          value="active"
                          id="active"
                        />
                        <Label
                          htmlFor="active"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Active
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage className="text-gray-500">
                  Whether the default account state is frozen or not
                </FormMessage>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
