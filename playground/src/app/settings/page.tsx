"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PageContentWrapper from "@/components/PageContentWrapper";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCluster } from "@/components/solana-cluster-provider";
import { toast } from "@/components/ui/use-toast";
import { PlusIcon } from "@radix-ui/react-icons";

const formSchema = z.object({
  customLabel: z.string().min(1, "Label is required"),
  customEndpoint: z.string().url("Must be a valid URL"),
  activeEndpoint: z.string().min(1, "Active endpoint is required"),
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
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// Helper function to truncate URL for privacy
const truncateUrl = (url: string) => {
  const parsedUrl = new URL(url);
  if (parsedUrl.hostname === 'localhost') {
    return `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}`;
  }
  return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
};

const SettingsPage: React.FC = () => {
  const { cluster, clusters, setCluster } = useCluster();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customLabel: '',
      customEndpoint: '',
      activeEndpoint: cluster.endpoint,
    },
  });

  useEffect(() => {
    const clusterEndpoints = clusters.map(c => ({
      value: c.endpoint,
      label: capitalizeWords(c.name),
      url: truncateUrl(c.endpoint),
    }));

    const storedEndpoints = localStorage.getItem('customEndpoints');
    const customEndpoints = storedEndpoints
      ? JSON.parse(storedEndpoints).map((ce: {label: string, endpoint: string}) => ({
        value: ce.endpoint,
        label: capitalizeWords(ce.label),
        url: truncateUrl(ce.endpoint),
        isCustom: true,
      }))
      : [];

    setEndpoints([...clusterEndpoints, ...customEndpoints]);
  }, [clusters]);

  const onSubmit = (data: FormValues) => {
    const newCustomEndpoint = {
      value: data.customEndpoint,
      label: capitalizeWords(data.customLabel),
      url: truncateUrl(data.customEndpoint),
      isCustom: true,
    };
    const updatedEndpoints = [...endpoints, newCustomEndpoint];
    setEndpoints(updatedEndpoints);
    localStorage.setItem('customEndpoints', JSON.stringify(updatedEndpoints.filter(e => e.isCustom)));

    // Automatically set the new endpoint as active
    handleEndpointChange(data.customEndpoint);

    form.reset({ customLabel: '', customEndpoint: '' });

    toast({
      title: "Custom endpoint added",
      description: `${newCustomEndpoint.label} has been added and set as your active endpoint.`,
    });
  };

  const handleEndpointChange = (value: string) => {
    const selectedEndpoint = endpoints.find(e => e.value === value);
    if (selectedEndpoint) {
      form.setValue('activeEndpoint', value);
      const clusterEndpoint = clusters.find(c => c.endpoint === value);
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
    const updatedEndpoints = endpoints.filter(e => e.value !== endpointToDelete);
    setEndpoints(updatedEndpoints);
    localStorage.setItem('customEndpoints', JSON.stringify(updatedEndpoints.filter(e => e.isCustom)));

    if (form.getValues('activeEndpoint') === endpointToDelete) {
      form.setValue('activeEndpoint', clusters[0].endpoint);
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
                          className="w-full justify-between"
                        >
                          {field.value
                            ? endpoints.find(
                              (endpoint) => endpoint.value === field.value
                            )?.label
                            : "Select endpoint..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" side="bottom" align="start">
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
                        <Input
                          placeholder="https://helius.com/"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="outline"
                  className="mt-8"
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </PageContentWrapper>
  );
};

export default SettingsPage;
