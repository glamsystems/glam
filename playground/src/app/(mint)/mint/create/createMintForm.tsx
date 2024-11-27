import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import DynamicForm from "@/components/DynamicForm";
import schema from "@/data/glamFormSchema.json";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useGlam } from "@glam/anchor/react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";

const TOTAL_STEPS = {
  OPENFUNDS: 4,
  BASIC: 3,
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
  selectedTemplate: string | null;
  formData: {
    name?: string;
    email?: string;
    [key: string]: any;
  };
  openfundsData: Record<string, Record<string, any>>;
}

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [openfundsData, setOpenfundsData] = useState<Record<string, any>>({
    company: {},
    fund: {},
    fundManager: {},
    shareClass: {},
  });
  const { glamClient, setActiveFund } = useGlam();

  const totalSteps =
    selectedTemplate === "Basic" ? TOTAL_STEPS.BASIC : TOTAL_STEPS.OPENFUNDS;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS.OPENFUNDS - 1) {
      if (selectedTemplate === "Basic" && currentStep === 1) {
        setCurrentStep(3);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      if (selectedTemplate === "Basic" && currentStep === 3) {
        setCurrentStep(1);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleSubmit = async () => {
    console.log("Form submitted!", {
      selectedTemplate,
      formData,
      openfundsData,
    });

    try {
      const fundData = {
        name: openfundsData.fund.legalFundNameIncludingUmbrella,
        isEnabled: true,
        fundDomicileAlpha2: openfundsData.fund.fundDomicileAlpha2,
        integrationAcls: [{ name: { mint: {} }, features: [] }],
        company: {
          fundGroupName: openfundsData.company.fundGroupName,
          manCo: openfundsData.company.fundGroupName,
          emailAddressOfManCo: formData.email,
        },
        manager: { portfolioManagerName: formData.name },
        shareClasses: [
          {
            name: openfundsData.fund.legalFundNameIncludingUmbrella,
            symbol: openfundsData.shareClass.shareClassSymbol,
            permanentDelegate: new PublicKey(0),
            defaultAccountStateFrozen: true,
            isin: openfundsData.shareClass.iSIN,
            shareClassCurrency: openfundsData.shareClass.shareClassCurrency,
          },
        ],
      };
      const [txSig, fundPDA] = await glamClient.createFund(fundData, true);
      setActiveFund({
        address: fundPDA.toBase58(),
        pubkey: fundPDA,
        imageKey: fundPDA.toBase58(),
        name: openfundsData.fund.legalFundNameIncludingUmbrella,
      });
      toast({
        title: "Fund created successfully",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (error) {
      toast({
        title: "Failed to create fund",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Updated handleOpenfundsChange to properly structure the data
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

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-background">
      <Progress value={progress} className="mb-6 rounded-none" />
      <div className="mt-6 space-y-6">
        {currentStep === 0 && (
          <TemplateSelection
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
          />
        )}
        {currentStep === 1 && (
          <DetailForm
            formData={formData}
            handleInputChange={handleInputChange}
          />
        )}
        {currentStep === 2 && selectedTemplate === "Openfunds" && (
          <OpenfundsForm
            openfundsData={openfundsData}
            onChange={handleOpenfundsChange}
          />
        )}
        {currentStep === 3 && (
          <ReviewStep
            selectedTemplate={selectedTemplate}
            formData={formData}
            openfundsData={openfundsData}
          />
        )}
      </div>
      <div className="flex justify-between mt-6">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
        >
          Back
        </Button>
        {currentStep === TOTAL_STEPS.OPENFUNDS - 1 ? (
          <Button onClick={handleSubmit}>Submit</Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={currentStep === 0 && !selectedTemplate}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

function TemplateSelection({
  selectedTemplate,
  setSelectedTemplate,
}: {
  selectedTemplate: string | null;
  setSelectedTemplate: (template: string) => void;
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
      <RadioGroup
        value={selectedTemplate || ""}
        onValueChange={setSelectedTemplate}
      >
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

function DetailForm({
  formData,
  handleInputChange,
}: {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const form = useForm({
    defaultValues: {
      name: formData.name,
      email: formData.email,
    },
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
                    onChange={(e) => {
                      field.onChange(e);
                      handleInputChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-gray-500">
                  Please enter your name.
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    onChange={(e) => {
                      field.onChange(e);
                      handleInputChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-gray-500">
                  Please enter your email address.
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
    {}
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
          tags: ["essential", "glam"],
        }}
        columns={2}
        showSubmitButton={false}
        onChange={onChange}
        defaultValues={flattenedData}
      />
    </div>
  );
}

function ReviewStep({
  selectedTemplate,
  formData,
  openfundsData,
}: ReviewStepProps) {
  return (
    <TooltipProvider>
      <div className="grid gap-3 text-sm">
        <h2 className="text-xl mb-6 text-muted-foreground font-extralight">
          Review
        </h2>
        <ul className="grid gap-3">
          <li className="border-b pb-3 flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              Template
            </span>
            <span>
              <p className="font-semibold">{selectedTemplate || "N/A"}</p>
            </span>
          </li>

          <li className="border-b pb-3 flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              Name
            </span>
            <span>
              <p className="font-semibold">{formData.name || "N/A"}</p>
            </span>
          </li>

          <li className="border-b pb-3 flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              Email
            </span>
            <span>
              <p className="font-semibold">{formData.email || "N/A"}</p>
            </span>
          </li>

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
                )
              )
            )}
        </ul>
      </div>
    </TooltipProvider>
  );
}
