"use client";

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
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useGlam, MSOL, WSOL } from "@glam/anchor/react";
import { ProductNameGen } from "@/utils/ProductNameGen";
import { UpdateIcon } from "@radix-ui/react-icons";
import PageContentWrapper from "@/components/PageContentWrapper";
import { PublicKey } from "@solana/web3.js";
import { MultiSelect } from "@/components/ui/multiple-select";

const createSchema = z.object({
  productName: z.string().min(3, {
    message: "Vault name must be at least 3 characters.",
  }),
});

const options = [
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "typescript", label: "TypeScript" },
  { value: "nodejs", label: "Node.js" },
  { value: "tailwindcss", label: "Tailwind CSS" },
  { value: "prisma", label: "Prisma" },
  { value: "mongodb", label: "MongoDB" },
  { value: "graphql", label: "GraphQL" },
  { value: "docker", label: "Docker" },
  { value: "aws", label: "AWS" },
  // Frontend Frameworks & Libraries
  { value: "vuejs", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "preact", label: "Preact" },
  { value: "solidjs", label: "SolidJS" },
  // Backend Technologies
  { value: "express", label: "Express.js" },
  { value: "nestjs", label: "NestJS" },
  { value: "fastify", label: "Fastify" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  // Databases
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "redis", label: "Redis" },
  { value: "elasticsearch", label: "Elasticsearch" },
  { value: "cassandra", label: "Cassandra" },
  // Cloud & DevOps
  { value: "gcp", label: "Google Cloud Platform" },
  { value: "azure", label: "Microsoft Azure" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "terraform", label: "Terraform" },
  { value: "jenkins", label: "Jenkins" },
  // Testing
  { value: "jest", label: "Jest" },
  { value: "cypress", label: "Cypress" },
  { value: "playwright", label: "Playwright" },
  { value: "selenium", label: "Selenium" },
  { value: "mocha", label: "Mocha" },
  // State Management
  { value: "redux", label: "Redux" },
  { value: "mobx", label: "MobX" },
  { value: "zustand", label: "Zustand" },
  { value: "recoil", label: "Recoil" },
  { value: "jotai", label: "Jotai" },
  // Build Tools
  { value: "webpack", label: "Webpack" },
  { value: "vite", label: "Vite" },
  { value: "rollup", label: "Rollup" },
  { value: "parcel", label: "Parcel" },
  { value: "esbuild", label: "esbuild" },
  // CSS Tools
  { value: "sass", label: "Sass" },
  { value: "styledcomponents", label: "Styled Components" },
  { value: "emotion", label: "Emotion" },
  { value: "cssmodules", label: "CSS Modules" },
  { value: "windicss", label: "Windi CSS" },
  // Mobile Development
  { value: "reactnative", label: "React Native" },
  { value: "flutter", label: "Flutter" },
  { value: "ionic", label: "Ionic" },
  { value: "capacitor", label: "Capacitor" },
  { value: "cordova", label: "Cordova" },
  // Authentication & Security
  { value: "auth0", label: "Auth0" },
  { value: "firebase", label: "Firebase" },
  { value: "supabase", label: "Supabase" },
  { value: "passport", label: "Passport.js" },
  { value: "jwt", label: "JSON Web Tokens" },
];

type CreateSchema = z.infer<typeof createSchema>;

export default function Create() {
  const [isLoading, setIsLoading] = useState(false);
  const { glamClient } = useGlam();
  const form = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      productName: "",
    },
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  }, [form]);

  const onSubmit = async (values: CreateSchema) => {
    setIsLoading(true);
    try {
      const fund = {
        name: values.productName,
        shareClasses: [],
        isEnabled: true,
        // fundDomicileAlpha2: "XS",
        // legalFundNameIncludingUmbrella: values.productName,
        // fundLaunchDate: new Date().toISOString().split("T")[0],
        // investmentObjective: "Internal Testing",
        // fundCurrency: "SOL",
        // openEndedOrClosedEndedFundStructure: "open-ended fund",
        // fiscalYearEnd: "12-31",
        // legalForm: "other",
        // company: {
        //   fundGroupName: "GLAM GUI",
        //   manCo: "GLAM GUI",
        //   domicileOfManCo: "CH",
        //   emailAddressOfManCo: "build@glam.systems",
        //   fundWebsiteOfManCo: "https://glam.systems",
        // },
        // manager: {
        //   portfolioManagerName: "GLAM",
        // },
      };

      const [txId, fundPDA] = await glamClient.fund.createFund(fund);

      toast({
        title: "Vault created",
        description: (
          <div>
            <p>Fund PDA: {fundPDA.toBase58()}</p>
            <p>Transaction ID: {txId}</p>
          </div>
        ),
      });
    } catch (error) {
      console.error("Error creating vault:", error);
      toast({
        title: "Error",
        description: "Failed to create vault. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  };

  const handleRefresh = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  };

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex space-x-4 items-top">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (<FormItem className="w-full">
                    <FormLabel>Vault Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Vault name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the public vault name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>)}
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
            <div className="flex space-x-4 items-top">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (<FormItem className="w-full">
                    <FormLabel>Vault Assets</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={options}
                        onChange={setSelectedItems}
                        placeholder="Select assets..."
                      />
                    </FormControl>
                    <FormDescription>
                      Select the assets allowed in the vault.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>)}
              />
            </div>



            <div className="flex space-x-4 w-full">
              <Button className="w-1/2" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
              <Button className="w-1/2" type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContentWrapper>);
}
