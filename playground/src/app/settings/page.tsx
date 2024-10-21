"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
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

const priorityFeeOptions = [
  "dynamic",
  "elevated",
  "critical",
  "custom",
] as const;
type PriorityFeeType = (typeof priorityFeeOptions)[number];

const formSchema = z.object({
  customLabel: z.string().min(1, "Label is required"),
  customEndpoint: z.string().url("Must be a valid URL"),
  activeEndpoint: z.string().min(1, "Active endpoint is required"),
  priorityFee: z.enum(priorityFeeOptions),
  maxCapFee: z.string().refine(
    (value) => {
      const numValue = parseFloat(value);
      return value === "" || (!isNaN(numValue) && numValue >= 0.000001);
    },
    {
      message: "Max Cap Fee must be at least 0.000001",
    }
  ),
  customFee: z
    .string()
    .optional()
    .refine((value) => value === "" || !isNaN(Number(value)), {
      message: "Must be a valid number",
    }),
});

type FormValues = z.infer<typeof formSchema>;

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

const SettingsPage: React.FC = () => {
  const { cluster, clusters, setCluster } = useCluster();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [open, setOpen] = useState(false);
  const dynamicFee = 0.000001; // Example dynamic fee
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMaxCapFeeSetFromStorage, setIsMaxCapFeeSetFromStorage] =
    useState(false);
  const [isMaxCapFeeManuallySet, setIsMaxCapFeeManuallySet] = useState(false);
  const prevMaxCapFee = useRef<string | null | undefined>(null);
  const prevCustomFee = useRef<string | null | undefined>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customLabel: "",
      customEndpoint: "",
      activeEndpoint: cluster.endpoint || "",
      priorityFee: "dynamic",
      maxCapFee: "",
      customFee: "",
    },
  });

  const priorityFee = useWatch({
    control: form.control,
    name: "priorityFee",
    defaultValue: "dynamic", // Ensure default value is set
  });

  const maxCapFee = useWatch({
    control: form.control,
    name: "maxCapFee",
    defaultValue: "", // Ensure default value is set
  });

  const customFee = useWatch({
    control: form.control,
    name: "customFee",
    defaultValue: "", // Ensure default value is set
  });

  const estimatedFee = useMemo(() => {
    switch (priorityFee) {
      case "dynamic":
        return dynamicFee;
      case "elevated":
        return dynamicFee * 5;
      case "critical":
        return dynamicFee * 10;
      default:
        return dynamicFee;
    }
  }, [priorityFee, dynamicFee]);

  const resetFeeValues = () => {
    form.setValue("priorityFee", "dynamic", { shouldValidate: true });
    form.setValue("maxCapFee", dynamicFee.toFixed(6), { shouldValidate: true });
    form.setValue("customFee", "", { shouldValidate: true });
    saveToLocalStorage("priorityFee", "dynamic");
    saveToLocalStorage("maxCapFee", dynamicFee.toFixed(6));
    saveToLocalStorage("customFee", "");
    toast({
      title: "Fee Values Reset",
      description:
        "Priority fee and related values have been reset to their defaults.",
    });
  };

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const currentMaxCapFee = parseFloat(form.getValues("maxCapFee"));
    if (isNaN(currentMaxCapFee) || currentMaxCapFee < estimatedFee) {
      form.setValue("maxCapFee", estimatedFee.toFixed(6), {
        shouldValidate: true,
      });
      saveToLocalStorage("maxCapFee", estimatedFee.toFixed(6));

      // Show destructive toast only when there's an actual change, not on initial load
      toast({
        title: "Max Cap Fee Increased",
        description: `Max Cap Fee has been automatically increased to ${estimatedFee.toFixed(
          6
        )} to match the new estimated fee.`,
        variant: "destructive",
      });
    }
  }, [estimatedFee, form, isInitialLoad]);

  const handlePriorityFeeChange = (value: PriorityFeeType) => {
    if (priorityFeeOptions.includes(value)) {
      form.setValue("priorityFee", value, { shouldValidate: true });
      saveToLocalStorage("priorityFee", value);

      const currentMaxCapFee = parseFloat(form.getValues("maxCapFee"));
      const newEstimatedFee =
        value === "dynamic"
          ? dynamicFee
          : value === "elevated"
          ? dynamicFee * 5
          : value === "critical"
          ? dynamicFee * 10
          : dynamicFee;

      if (
        !isMaxCapFeeManuallySet &&
        (isNaN(currentMaxCapFee) || currentMaxCapFee < newEstimatedFee)
      ) {
        form.setValue("maxCapFee", newEstimatedFee.toFixed(6), {
          shouldValidate: true,
        });
        saveToLocalStorage("maxCapFee", newEstimatedFee.toFixed(6));

        // Show destructive toast only when there's an actual change and it's not the initial load
        if (!isInitialLoad) {
          toast({
            title: "Max Cap Fee Increased",
            description: `Max Cap Fee has been automatically increased to ${newEstimatedFee.toFixed(
              6
            )} due to the change in priority fee.`,
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleMaxCapFeeBlur = (value: string | undefined) => {
    const numValue = parseFloat(value || "");
    if (!isNaN(numValue)) {
      // Handle undefined value by defaulting to an empty string
      if (prevMaxCapFee.current !== (value || "")) {
        if (numValue >= estimatedFee) {
          form.setValue("maxCapFee", numValue.toFixed(6), {
            shouldValidate: true,
          });
          saveToLocalStorage("maxCapFee", numValue.toFixed(6));
          setIsMaxCapFeeManuallySet(true);

          if (!isInitialLoad) {
            toast({
              title: "Max Cap Fee Updated",
              description: `Max Cap Fee has been manually set to ${numValue.toFixed(
                6
              )}.`,
            });
          }
        } else {
          const newValue = estimatedFee.toFixed(6);
          form.setValue("maxCapFee", newValue, { shouldValidate: true });
          saveToLocalStorage("maxCapFee", newValue);
          setIsMaxCapFeeManuallySet(false);

          if (!isInitialLoad) {
            toast({
              title: "Max Cap Fee Adjusted",
              description: `Max Cap Fee has been automatically set to ${newValue} to match the current estimated fee.`,
              variant: "destructive",
            });
          }
        }
        prevMaxCapFee.current = value || ""; // Update previous value
      }
    }
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

  useEffect(() => {
    // Load stored priority fee settings
    const storedPriorityFee = localStorage.getItem(
      "priorityFee"
    ) as PriorityFeeType;
    const storedMaxCapFee = localStorage.getItem("maxCapFee");
    const storedCustomFee = localStorage.getItem("customFee") || "";

    if (priorityFeeOptions.includes(storedPriorityFee)) {
      form.setValue("priorityFee", storedPriorityFee);
    } else {
      form.setValue("priorityFee", "dynamic");
    }

    if (storedMaxCapFee) {
      form.setValue("maxCapFee", storedMaxCapFee);
      setIsMaxCapFeeSetFromStorage(true);
      setIsMaxCapFeeManuallySet(true); // Assume any stored value was manually set
    } else {
      // If there's no stored max cap fee, set it to the initial estimated fee
      form.setValue("maxCapFee", dynamicFee.toFixed(6));
    }

    form.setValue("customFee", storedCustomFee);

    setIsInitialLoad(false);
  }, [form, dynamicFee]);

  // Ensure value is a string (fallback to empty string if undefined)

  const saveToLocalStorage = (key: string, value: string | undefined) => {
    localStorage.setItem(key, value || ""); // Ensure non-undefined value is passed
    if (key === "maxCapFee") {
      setIsMaxCapFeeSetFromStorage(true);
    }
    // if (!isInitialLoad) {
    //   toast({
    //     title: "Fee Settings Updated",
    //     description: `${capitalizeWords(key)} is updated to ${
    //       value || "not set"
    //     }.`,
    //   });
    // }
  };

  const handleCustomFeeBlur = (value: string | undefined) => {
    const customFeeValue = value || ""; // Default to empty string if undefined
    if (prevCustomFee.current !== customFeeValue) {
      saveToLocalStorage("customFee", customFeeValue); // Save to localStorage

      if (!isInitialLoad) {
        if (customFeeValue === "") {
          toast({
            title: "Custom Fee Removed",
            description: "Custom Fee has been cleared.",
          });
        } else {
          toast({
            title: "Custom Fee Updated",
            description: `Custom Fee has been manually set to ${customFeeValue}.`,
          });
        }
      }

      prevCustomFee.current = customFeeValue; // Update the previous customFee value
    }
  };

  const onSubmit = (data: FormValues) => {
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

    form.reset({ customLabel: "", customEndpoint: "" });

    toast({
      title: "Custom endpoint added",
      description: `${newCustomEndpoint.label} has been added and set as your active endpoint.`,
    });
  };

  const handleEndpointChange = (value: string) => {
    const selectedEndpoint = endpoints.find((e) => e.value === value);
    if (selectedEndpoint) {
      form.setValue("activeEndpoint", value);
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

    if (form.getValues("activeEndpoint") === endpointToDelete) {
      form.setValue("activeEndpoint", clusters[0].endpoint);
      setCluster(clusters[0]);
    }

    toast({
      title: "Custom endpoint deleted",
      description: "The selected custom endpoint has been removed.",
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <FormField
                control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
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
                          onClick={(e) => {
                            e.preventDefault();
                            resetFeeValues();
                          }}
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
                control={form.control}
                name="priorityFee"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        id="priority-fee"
                        value={field.value}
                        onValueChange={handlePriorityFeeChange}
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

              {priorityFee !== "custom" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="est-fee" className="text-sm font-medium">
                      Est. Fee
                    </Label>
                    <Input
                      id="est-fee"
                      value={estimatedFee.toFixed(6)}
                      defaultValue={0.00001}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="maxCapFee"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label
                          htmlFor="max-cap-fee"
                          className="text-sm font-medium"
                        >
                          Max Cap Fee
                        </Label>
                        <FormControl>
                          <Input
                            id="max-cap-fee"
                            placeholder="0.00001"
                            defaultValue={0.00001}
                            {...field}
                            onBlur={() => handleMaxCapFeeBlur(field.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleMaxCapFeeBlur(field.value);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="customFee"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label
                        htmlFor="custom-fee"
                        className="text-sm font-medium"
                      >
                        Custom Fee
                      </Label>
                      <FormControl>
                        <Input
                          id="custom-fee"
                          placeholder="0.0001"
                          {...field}
                          onBlur={() => handleCustomFeeBlur(field.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCustomFeeBlur(field.value);
                            }
                          }}
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
