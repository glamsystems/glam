"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { z } from "zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "./ui/label";

const formSchema = z.object({
  priorityLevel: z.enum(["Low", "Medium", "High"]),
  priorityMode: z.enum(["Max Cap", "Exact Fee"]),
  maxCap: z.coerce.number().min(0),
  exactFee: z.coerce.number().min(0),
});

export type PriorityFeeSettings = z.infer<typeof formSchema>;

const defaultValues: PriorityFeeSettings = {
  priorityLevel: "Medium",
  priorityMode: "Max Cap",
  maxCap: 0,
  exactFee: 0,
};

export const PRIORITY_FEE_SETTINGS_KEY = "fatcat:priority-fee-settings";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { connected } = useWallet();
  const router = useRouter();

  const form = useForm<PriorityFeeSettings>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem(PRIORITY_FEE_SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        form.reset(parsedSettings);
      } catch (error) {
        console.error("Failed to parse saved priority fee settings:", error);
      }
    }
  }, [form]);

  function onSubmit(values: PriorityFeeSettings) {
    console.log("priority fee settings submitted:", values);
    localStorage.setItem(PRIORITY_FEE_SETTINGS_KEY, JSON.stringify(values));
    setOpen(false);
  }

  useEffect(() => {
    if (!connected) {
      router.push("/");
    }
  }, [connected, router]);

  if (!connected) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-12 h-12 rounded focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
          variant="outline"
        >
          <AdjustmentsHorizontalIcon className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-muted rounded">
        <DialogHeader>
          <DialogTitle>Priority Fee Settings</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {form.watch("priorityMode") === "Max Cap" && (
              <FormField
                control={form.control}
                name="priorityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Level</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex justify-between"
                      >
                        <FormItem className="w-1/3">
                          <FormControl>
                            <RadioGroupItem
                              value="Low"
                              id="Low"
                              className="peer sr-only"
                            />
                          </FormControl>
                          <Label
                            htmlFor="Low"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent py-2 px-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full"
                          >
                            Low
                          </Label>
                        </FormItem>
                        <FormItem className="w-1/3">
                          <FormControl>
                            <RadioGroupItem
                              value="Medium"
                              id="Medium"
                              className="peer sr-only"
                            />
                          </FormControl>
                          <Label
                            htmlFor="Medium"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent py-2 px-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full"
                          >
                            Medium
                          </Label>
                        </FormItem>
                        <FormItem className="w-1/3">
                          <FormControl>
                            <RadioGroupItem
                              value="High"
                              id="High"
                              className="peer sr-only"
                            />
                          </FormControl>
                          <Label
                            htmlFor="High"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent py-2 px-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full"
                          >
                            High
                          </Label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="priorityMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Mode</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex"
                    >
                      <FormItem className="w-1/2">
                        <FormControl>
                          <RadioGroupItem
                            value="Max Cap"
                            id="max-cap"
                            className="peer sr-only"
                          />
                        </FormControl>
                        <Label
                          htmlFor="max-cap"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent py-2 px-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full"
                        >
                          Max Cap
                        </Label>
                      </FormItem>
                      <FormItem className="w-1/2">
                        <FormControl>
                          <RadioGroupItem
                            value="Exact Fee"
                            id="exact-fee"
                            className="peer sr-only"
                          />
                        </FormControl>
                        <Label
                          htmlFor="exact-fee"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent py-2 px-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full"
                        >
                          Exact Fee
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Jupiter will use the exact fee you set.
                  </FormDescription>
                </FormItem>
              )}
            />

            {form.watch("priorityMode") === "Max Cap" && (
              <FormField
                control={form.control}
                name="maxCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Set Max Cap</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.0001"
                          {...field}
                          className="pr-16"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                          SOL
                        </div>
                      </div>
                    </FormControl>
                    {/* <FormDescription className="text-right text-muted-foreground">
                      ≈$0.0167
                    </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("priorityMode") === "Exact Fee" && (
              <FormField
                control={form.control}
                name="exactFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Set Exact Fee</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.0001"
                          {...field}
                          className="pr-16"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                          SOL
                        </div>
                      </div>
                    </FormControl>
                    {/* <FormDescription className="text-right text-muted-foreground">
                      ≈$0.0167
                    </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              className="w-full text-foreground dark:text-background"
            >
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
