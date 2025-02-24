import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import DynamicForm from "@/components/DynamicForm";
import schema from "@/data/glamFormSchema.json";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  CompanyModel,
  StateModel,
  FundOpenfundsModel,
  ManagerModel,
  MintClassOpenfundsModel,
  useGlam,
} from "@glamsystems/glam-sdk/react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type TemplateKey = "Openfunds" | "Basic";
type StepKey = 0 | 1 | 2 | 3 | 4;

const basicInfoFormSchema = z.object({
  name: z.string().max(100, {
    message: "Share class name must be no more than 100 characters.",
  }),
  symbol: z.string().max(10, {
    message: "Share class symbol must be no more than 10 characters.",
  }),
  decimals: z.number().min(6).max(9, {
    message: "Decimals must be between 6 and 9.",
  }),
});
type BasicInfoFormSchema = z.infer<typeof basicInfoFormSchema>;

const policyFormSchema = z.object({
  lockUp: z.number(),
  permanentDelegate: z.string().optional(),
  defaultAccountStateFrozen: z.boolean(),
});
type PolicyFormSchema = z.infer<typeof policyFormSchema>;

const TOTAL_STEPS = {
  OPENFUNDS: 5,
  BASIC: 4,
};

interface SchemaField {
  type: string;
  title?: string;
  description?: string;
  fields?: Record<string, SchemaField>;
  "x-id"?: string;
  "x-tag"?: string;
  "x-component"?: string;
  "x-order"?: number;
  "x-hidden"?: boolean;
  "x-enforced"?: boolean;
  minLength?: number;
  maxLength?: number;
  [key: string]: any;
}

interface SchemaGroup {
  type: string;
  fields: Record<string, SchemaField>;
}

