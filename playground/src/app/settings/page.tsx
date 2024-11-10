"use client";

import React, { useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PageContentWrapper from "@/components/PageContentWrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCluster } from "@/components/solana-cluster-provider";
import { toast } from "@/components/ui/use-toast";
import { PlusIcon, ResetIcon } from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PriorityFeeInput } from "@/components/PriorityFeeInput";
import { useQuery } from "@tanstack/react-query";
import {
  getPriorityFeeEstimate,
  GLAM_PROGRAM_ID_MAINNET,
} from "@glam/anchor/react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const rpcFormSchema = z.object({
  customLabel: z.string().min(1, "Label is required"),
  customEndpoint: z.string().url("Must be a valid URL"),
  activeEndpoint: z.string().min(1, "Active endpoint is required"),
});

const priorityFeeOptions = ["dynamic", "multiple", "custom"] as const;
type PriorityFeeType = (typeof priorityFeeOptions)[number];

const feeUnitOptions = ["SOL", "LMPS"] as const;
type FeeUnit = (typeof feeUnitOptions)[number];

const priorityFeeFormSchema = z.object({
  option: z.enum(priorityFeeOptions),
  multiplier: z.string().optional(),
  maxCapFee: z.number().optional(),
  maxCapFeeUnit: z.enum(feeUnitOptions),
  customFee: z.number().optional(),
  customFeeUnit: z.enum(feeUnitOptions),
  estimatedFee: z.number().optional(),
  estimatedFeeUnit: z.enum(feeUnitOptions),
});

const PERSISTED_FIELDS = {
  rpc: [],
  priorityFee: [
    "option",
    "multiplier",
    "maxCapFee",
    "maxCapFeeUnit",
    "customFee",
    "customFeeUnit",
    "estimatedFeeUnit",
  ],
};
type FormKey = keyof typeof PERSISTED_FIELDS;

function usePersistedForm<T extends z.ZodTypeAny>(
  formKey: FormKey,
  schema: T,
  defaultValues: z.infer<T>
): UseFormReturn<z.infer<T>> {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    const storedValues = localStorage.getItem(formKey);
    if (storedValues) {
      let parsedValues;
      try {
        parsedValues = JSON.parse(storedValues);
      } catch (e) {
        parsedValues = {};
      }
      Object.keys(parsedValues).forEach((key) => {
        if ((PERSISTED_FIELDS[formKey] as string[]).includes(key)) {
          form.setValue(key as any, parsedValues[key]);
        }
      });
    }
  }, [formKey, form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const persistedValues: Partial<z.infer<T>> = {};
      PERSISTED_FIELDS[formKey].forEach((field) => {
        if (value[field as keyof z.infer<T>] !== undefined) {
          persistedValues[field as keyof z.infer<T>] =
            value[field as keyof z.infer<T>];
        }
      });
      localStorage.setItem(formKey, JSON.stringify(persistedValues));
    });
    return () => subscription.unsubscribe();
  }, [formKey, form]);

  return form;
}

type RpcFormValues = z.infer<typeof rpcFormSchema>;
type PriorityFeeFormValues = z.infer<typeof priorityFeeFormSchema>;

type Endpoint = {
  value: string;
  label: string;
  url: string;
  isCustom?: boolean;
};

// Helper function to capitalize the first letter of each word
const capitalizeWords = (str: string) => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Helper function to truncate URL for privacy
const truncateUrl = (url: string) => {
  const parsedUrl = new URL(url);
  if (parsedUrl.hostname === "localhost") {
    return `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}`;
  }
  return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
};

const PRIORITY_FEE_FORM_DEFAULT_VALUES = {
  option: "dynamic" as PriorityFeeType,
  multiplier: "1",
  maxCapFee: 0.004,
  maxCapFeeUnit: "SOL" as FeeUnit,
  customFee: 0.001,
  customFeeUnit: "SOL" as FeeUnit,
  estimatedFee: 0.00001,
  estimatedFeeUnit: "SOL" as FeeUnit,
};

