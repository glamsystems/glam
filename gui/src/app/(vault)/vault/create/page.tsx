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
import { useGlam } from "@glamsystems/glam-sdk/react";
import { ProductNameGen } from "@/utils/ProductNameGen";
import { UpdateIcon } from "@radix-ui/react-icons";
import PageContentWrapper from "@/components/PageContentWrapper";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { IntegrationMultiSelect } from "@/components/IntegrationMultiSelect";
import { ExplorerLink } from "@/components/ExplorerLink";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { parseTxError } from "@/lib/error";

const createSchema = z.object({
  productName: z.string().min(3, {
    message: "Vault name must be at least 3 characters.",
  }),
  integrations: z.array(z.string()),
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
      integrations: [],
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
        accountType: { vault: {} },
        name: values.productName,
        enabled: true,
        integrations: values.integrations.map((name) => {
          switch (name) {
            case "Drift":
              return { drift: {} };
            case "SplStakePool":
              return { splStakePool: {} };
            case "SanctumStakePool":
              return { sanctumStakePool: {} };
            case "NativeStaking":
              return { nativeStaking: {} };
            case "Marinade":
              return { marinade: {} };
            case "JupiterSwap":
              return { jupiterSwap: {} };
            case "JupiterVote":
              return { jupiterVote: {} };
            case "KaminoLending":
              return { kaminoLending: {} };
            default:
              throw new Error(`Unknown integration: ${name}`);
          }
        }),
      };

      const [txId, statePd] = await glamClient.state.createState(glamState);
      const vault = glamClient.getVaultPda(statePd).toBase58();

      // Reset form
      form.reset({
        productName: "",
        integrations: [],
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
            <p>Integrations:</p>
            <pre className="mt-2 text-xs">
              {values.integrations.join(", ")}
            </pre>
          </div>
        ),
      });

      setActiveGlamState({
        address: statePd.toBase58(),
        pubkey: statePd,
        owner: glamClient.getSigner(),
        sparkleKey: statePd.toBase58(),
        name: values.productName,
        product: "Vault",
      });

      // Navigate using Next.js router
      router.push("/vault/holdings");
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
    form.setValue("integrations", []);
  };

  const handleRefresh = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const generatedName = ProductNameGen();
    form.setValue("productName", generatedName);
  };

  return (
    <PageContentWrapper>
      <div className="w-full xl:w-2/3 self-center">
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
            <div className="mt-8">
              <FormField
                control={form.control}
                name="integrations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Integrations</FormLabel>
                    <FormControl>
                      <IntegrationMultiSelect
                        selected={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Select the integrations you want to enable for your vault.
                      This can be changed later.
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
