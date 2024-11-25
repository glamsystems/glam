"use client";

import React, { useState } from "react";
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import {
  MagnifyingGlassIcon,
  LineHeightIcon,
  TextAlignMiddleIcon,
  CopyIcon,
} from "@radix-ui/react-icons";
import PageContentWrapper from "@/components/PageContentWrapper";
import SparkleBackground from "@/components/SparkleBackground";
import { motion } from "framer-motion";
import GlamHeader from "@/components/GlamHeader";
import Link from "next/link";
import { DevOnly } from "@/components/DevOnly";

const header = (
  <GlamHeader>
    <div className="flex items-center gap-4">
      <h1 className="text-lg font-light">
        <span className="font-thin">GLAM *.+</span> IDL Search
      </h1>
    </div>
    <div className="flex items-center gap-2">
      <nav className="flex gap-4">
        <Link href="/vault">
          <Button variant="ghost" className="font-light">
            Vault
          </Button>
        </Link>
        <Link href="/mint">
          <Button variant="ghost" className="font-light">
            Mint
          </Button>
        </Link>
        <DevOnly>
          <Link href="/playground">
            <Button variant="ghost" className="font-light">
              Playground
            </Button>
          </Link>
        </DevOnly>
      </nav>
    </div>
  </GlamHeader>
);

const createSchema = z.object({
  idlKey: z.string().min(3, {
    message: "Must be a valid public key.",
  }),
});

type CreateSchema = z.infer<typeof createSchema>;

export default function IDLFetch() {
  const [isLoading, setIsLoading] = useState(false);
  const [idlData, setIdlData] = useState<any>(null);

  const form = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      idlKey: "",
    },
  });

  const [isExpanded, setIsExpanded] = useState(true);

  // Debug function to simulate loading
  const debugLoadIDL = async () => {
    setIsLoading(true);
    setIdlData(null); // Clear previous data while loading
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsLoading(false);
    setIdlData({
      debug: true,
      timestamp: new Date().toISOString(),
      message: "This is debug data to test loading state",
      sampleData: {
        version: "0.1.0",
        name: "sample_program",
        instructions: [
          {
            name: "initialize",
            accounts: [],
            args: [],
          },
        ],
      },
    });
    toast({
      title: "Debug",
      description: "Loaded sample IDL data",
    });
  };

  const onSubmit = async (values: CreateSchema) => {
    setIsLoading(true);
    setIdlData(null); // Clear previous data while loading
    try {
      // Check if it's the debug key
      if (values.idlKey === "debug") {
        await debugLoadIDL();
        return;
      }

      const response = await fetch(
        `https://api.glam.systems/v0/idl?program=${values.idlKey}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch IDL");
      }
      const data = await response.json();
      setIdlData(data);
      setIsExpanded(true); // Set expanded state when new data arrives
      toast({
        title: "Success",
        description: "IDL data fetched successfully.",
      });
    } catch (error) {
      console.error("Error getting IDL:", error);
      toast({
        title: "Error",
        description: "Failed to get IDL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContentWrapper header={header} transition={true}>
      <div className="mx-auto w-4/6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex space-x-4 items-top">
              <FormField
                control={form.control}
                name="idlKey"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>IDL Public Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Search IDL" {...field} />
                    </FormControl>
                    <FormDescription>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() =>
                            form.setValue(
                              "idlKey",
                              "GLAMpLuXu78TA4ao3DPZvT1zQ7woxoQ8ahdYbhnqY9mP"
                            )
                          }
                          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          GLAMpLuXu78TA4ao3DPZvT1zQ7woxoQ8ahdYbhnqY9mP
                        </button>
                      </div>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                variant="default"
                size="icon"
                className="mt-8 min-w-10"
                type="submit"
                disabled={isLoading}
              >
                <MagnifyingGlassIcon
                  className={isLoading ? "animate-spin" : ""}
                />
              </Button>
            </div>
          </form>
        </Form>
        <div className="mt-8">
          {isLoading ? (
            <div className="z-50 flex items-center justify-center mt-48">
              <SparkleBackground
                fadeOut={true}
                rows={6}
                cols={6}
                size={24}
                gap={5}
                fadeInSpeed={0.5}
                fadeOutSpeed={0.5}
                interval={200}
                randomness={0}
                visibleCount={12}
              />
            </div>
          ) : (
            idlData && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {idlData?.metadata?.name
                      ? idlData.metadata.name.toUpperCase() + " IDL"
                      : "IDL DATA"}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        const details = document.querySelectorAll("details");
                        details.forEach((detail) =>
                          detail.setAttribute("open", "")
                        );
                      }}
                    >
                      <LineHeightIcon className="h-4 w-4 mr-2" />
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        const details = document.querySelectorAll("details");
                        details.forEach((detail) =>
                          detail.removeAttribute("open")
                        );
                      }}
                    >
                      <TextAlignMiddleIcon className="h-4 w-4 mr-2" />
                      Collapse All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(idlData, null, 2)
                        );
                        toast({
                          title: "Copied",
                          description: "JSON data copied to clipboard",
                        });
                      }}
                    >
                      <CopyIcon className="h-4 w-4 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ease: "easeInOut", duration: 0.42 }}
                  className="p-4 bg-muted/50 dark:bg-muted/25 overflow-auto max-h-96 font-mono shadow-inner dark:shadow-zinc-950"
                >
                  {(function renderJson(data: any) {
                    if (typeof data !== "object" || data === null) {
                      return <span>{JSON.stringify(data)}</span>;
                    }
                    return (
                      <details open>
                        <summary className="cursor-pointer hover:bg-muted-foreground/10 dark:hover:bg-muted p-1 text-sm text-muted-foreground/50 dark:text-muted-foreground/25">
                          {Array.isArray(data) ? "Array" : "Object"} (
                          {Object.keys(data).length})
                        </summary>
                        <div className="pl-5">
                          {Object.entries(data).map(([key, value]) => (
                            <div key={key} className="my-2">
                              <span className="text-muted-foreground text-sm">
                                {key}:
                              </span>{" "}
                              {typeof value === "object" && value !== null ? (
                                renderJson(value)
                              ) : (
                                <span className="text-primary text-sm font-bold">
                                  {JSON.stringify(value)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  })(idlData)}
                </motion.div>
              </>
            )
          )}
        </div>
      </div>
    </PageContentWrapper>
  );
}
