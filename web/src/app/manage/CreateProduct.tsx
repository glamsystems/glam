import { ArrowDown, ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ProgressIndicator, ProgressStep } from "@carbon/react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import { Assets } from "./Assets";
import { BasicInformation } from "./BasicInformation";
import { Policies } from "./Policies";
import { PublicKey } from "@solana/web3.js";
import ReviewForm from "./ReviewForm";
import { ShareClasses } from "./ShareClasses";
import { Strategies } from "./Strategies";
import { countryList } from "../data/countryList";
import { tokenList } from "../data/tokenList";
import { useGlamProgram } from "../glam/glam-data-access";
import { useWallet } from "@solana/wallet-adapter-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z.object({
  // ------ Fund ------
  fundName: z.string().min(3),
  fundSymbol: z.string().min(2),
  website: z.string().optional().or(z.literal("")),
  managerID: z.string().min(32).max(44),
  openEndedStructure: z.enum(["Open Ended Fund", "Closed Ended Fund"]),
  investmentObjective: z.string().min(10),
  fundAsset: z.enum(
    tokenList.map((token) => token.symbol) as [string, ...string[]]
  ),
  fundAssetID: z.string().min(32).max(44),
  countryAlpha2: z.enum(
    countryList.map((country) => country.code_alpha_2) as [string, ...string[]]
  ),
  countryAlpha3: z.enum(
    countryList.map((country) => country.code_alpha_3) as [string, ...string[]]
  ),
  // must be greater than or equal to today's date
  launchDate: z.string().optional().or(z.literal("")),
  fiscalYearEnd: z
    .string()
    .length(5)
    .refine((date) => +date.split("/")[0] <= 12 && +date.split("/")[1] <= 31, {
      message: "Invalid date"
    }),
  isFoF: z.boolean().optional().or(z.literal("")),
  isPassiveFund: z.boolean().optional().or(z.literal("")),
  // ------ Share Class ------
  fullShareClassName: z.string().optional().or(z.literal("")),
  shareClassSymbol: z.string().optional().or(z.literal("")),
  shareClassAsset: z.enum(
    tokenList.map((token) => token.symbol) as [string, ...string[]]
  ),
  shareClassAssetID: z.string().min(32).max(44),
  ISIN: z.string().optional().or(z.literal("")),
  investmentStatus: z.enum(["Open"]),
  managementFee: z.string().optional().or(z.literal("")),
  performanceFee: z.string().optional().or(z.literal("")),
  policyDistribution: z.enum([
    "Accumulating",
    "Accumulating & Distributing",
    "Distributing"
  ]),
  extension: z.enum(["A", "B", "C", "D", "E", "1", "2", "3", "4", "5"]),
  shareClassLaunchDate: z.string().optional().or(z.literal("")),
  shareClassLifecycle: z.enum([
    "Projected",
    "To Be Launched",
    "Offering Period",
    "Active"
  ]),
  // ------ Policies ------
  lockupPeriod: z.number(), // (Transfer Hook)
  // required only if lockupPeriod > 0
  lockupPeriodUnits: z
    .enum([
      "seconds",
      "minutes",
      "hours",
      "days",
      "weeks",
      "months",
      "quarters",
      "years"
    ])
    .optional(),
  nonTransferable: z.boolean(),
  transferFees: z.number().min(0).max(100),
  // optional criteria
  permanentDelegate: z.string().min(32).max(44).optional().or(z.literal("")),
  redemptions: z.enum(["Share Class Asset", "In-Kind", "Both"]),
  // ------ Assets ------
  assets: z.array(z.string()),
  // ------ Strategy ------
  counterParties: z.array(z.string()).optional(),
  traderIdDrift: z.string().min(32).max(44).optional().or(z.literal(""))
});

export type FormFields = z.infer<typeof FormSchema>;

