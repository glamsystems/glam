"use client";

import { useEffect, useState } from "react";
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
import { useGlam } from "@glam/anchor/react";
import { ProductNameGen } from "@/utils/ProductNameGen";
import { UpdateIcon } from "@radix-ui/react-icons";
import PageContentWrapper from "@/components/PageContentWrapper";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { TokenMultiSelect } from "@/components/TokenMultiSelect";
import { ExplorerLink } from "@/components/ExplorerLink";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { parseTxError } from "@/lib/error";

const createSchema = z.object({
  productName: z.string().min(3, {
    message: "Vault name must be at least 3 characters.",
  }),
  assets: z.array(z.string()),
});

type CreateSchema = z.infer<typeof createSchema>;

export default function Create() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { glamClient, userWallet, setActiveGlamState, jupTokenList } =
    useGlam();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const form = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      productName: "",
      assets: [],
    },
  });

  useEffect(() => {
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  }, [form]);

  const onSubmit = async (values: CreateSchema) => {
    if (!userWallet.pubkey) {
      setWalletModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      const glamState = {
        name: values.productName,
        isEnabled: true,
        assets: values.assets.map((address) => new PublicKey(address)),
      };

      const [txId, statePd] = await glamClient.state.createState(glamState);
      const vault = glamClient.getVaultPda(statePd).toBase58();

      // Reset form
      form.reset({
        productName: "",
        assets: [],
      });

      const symbols = values.assets.map((asset) => {
        const jupToken = jupTokenList?.find((t) => t.address === asset);
        return jupToken?.symbol;
      });

      toast({
        title: "Vault successfully created",
        description: (
          <div>
            <p>
              Vault: <ExplorerLink path={`account/${vault}`} label={vault} />
            </p>
            <p>
              Transaction: <ExplorerLink path={`tx/${txId}`} label={txId} />
            </p>
            <p>Assets:</p>
            <pre className="mt-2 text-xs">
              {JSON.stringify(symbols, null, 2)}
            </pre>
          </div>
        ),
      });

      setActiveGlamState({
        address: statePd.toBase58(),
        pubkey: statePd,
        sparkleKey: statePd.toBase58(),
        name: values.productName,
        product: "Vault",
      });
      // Navigate using Next.js router
      router.push("/vault/access");
    } catch (error) {
      toast({
        title: "Error",
        description: parseTxError(error),
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
    form.setValue("assets", []);
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
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Vault Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Vault name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the public vault name.
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
            <div className="flex space-x-4 items-top">
              <FormField
                control={form.control}
                name="assets"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Vault Assets</FormLabel>
                    <FormControl>
                      <TokenMultiSelect
                        selected={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Select the assets allowed in the vault.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex space-x-4 w-full">
              <Button className="w-1/2" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
              <Button className="w-1/2" type="submit" disabled={isLoading}>
                {userWallet.pubkey
                  ? isLoading
                    ? "Creating..."
                    : "Create"
                  : "Connect Wallet"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContentWrapper>
  );
}