const SettingsPage: React.FC = () => {
  const { cluster, clusters, setCluster } = useCluster();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [open, setOpen] = useState(false);

  const rpcForm = useForm<RpcFormValues>({
    resolver: zodResolver(rpcFormSchema),
    defaultValues: {
      customLabel: "",
      customEndpoint: "",
      activeEndpoint: cluster.endpoint || "",
    },
  });

  const priorityFeeForm = usePersistedForm(
    "priorityFee",
    priorityFeeFormSchema,
    PRIORITY_FEE_FORM_DEFAULT_VALUES
  );

  const feeOption = priorityFeeForm.watch("option");
  const multiplier = priorityFeeForm.watch("multiplier");

  const { data: priorityFeeEstimate } = useQuery({
    queryKey: ["getEstimateFee"],
    refetchInterval: 10_000,
    enabled: feeOption !== "custom",
    queryFn: () =>
      getPriorityFeeEstimate(
        process.env.NEXT_PUBLIC_HELIUS_API_KEY!,
        undefined,
        [GLAM_PROGRAM_ID_MAINNET.toBase58()],
        "High"
      ),
  });
  useEffect(() => {
    if (priorityFeeEstimate) {
      console.log("priorityFeeEstimate:", priorityFeeEstimate, "microLamports");
      const { estimatedFeeUnit } = priorityFeeForm.getValues();
      const val =
        estimatedFeeUnit === "SOL"
          ? priorityFeeEstimate / LAMPORTS_PER_SOL
          : Math.ceil(priorityFeeEstimate);
      priorityFeeForm.setValue("estimatedFee", val);
    }
  }, [priorityFeeEstimate]);

  const handleResetFeeValues = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    priorityFeeForm.reset(PRIORITY_FEE_FORM_DEFAULT_VALUES);

    toast({
      title: "Fee Values Reset",
      description:
        "Priority fee and related values have been reset to their defaults.",
    });
  };

  const handlePriorityFeeOptionChange = (value: PriorityFeeType) => {
    if (!priorityFeeOptions.includes(value)) {
      return;
    }
    priorityFeeForm.setValue("option", value, {
      shouldValidate: true,
    });
  };

  useEffect(() => {
    const clusterEndpoints = clusters.map((c) => ({
      value: c.endpoint,
      label: capitalizeWords(c.name),
      url: truncateUrl(c.endpoint),
    }));

    const storedEndpoints = localStorage.getItem("customEndpoints");
    const customEndpoints = storedEndpoints
      ? JSON.parse(storedEndpoints).map(
          (ce: { label: string; endpoint: string }) => ({
            value: ce.endpoint,
            label: capitalizeWords(ce.label),
            url: truncateUrl(ce.endpoint),
            isCustom: true,
          })
        )
      : [];

    setEndpoints([...clusterEndpoints, ...customEndpoints]);
  }, [clusters]);

  const onSubmit = (data: RpcFormValues) => {
    const newCustomEndpoint = {
      value: data.customEndpoint,
      label: capitalizeWords(data.customLabel),
      url: truncateUrl(data.customEndpoint),
      isCustom: true,
    };
    const updatedEndpoints = [...endpoints, newCustomEndpoint];
    setEndpoints(updatedEndpoints);
    localStorage.setItem(
      "customEndpoints",
      JSON.stringify(updatedEndpoints.filter((e) => e.isCustom))
    );

    // Automatically set the new endpoint as active
    handleEndpointChange(data.customEndpoint);

    rpcForm.reset({ customLabel: "", customEndpoint: "" });

    toast({
      title: "Custom endpoint added",
      description: `${newCustomEndpoint.label} has been added and set as your active endpoint.`,
    });
  };

  const handleEndpointChange = (value: string) => {
    const selectedEndpoint = endpoints.find((e) => e.value === value);
    if (selectedEndpoint) {
      rpcForm.setValue("activeEndpoint", value);
      const clusterEndpoint = clusters.find((c) => c.endpoint === value);
      if (clusterEndpoint) {
        setCluster(clusterEndpoint);
      }
      toast({
        title: "Endpoint changed",
        description: `Active endpoint set to ${selectedEndpoint.label}`,
      });
    }
  };

  const deleteCustomEndpoint = (endpointToDelete: string) => {
    const updatedEndpoints = endpoints.filter(
      (e) => e.value !== endpointToDelete
    );
    setEndpoints(updatedEndpoints);
    localStorage.setItem(
      "customEndpoints",
      JSON.stringify(updatedEndpoints.filter((e) => e.isCustom))
    );

    if (rpcForm.getValues("activeEndpoint") === endpointToDelete) {
      rpcForm.setValue("activeEndpoint", clusters[0].endpoint);
      setCluster(clusters[0]);
    }

    toast({
      title: "Custom endpoint deleted",
      description: "The selected custom endpoint has been removed.",
    });
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center space-y-8">
        {/* RPC endpoint settings */}
        <Form {...rpcForm}>
          <form onSubmit={rpcForm.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <FormField
                control={rpcForm.control}
                name="activeEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network Endpoint</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
                        >
                          {field.value
                            ? endpoints.find(
                                (endpoint) => endpoint.value === field.value
                              )?.label
                            : "Select endpoint..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-0"
                        side="bottom"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Search endpoint..." />
                          <CommandList>
                            <CommandEmpty>No endpoint found.</CommandEmpty>
                            <CommandGroup>
                              {endpoints.map((endpoint) => (
                                <CommandItem
                                  key={endpoint.value}
                                  value={endpoint.value}
                                  onSelect={(currentValue) => {
                                    handleEndpointChange(
                                      currentValue === field.value
                                        ? ""
                                        : currentValue
                                    );
                                    setOpen(false);
                                  }}
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === endpoint.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {endpoint.label}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {endpoint.url}
                                        </span>
                                      </div>
                                    </div>
                                    {endpoint.isCustom && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          deleteCustomEndpoint(endpoint.value);
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <div className="gap-4 flex flex-row items-start">
                <FormField
                  control={rpcForm.control}
                  name="customLabel"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom RPC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rpcForm.control}
                  name="customEndpoint"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>RPC Endpoint</FormLabel>
                      <FormControl>
                        <Input placeholder="https://helius.com/" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="outline"
                  className="mt-8 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </Form>

        <Separator className="my-4" />

        {/* Priority fee settings  */}
        <Form {...priorityFeeForm}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              console.log("submitting form");
              event.preventDefault(); // Prevent form submission on Enter key
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="priority-fee" className="text-sm font-medium">
                    Priority Fee
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-8 w-8 p-0"
                          onClick={(e) => handleResetFeeValues(e)}
                        >
                          <ResetIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Reset fee values to default.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select your priority fee preference.
                </p>
              </div>
              <FormField
                control={priorityFeeForm.control}
                name="option"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        id="priority-fee"
                        value={field.value}
                        onValueChange={handlePriorityFeeOptionChange}
                        className="w-full"
                      >
                        {priorityFeeOptions.map((option) => (
                          <ToggleGroupItem
                            key={option}
                            value={option}
                            aria-label={option}
                            className="flex-1 justify-center"
                          >
                            {capitalizeWords(option)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {feeOption !== "custom" ? (
                <div
                  className={cn(
                    feeOption === "multiple" ? "grid-cols-3" : "grid-cols-2",
                    "grid gap-4"
                  )}
                >
                  <div className="space-y-2">
                    <PriorityFeeInput
                      name="estimatedFee"
                      label="Est. Fee"
                      disableInput={true}
                      symbol={priorityFeeForm.watch("estimatedFeeUnit")}
                    />
                  </div>

                  {feeOption === "multiple" ? (
                    <FormField
                      control={priorityFeeForm.control}
                      name="multiplier"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Multiplier</FormLabel>
                          <Input
                            id="multiplier"
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || "";
                              field.onChange(val.toString());
                              priorityFeeForm.setValue(
                                "multiplier",
                                val.toString()
                              );
                            }}
                            value={field.value}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                              }
                            }}
                          />
                        </FormItem>
                      )}
                    />
                  ) : null}

                  <FormField
                    control={priorityFeeForm.control}
                    name="maxCapFee"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormControl>
                          <PriorityFeeInput
                            name="maxCapFee"
                            label="Max Cap Fee"
                            symbol={priorityFeeForm.watch("maxCapFeeUnit")}
                            disableSubmitOnEnter={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={priorityFeeForm.control}
                  name="customFee"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormControl>
                        <PriorityFeeInput
                          name="customFee"
                          label="Custom Fee"
                          symbol={priorityFeeForm.watch("customFeeUnit")}
                          disableSubmitOnEnter={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </form>
        </Form>
      </div>
    </PageContentWrapper>
  );
};

export default SettingsPage;