export const CreateProduct = () => {
  const wallet = useWallet();

  const [disabeld, setDisabled] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { initialize } = useGlamProgram();

  const errorStyle = {
    color: "red",
    fontSize: "14px"
  };

  const strategies = [
    { id: "Drift", name: "Drift" },
    { id: "Backpack", name: "Backpack" },
    { id: "Orca", name: "Orca" },
    { id: "Jupiter", name: "Jupiter" }
  ];

  const steps = [
    {
      id: 0,
      label: "Basic Information",
      fields: [
        "fundName",
        "fundSymbol",
        "investmentObjective",
        "fundAsset",
        "countryAlpha2",
        "countryAlpha3"
      ]
    },
    {
      id: 1,
      label: "Share Classes",
      fields: ["shareClassAsset"]
    },
    {
      id: 2,
      label: "Policies",
      fields: [
        "lockupPeriod",
        "lockupPeriodUnits",
        "transferFees",
        "permanentDelegate",
        "nonTransferable",
        "redemptions"
      ]
    },
    {
      id: 3,
      label: "Assets",
      fields: ["assets"]
    },
    {
      id: 4,
      label: "Strategy",
      fields: ["counterParties", "traderIdDrift"]
    },
    {
      id: 5,
      label: "Review",
      fields: []
    }
  ];

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormFields>({
    defaultValues: {
      fundName: "",
      fundSymbol: "",
      website: "",
      managerID: "",
      openEndedStructure: "Open Ended Fund",
      investmentObjective: "",
      fundAsset: "",
      fundAssetID: "",
      countryAlpha2: "",
      countryAlpha3: "",
      // today's date
      launchDate: new Date().toISOString().split("T")[0],
      fiscalYearEnd: "12/31",
      isFoF: false,
      isPassiveFund: false,
      fullShareClassName: "",
      shareClassSymbol: "",
      shareClassAsset: "",
      shareClassAssetID: "",
      ISIN: "",
      investmentStatus: "Open",
      managementFee: "0",
      performanceFee: "0",
      policyDistribution: "Accumulating",
      extension: "A",
      shareClassLaunchDate: new Date().toISOString().split("T")[0],
      shareClassLifecycle: "Active",
      nonTransferable: false,
      transferFees: Number(0),
      lockupPeriod: Number(0),
      lockupPeriodUnits: "days"
    },
    resolver: zodResolver(FormSchema)
  });

  const fundname = watch("fundName");
  const assets = watch("assets");

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    console.log("Submit function has been called.");
    try {
      console.log("Form Data Received: ", data);
      if (!wallet.publicKey) {
        // user needs to connect wallet
        alert("Please connect your wallet.");
        return;
      }
      const assetsLen = assets.length;
      const assetsPercentage = 10_000 / assetsLen;
      let assetsStructure = assets.map( (a, i) => (i==0 ? 0 : assetsPercentage) );
      initialize.mutate(
        {
          fundName: data.fundName,
          fundSymbol: data.fundSymbol,
          assets,
          assetsStructure,
          manager: wallet.publicKey,
          shareClassMetadata: {
            name: data.fundName, //FIXME
            symbol: data.fundSymbol, //FIXME
            shareClassAsset: data.shareClassAsset,
            shareClassAssetId: new PublicKey(data.shareClassAssetID),
            isin: "XS1082172823",
            status: data.investmentStatus.toLowerCase(), // open
            feeManagement: +(data.managementFee ?? 0),
            feePerformance: +(data.performanceFee ?? 0),
            policyDistribution: data.policyDistribution.toLowerCase(),
            extension: data.extension,
            launchDate: new Date().toISOString().split("T")[0],
            lifecycle: data.shareClassLifecycle.toLowerCase(),
            // these will be updated by initialize
            uri: "",
            imageUri: "",
          }
        },
        {
          onSuccess: () => {
            console.log("Success");
          },
          onError: (error) => {
            console.error(error);
            setError("root", {
              message: "An error occurred. Please try again later."
            });
          }
        }
      );
    } catch (error) {
      console.error(error);
      setError("root", {
        message: "An error occurred. Please try again later."
      });
    }
  };

  useEffect(() => {
    console.log("Wallet: ", wallet);
    if (wallet.publicKey) {
      setValue("managerID", wallet.publicKey.toBase58());
    }
  }, [wallet]);

  return (
    <div className="w-full  h-full flex flex-col">
      <div className="flex flex-col w-full max-w-[1500px]  self-center h-full mt-[100px]">
        <h1 className="text-[42px]">Create Product</h1>
        <div className="flex justify-between mt-[50px] gap-[100px] h-full max-h-[70vh]">
          <ProgressIndicator
            vertical
            currentIndex={currentIndex}
            className="max-w-[200px] w-full"
          >
            <ProgressStep label="Basic Information" description="Label" />
            <ProgressStep label="Share Classes" description="Label" />
            <ProgressStep label="Policies" description="Label" />
            <ProgressStep label="Assets" description="Label" />
            <ProgressStep label="Strategy" description="Label" />
            <ProgressStep label="Review" description="Label" />
          </ProgressIndicator>
          <form
            className="flex flex-col gap-[30px]  h-full w-full"
            onSubmit={handleSubmit(onSubmit)}
          >
            {currentIndex === 0 ? (
              <BasicInformation
                setValue={setValue}
                watch={watch}
                getValues={getValues}
                register={register}
                errors={errors}
                errorStyle={errorStyle}
                fundName={fundname}
              />
            ) : currentIndex === 1 ? (
              <ShareClasses
                setValue={setValue}
                watch={watch}
                getValues={getValues}
                register={register}
                errors={errors}
                errorStyle={errorStyle}
                assets={assets}
              />
            ) : currentIndex === 2 ? (
              <Policies
                setValue={setValue}
                register={register}
                getValues={getValues}
                errors={errors}
                errorStyle={errorStyle}
                disabeld={disabeld}
                setDisabled={setDisabled}
              />
            ) : currentIndex === 3 ? (
              <Assets setValue={setValue} watch={watch} assets={assets} />
            ) : currentIndex === 4 ? (
              <Strategies
                getValues={getValues}
                setValue={setValue}
                register={register}
                watch={watch}
                errors={errors}
                strategies={strategies}
                errorStyle={errorStyle}
              />
            ) : (
              <ReviewForm
                getValues={getValues}
                assets={assets}
                isSubmitting={isSubmitting}
              />
            )}

            {errors.root && currentIndex === 5 && (
              <p style={errorStyle}>{errors.root.message}</p>
            )}

            <div className="flex justify-end mt-auto gap-[8px]">
              <Button
                kind="secondary"
                className="bg-[#393939]"
                renderIcon={currentIndex !== 0 ? ArrowLeft : undefined}
                disabled={currentIndex === 0 || isSubmitting}
                iconDescription="Back Button"
                onClick={() => {
                  if (currentIndex === 0) {
                    return;
                  }
                  setCurrentIndex(currentIndex - 1);
                }}
              >
                Back
              </Button>
              <Button
                kind="primary"
                className="bg-[#0F62FE]"
                renderIcon={currentIndex !== 5 ? ArrowRight : ArrowDown}
                disabled={isSubmitting}
                onClick={async () => {
                  console.log("Current index", currentIndex);
                  const fields = steps[currentIndex].fields;
                  const output = await trigger(fields as any);
                  console.log("Output", output);

                  if (!output) {
                    return;
                  }

                  if (currentIndex === 5) {
                    console.log("Submitting...");
                    console.log("Errors ? ", errors);
                    await handleSubmit(onSubmit)();
                    return;
                  }

                  setCurrentIndex(currentIndex + 1);
                }}
              >
                {currentIndex === 5 ? "Submit" : "Next"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