interface ReviewStepProps {
  selectedTemplate: TemplateKey;
  basicInfoFormData: BasicInfoFormSchema;
  policyFormData: PolicyFormSchema;
  openfundsData: Record<string, Record<string, any>>;
}

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateKey>("Basic");

  const [basicInfoFormData, setBasicInfoFormData] = useState({
    name: "",
    symbol: "",
    decimals: 9,
  });
  const [policyFormData, setPolicyFormData] = useState({
    lockUp: 0,
    permanentDelegate: "",
    defaultAccountStateFrozen: true,
  });

  const [openfundsData, setOpenfundsData] = useState<Record<string, any>>({
    company: {},
    fund: {},
    fundManager: {},
    shareClass: {},
  });
  const { glamClient, setActiveGlamState } = useGlam();

  const totalSteps =
    selectedTemplate === "Basic" ? TOTAL_STEPS.BASIC : TOTAL_STEPS.OPENFUNDS;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleSubmit = async () => {
    console.log("Form submitted!", {
      selectedTemplate,
      basicInfoFormData,
      openfundsData,
    });

    const glamState = {
      accountType: { mint: {} },
      name: basicInfoFormData.name,
      enabled: true,
      rawOpenfunds: {
        fundDomicileAlpha2: openfundsData.fund.fundDomicileAlpha2,
      },
      company: {
        fundGroupName: openfundsData.company.fundGroupName,
      },
      owner: {
        portfolioManagerName: null,
        pubkey: glamClient.getSigner(),
        kind: { wallet: {} },
      },
      mints: [
        {
          name: basicInfoFormData.name,
          symbol: basicInfoFormData.symbol,
          asset: new PublicKey(0),
          lockUpPeriodInSeconds: policyFormData.lockUp * 3600,
          permanentDelegate: policyFormData.permanentDelegate
            ? new PublicKey(policyFormData.permanentDelegate)
            : new PublicKey(0),
          defaultAccountStateFrozen: policyFormData.defaultAccountStateFrozen,
          isRawOpenfunds: true,
          // rawOpenfunds: {
          //   isin: openfundsData.shareClass.iSIN,
          //   shareClassCurrency: openfundsData.shareClass.shareClassCurrency,
          // },
        },
      ],
    } as Partial<StateModel>;

    try {
      const [txSig, statePda] = await glamClient.state.createState(
        glamState,
        true,
      );
      setActiveGlamState({
        address: statePda.toBase58(),
        pubkey: statePda,
        owner: glamClient.getSigner(),
        sparkleKey: statePda.toBase58(),
        name: basicInfoFormData.name,
        product: "Mint",
      });
      toast({
        title: "Mint created successfully",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (error) {
      toast({
        title: "Failed to create mint",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
  };

  const handleBasicInfoInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setBasicInfoFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDefaultAccountStateChange = (defaultFrozen: boolean) => {
    setPolicyFormData((prev) => ({
      ...prev,
      defaultAccountStateFrozen: defaultFrozen,
    }));
  };

  const handlePolicyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPolicyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenfundsChange = (data: Record<string, any>) => {
    // Create a new object to store grouped data
    const groupedData: Record<string, any> = {
      company: {},
      fund: {},
      fundManager: {},
      shareClass: {},
    };

    // Type guard to check if a group has fields
    const isSchemaGroup = (value: any): value is SchemaGroup => {
      return value && typeof value === "object" && "fields" in value;
    };

    // Iterate through the schema groups to properly organize the data
    Object.keys(groupedData).forEach((group) => {
      const schemaGroup = schema[group as keyof typeof schema];
      if (isSchemaGroup(schemaGroup)) {
        Object.keys(schemaGroup.fields).forEach((fieldKey) => {
          if (data[fieldKey] !== undefined) {
            groupedData[group][fieldKey] = data[fieldKey];
          }
        });
      }
    });

    setOpenfundsData(groupedData);
  };

  const templateSelectionStep = (
    <TemplateSelection
      selectedTemplate={selectedTemplate}
      setSelectedTemplate={setSelectedTemplate}
    />
  );
  const basicInfoStep = (
    <BasicInfoForm
      formData={basicInfoFormData}
      handleInputChange={handleBasicInfoInputChange}
    />
  );
  const policyStep = (
    <PolicyForm
      formData={policyFormData}
      handleInputChange={handlePolicyInputChange}
      handleDefaultAccountStateChange={handleDefaultAccountStateChange}
    />
  );
  const reviewStep = (
    <ReviewStep
      selectedTemplate={selectedTemplate}
      basicInfoFormData={basicInfoFormData}
      policyFormData={policyFormData}
      openfundsData={openfundsData}
    />
  );
  const templateStepsMap: Record<TemplateKey, Record<StepKey, JSX.Element>> = {
    Openfunds: {
      0: templateSelectionStep,
      1: basicInfoStep,
      2: (
        <OpenfundsForm
          openfundsData={openfundsData}
          onChange={handleOpenfundsChange}
        />
      ),
      3: policyStep,
      4: reviewStep,
    },
    Basic: {
      0: templateSelectionStep,
      1: basicInfoStep,
      2: policyStep,
      3: reviewStep,
      4: <></>,
    },
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-background">
      <Progress value={progress} className="mb-6 rounded-none" />
      <div className="mt-6 space-y-6">
        {/* Dynamically render the form based on the current step and selected template */}
        {currentStep >= 0 &&
          currentStep <= 4 &&
          templateStepsMap[selectedTemplate][currentStep as StepKey]}
      </div>
      <div className="flex justify-between mt-6">
        <Button
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0}
          variant="outline"
        >
          Back
        </Button>
        {progress === 100 ? (
          <Button onClick={handleSubmit}>Submit</Button>
        ) : (
          <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
}

function TemplateSelection({
  selectedTemplate,
  setSelectedTemplate,
}: {
  selectedTemplate: string;
  setSelectedTemplate: (template: TemplateKey) => void;
}) {
  const templates = [
    {
      id: "Basic",
      title: "Basic",
      description: "Default Token 2022 Mint",
      url: "",
    },
    {
      id: "Openfunds",
      title: "Openfunds",
      description: "Open Content Fund Data Standard",
      url: "https://openfunds.org/",
    },
  ];

  return (
    <div>
      <h2 className="text-xl mb-6 text-muted-foreground font-extralight">
        Select a Template
      </h2>
      <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template.id}>
              <RadioGroupItem
                value={template.id}
                id={template.id}
                className="peer sr-only cursor-pointer"
              />
              <Label
                htmlFor={template.id}
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <h3 className="text-lg font-semibold">{template.title}</h3>
                {template.url ? (
                  <Link
                    href={template.url}
                    target="_blank"
                    className="text-sm text-muted-foreground hover:underline hover:text-foreground transition-all font-light"
                  >
                    {template.description}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground font-light">
                    {template.description}
                  </p>
                )}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}

function BasicInfoForm({
  formData,
  handleInputChange,
}: {
  formData: BasicInfoFormSchema;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const form = useForm<BasicInfoFormSchema>({
    resolver: zodResolver(basicInfoFormSchema),
    defaultValues: formData,
  });

  return (
    <div>
      <h2 className="text-xl mb-6 text-muted-foreground font-extralight">
        Basic Information
      </h2>
      <Form {...form}>
        <form className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={async (e) => {
                      field.onChange(e);
                      handleInputChange(e);
                      await form.trigger("name");
                    }}
                  />
                </FormControl>
                <FormMessage className="text-gray-500">
                  Share class name
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">Symbol</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={async (e) => {
                      e.target.value;
                      field.onChange(e);
                      handleInputChange(e);
                      await form.trigger("symbol");
                    }}
                  />
                </FormControl>
                <FormMessage className="text-gray-500">
                  Share class symbol
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="decimals"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">Decimals</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={async (e) => {
                      field.onChange(e);
                      handleInputChange(e);
                    }}
                    disabled // FIXME: support other decimals
                  />
                </FormControl>
                <FormMessage className="text-gray-500">
                  Share class decimals (9 is recommended)
                </FormMessage>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

function OpenfundsForm({
  openfundsData,
  onChange,
}: {
  openfundsData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}) {
  // Flatten the openfundsData for the DynamicForm
  const flattenedData = Object.entries(openfundsData).reduce(
    (acc, [group, fields]) => {
      return { ...acc, ...fields };
    },
    {},
  );

  return (
    <div>
      <h2 className="text-xl mb-6 text-muted-foreground font-extralight">
        Openfunds Details
      </h2>
      <DynamicForm
        schema={schema}
        isNested={true}
        groups={["company", "fund", "fundManager", "shareClass"]}
        filters={{
          tags: ["essential"],
        }}
        columns={2}
        showSubmitButton={false}
        onChange={onChange}
        defaultValues={flattenedData}
      />
    </div>
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
        Policy
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

function ReviewStep({
  selectedTemplate,
  basicInfoFormData,
  policyFormData,
  openfundsData,
}: ReviewStepProps) {
  return (
    <div className="grid gap-3 text-sm">
      <h2 className="text-xl mb-6 text-muted-foreground font-extralight">
        Review
      </h2>
      <ul className="grid gap-3">
        {/* Basic info of the share class */}
        {[
          ["Template", selectedTemplate],
          ["Name", basicInfoFormData.name],
          ["Symbol", basicInfoFormData.symbol],
          ["Decimals", basicInfoFormData.decimals],
        ].map(([label, value]) => (
          <li
            key={label}
            className="border-b pb-3 flex items-center justify-between"
          >
            <span className="text-muted-foreground flex items-center">
              {label}
            </span>
            <span>
              <p className="font-semibold">{value || "N/A"}</p>
            </span>
          </li>
        ))}

        {selectedTemplate === "Openfunds" &&
          Object.entries(openfundsData).map(([group, fields]) =>
            Object.entries(fields as Record<string, any>).map(
              ([field, value]) => (
                <li
                  key={`${group}-${field}`}
                  className="border-b pb-3 flex items-center justify-between"
                >
                  <span className="text-muted-foreground flex items-center">
                    {(schema[group as keyof typeof schema] as SchemaGroup)
                      ?.fields[field]?.title || field}
                  </span>
                  <span>
                    <p className="font-semibold">
                      {value !== null && value !== undefined
                        ? String(value)
                        : "N/A"}
                    </p>
                  </span>
                </li>
              ),
            ),
          )}

        {[
          ["Lock-Up Period (hours)", policyFormData.lockUp],
          ["Permanent Delegate", policyFormData.permanentDelegate || "N/A"],
          [
            "Default Account State",
            policyFormData.defaultAccountStateFrozen ? "Frozen" : "Active",
          ],
        ].map(([label, value]) => (
          <li
            key={label}
            className="border-b pb-3 flex items-center justify-between"
          >
            <span className="text-muted-foreground flex items-center">
              {label}
            </span>
            <span>
              <p className="font-semibold">{value}</p>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
