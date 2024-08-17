"use client"
import { EffectiveTheme } from "@/utils/EffectiveTheme";
import * as React from "react"
import {
  CaretSortIcon, CheckIcon, ChevronDownIcon, PlusCircledIcon, PlusIcon, UpdateIcon
} from "@radix-ui/react-icons";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { ProductNameGen } from "@/utils/ProductNameGen";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import Sparkle from "@/utils/Sparkle";
import TruncateAddress from "@/utils/TruncateAddress";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const groups = [
  {
    label: "Connected Account",
    products: [
      {
        label: "",
        value: "n4kanVyNMyuptVkZUrxvcZ4tofqcEMVPGPB6xoWWeDY",
      },
    ],
  },
  {
    label: "Products",
    products: [
      {
        label: "SpaciousSchnorrSafe",
        value: "GLAM9W754xTYpKsgZgRJ3yiyQgkpa4Zei1f6VVWohvjr",
      },
      {
        label: "YummyTestVehicle",
        value: "GLAM29gaAdXMPPxyKqGtQhyTViQzWDhiNwDSsbZPbLWz",
      },
      {
        label: "TopGammaBag",
        value: "GLAM8NJQt5bpHPqLnF4VPHKR2vnjEunfKewMEBR4eTnT",
      },
    ],
  },
]

type Product = (typeof groups)[number]["products"][number]

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface ProductSwitcherProps extends PopoverTriggerProps {}

const createSchema = z.object({
  productName: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
});

type CreateSchema = z.infer<typeof createSchema>;

export default function ProductSwitcher({ className }: ProductSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [showNewProductDialog, setShowNewProductDialog] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product>(
    groups[0].products[0]
  );

  const form = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      productName: "",
    },
  });

  useEffect(() => {
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  }, [form]);

  const onSubmit: SubmitHandler<CreateSchema> = async (values, event) => {
    const nativeEvent = event as unknown as React.BaseSyntheticEvent & {
      nativeEvent: { submitter: HTMLElement };
    };

    if (nativeEvent?.nativeEvent.submitter?.getAttribute("type") === "submit") {
      console.log("Create product");
      const updatedValues = {
        ...values,
      };

      toast({
        title: "Product Created",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-zinc-900 p-4">
            <code className="text-white">
              {JSON.stringify(values, null, 2)}
            </code>
          </pre>
        ),
      });
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
    <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select an account"
            className={cn("w-full pl-2", className)}
          >
            <span className="mr-2"><Sparkle address={selectedProduct.value} size={24}/></span>
            <span className="mr-2 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
    {selectedProduct ? (
      selectedProduct.label ? (
        <span>{selectedProduct.label}</span>
      ) : (
        <TruncateAddress address={selectedProduct.value} />
      )
    ) : null}
  </span>
            <ChevronDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {/*<CommandInput placeholder="Search product..." />*/}
            <CommandList>
              <CommandEmpty>No product found.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.products.map((product) => (
                    <CommandItem
                      key={product.value}
                      onSelect={() => {
                        setSelectedProduct(product);
                        setOpen(false);
                      }}
                      className="text-sm"
                    >
                      <span className="mr-2"><Sparkle address={product.value} size={24}/></span>
                      {product ? (
                        product.label ? (
                          <p className="text-ellipsis mr-4">{product.label}</p>
                        ) : (
                          <TruncateAddress address={product.value} />
                        )
                      ) : null}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedProduct.value === product.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <WalletMultiButton style={{}} />
            {/*<CommandList>*/}
            {/*  <CommandGroup>*/}
            {/*    <DialogTrigger asChild>*/}
            {/*      <CommandItem*/}
            {/*        onSelect={() => {*/}
            {/*          setOpen(false);*/}
            {/*          setShowNewProductDialog(true);*/}
            {/*        }}*/}
            {/*      >*/}
            {/*        <PlusIcon className="mr-2 h-4 w-5" />*/}
            {/*        Create Product*/}
            {/*      </CommandItem>*/}
            {/*    </DialogTrigger>*/}
            {/*  </CommandGroup>*/}
            {/*</CommandList>*/}
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create product</DialogTitle>
          {/*<DialogDescription>Create a new product.</DialogDescription>*/}
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 w-full"
          >
            <div className="flex space-x-4 items-top">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the public product name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
          </form>
        </Form>
        <DialogFooter>
          <div className="flex space-x-4 w-full">
            <Button className="w-1/2" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
            <Button className="w-1/2" type="submit">
              Create
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
