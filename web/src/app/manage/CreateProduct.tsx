import {
  Add,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  NextFilled,
  NextOutline
} from "@carbon/icons-react";
import {
  Button,
  Checkbox,
  Dropdown,
  ProgressIndicator,
  ProgressStep,
  TextArea,
  TextInput
} from "@carbon/react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

import { countryList } from "../data/countryList";
import { tokenList } from "../data/tokenList";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z.object({
  fundName: z.string(),
  fundSymbol: z.string(),
  website: z.string(),
  managerID: z.string().min(32).max(44),
  openEndedStructure: z.enum(["open-ended fund", "closed-ended fund"]),
  investmentObjective: z.string(),
  fundAsset: z.string(),
  fundAssetID: z.string().min(32).max(44),
  countryAlpha2: z.string(),
  countryAlpha3: z.string(),
  // must be greater than or equal to today's date
  launchDate: z.string(),
  fiscalYearEnd: z
    .string()
    .length(5)
    .refine((date) => +date.split("/")[0] <= 12 && +date.split("/")[1] <= 31, {
      message: "Invalid date"
    }),
  isFoF: z.boolean(),
  isPassiveFund: z.boolean(),
  fullShareClassName: z.string(),
  shareClassSymbol: z.string(),
  shareClassAsset: z.string(),
  shareClassAssetID: z.string(),
  ISIN: z.string(),
  investmentStatus: z.enum(["open"]),
  managementFee: z.string(),
  performanceFee: z.string(),
  policyDistribution: z.enum([
    "Accumulating",
    "Accumulating & Distributing",
    "Distributing"
  ]),
  extension: z.enum(["A", "B", "C", "D", "E", "1", "2", "3", "4", "5"]),
  shareClassLaunchDate: z.string(),
  shareClassLifecycle: z.enum([
    "Projected",
    "To Be Launched",
    "Offering Period",
    "Active"
  ])
});

type FormFields = z.infer<typeof FormSchema>;

// ------ Fund ------
// fundName: string; //  Global Asset Management Layer Fund
// fundSymbol: string; //  GLAM
// website: string; //  https://glam.systems
// managerID: string; // 42nzKiudctraRTyN9Ka5cwFW22wac6zVc6bmjFCzpaUf (public key of signed in user)
// openEndedStructure: boolean; // true
// investmentObjective: string; // The investment objective of the Fund is to seek to provide investment results that correspond generally to the price and yield performance, before fees and expenses, of the Nasdaq Blockchain Economy Index.
// fundAsset: string; //  USDC
// fundAssetID: string; //  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (public key of USDC)
// countryAlpha2: string; //  US
// countryAlpha3: string; //  USA
// launchDate: string; //  2022-01-01
// fiscalYearEnd: string; //  12-31
// isFoF: boolean; // false
// isPassiveFund: boolean; // false
// // ------ Share Class ------
// fullShareClassName: string; //  Global Asset Management Layer Fund A USDC (Fundname + Extension + Asset)
// shareClassSymbol: string; //  GLAM-A-USDC (Fund Symbol + Extension + Asset)
// shareClassAsset: string; //  USDC
// shareClassAssetID: string; //  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (public key of USDC)
// ISIN: string; //  US1234567890
// investmentStatus: string; //  Open
// managementFee: string; //  0.5
// performanceFee: string; //  0.2
// policyDistribution: string; //  Quarterly
// extension: string; //  A
// shareClassLaunchDate: string; //  2022-01-01
// shareClassLifecycle: string; //  Open

export const CreateProduct = () => {
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey)
      setValue("managerID", publicKey.toBase58(), { shouldValidate: true });
  }, [publicKey]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const errorStyle = {
    color: "red",
    fontSize: "14px"
  };

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormFields>({
    defaultValues: {
      fundName: "",
      fundSymbol: "",
      website: "",
      managerID: "",
      openEndedStructure: "open-ended fund",
      investmentObjective: "",
      fundAsset: "",
      fundAssetID: "",
      countryAlpha2: "",
      countryAlpha3: "",
      // today's date
      launchDate: new Date().toISOString().split("T")[0],
      fiscalYearEnd: "",
      isFoF: false,
      isPassiveFund: false,
      fullShareClassName: "",
      shareClassSymbol: "",
      shareClassAsset: "",
      shareClassAssetID: "",
      ISIN: "",
      investmentStatus: "open",
      managementFee: "0",
      performanceFee: "0",
      policyDistribution: "Accumulating",
      extension: "A",
      shareClassLaunchDate: new Date().toISOString().split("T")[0],
      shareClassLifecycle: "Active"
    },
    resolver: zodResolver(FormSchema)
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(data);
    } catch (error) {
      setError("root", {
        message: "An error occurred. Please try again later."
      });
    }
  };

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
              <>
                <div className="flex justify-between gap-[125px]">
                  <TextInput
                    {...register("fundName")}
                    className="max-w-[400px] w-full"
                    id="fund-name"
                    labelText="Fund Name"
                    placeholder="Global Asset Management Layer Fund"
                    helperText="Legal name of the collective investment scheme as mentioned in official documents (i.e. prospectus). If the fund belongs to an umbrella, the name of the umbrella must be included, too."
                  />
                  {errors.fundName && (
                    <p style={errorStyle}>{errors.fundName.message}</p>
                  )}
                  <TextInput
                    {...register("fundSymbol")}
                    className="max-w-[200px] w-full"
                    id="fund-symbol"
                    labelText="Fund Symbol"
                    placeholder="GLAM"
                    helperText="Unique alphanumeric code representing the fund in transactions and listings."
                  />
                  {errors.fundSymbol && (
                    <p style={errorStyle}>{errors.fundSymbol.message}</p>
                  )}
                  <TextInput
                    className="w-full"
                    {...register("website")}
                    id="website"
                    labelText="Website"
                    placeholder="https://glam.systems"
                    helperText="URL of the fund's official website."
                  />
                  {errors.website && (
                    <p style={errorStyle}>{errors.website.message}</p>
                  )}
                </div>
                <div className="flex justify-between gap-[125px] items-center">
                  <TextInput
                    {...register("managerID")}
                    className="max-w-[400px] w-full mb-2"
                    id="manager-id"
                    labelText="Manager ID"
                    helperText="Public key of the manager account."
                  />
                  {errors.managerID && (
                    <p style={errorStyle}>{errors.managerID.message}</p>
                  )}
                  <Dropdown
                    {...register("fundAsset")}
                    className="max-w-[200px] w-full"
                    id="fund-asset"
                    label=""
                    onChange={(e) => {
                      setValue("fundAsset", e.selectedItem?.symbol ?? "");
                      setValue("fundAssetID", e.selectedItem?.tokenMint ?? "");
                    }}
                    items={tokenList}
                    itemToString={(item) => (item ? item.symbol : "")}
                    titleText="Fund Asset"
                    helperText="The asset in which the fund is denominated."
                  />
                  {errors.fundAsset && (
                    <p style={errorStyle}>{errors.fundAsset.message}</p>
                  )}
                  <Dropdown
                    {...register("countryAlpha2")}
                    className="w-full mb-auto"
                    id="country"
                    label=""
                    items={countryList}
                    onChange={(e) => {
                      setValue(
                        "countryAlpha2",
                        e.selectedItem?.code_alpha_2 ?? ""
                      );
                      setValue(
                        "countryAlpha3",
                        e.selectedItem?.code_alpha_3 ?? ""
                      );
                    }}
                    itemToString={(item) => item?.name ?? ""}
                    titleText="Country"
                    helperText="Domicile of the fund."
                  />
                </div>
                <div className="flex justify-between gap-[125px]">
                  <TextInput
                    {...register("launchDate")}
                    className="max-w-[400px] w-full"
                    id="launch-date"
                    labelText="Launch Date"
                    type="date"
                    helperText="dd/mm/yyyy"
                  />
                  {errors.launchDate && (
                    <p style={errorStyle}>{errors.launchDate.message}</p>
                  )}
                  <TextInput
                    {...register("fiscalYearEnd")}
                    className="max-w-[200px] w-full"
                    id="fiscal-year-end"
                    labelText="Fiscal Year End"
                    placeholder="12/31"
                    helperText="MM/DD"
                  />
                  {errors.fiscalYearEnd && (
                    <p style={errorStyle}>{errors.fiscalYearEnd.message}</p>
                  )}
                  <Dropdown
                    {...register("openEndedStructure")}
                    className="w-full"
                    id="fund-structure"
                    label=""
                    onChange={(e) => {
                      if (e.selectedItem?.id === "open-ended fund") {
                        setValue("openEndedStructure", "open-ended fund");
                      } else {
                        setValue("openEndedStructure", "closed-ended fund");
                      }
                    }}
                    items={[
                      { id: "open-ended fund", name: "Open-Ended Fund" },
                      { id: "closed-ended fund", name: "Closed-Ended Fund" }
                    ]}
                    itemToString={(item) => item?.name ?? ""}
                    titleText="Fund Structure"
                  />
                </div>
                <div className="flex justify-between gap-[125px]">
                  <TextArea
                    enableCounter
                    helperText="Helper Text"
                    id="investment-objective"
                    invalidText="Text too long."
                    labelText="Investment Objective"
                    maxCount={100}
                    placeholder="The investment objective of the Fund is to seek to provide investment results that correspond generally to the price and yield performance, before fees and expenses, of the Nasdaq Blockchain Economy Index."
                    rows={4}
                    required
                  />
                </div>
              </>
            ) : currentIndex === 1 ? (
              <>
                <div className="flex justify-between gap-[125px]">
                  <TextInput
                    {...register("fullShareClassName")}
                    className="max-w-[400px] w-full"
                    id="full-share-class-name"
                    labelText="Full Share Class Name"
                    placeholder={`${getValues("fundName")} ${getValues(
                      "extension"
                    )} ${getValues("fundAsset")}`}
                    helperText="The full name of the share class, including the fund name, extension, and asset."
                    disabled
                  />
                  <TextInput
                    {...register("shareClassSymbol")}
                    className="max-w-[200px] w-full"
                    id="share-class-symbol"
                    labelText="Share Class Symbol"
                    placeholder={`${getValues("fundSymbol")}-${getValues(
                      "extension"
                    )}-${getValues("fundAsset")}`}
                    helperText="Unique alphanumeric code representing the share class."
                    disabled
                  />
                  <Dropdown
                    {...register("extension")}
                    className="max-w-[400px] w-full"
                    id="extension"
                    label="A"
                    onChange={(e) => {
                      setValue("extension", e.selectedItem?.id ?? ("A" as any));
                      setValue(
                        "fullShareClassName",
                        `${getValues("fundName")} ${
                          e.selectedItem?.id
                        } ${getValues("fundAsset")}`
                      );
                      setValue(
                        "shareClassSymbol",
                        `${getValues("fundSymbol")}-${
                          e.selectedItem?.id
                        }-${getValues("fundAsset")}`
                      );
                    }}
                    items={[
                      { id: "A", name: "A" },
                      { id: "B", name: "B" },
                      { id: "C", name: "C" },
                      { id: "D", name: "D" },
                      { id: "E", name: "E" },
                      { id: "1", name: "1" },
                      { id: "2", name: "2" },
                      { id: "3", name: "3" },
                      { id: "4", name: "4" },
                      { id: "5", name: "5" }
                    ]}
                    itemToString={(item) => item?.name ?? ""}
                    titleText="Extension"
                  />
                </div>
                <div className="flex justify-between gap-[125px]">
                  <TextInput
                    {...register("ISIN")}
                    className="max-w-[400px] w-full"
                    id="isin"
                    labelText="ISIN"
                    placeholder="XS1082172823"
                    helperText="International Securities Identification Number."
                  />
                  <Dropdown
                    {...register("shareClassAsset")}
                    className=" w-full"
                    id="share-class-asset"
                    label=""
                    onChange={(e) => {
                      setValue("shareClassAsset", e.selectedItem?.symbol ?? "");
                      setValue(
                        "shareClassAssetID",
                        e.selectedItem?.tokenMint ?? ""
                      );
                    }}
                    items={tokenList}
                    itemToString={(item) => (item ? item.symbol : "")}
                    titleText="Share Class Asset"
                    helperText="The asset in which the share class is denominated."
                  />
                </div>
                <div className="flex justify-between gap-[125px]">
                  <Dropdown
                    {...register("policyDistribution")}
                    className="max-w-[400px] w-full"
                    id="policy-distribution"
                    label=""
                    onChange={(e) => {
                      setValue(
                        "policyDistribution",
                        e.selectedItem?.id ?? ("Accumulating" as any)
                      );
                    }}
                    items={[
                      { id: "Accumulating", name: "Accumulating" },
                      {
                        id: "Accumulating & Distributing",
                        name: "Accumulating & Distributing"
                      },
                      { id: "Distributing", name: "Distributing" }
                    ]}
                    itemToString={(item) => item?.name ?? ""}
                    titleText="Policy Distribution"
                  />
                  <TextInput
                    {...register("managementFee")}
                    className="max-w-[200px] w-full"
                    id="management-fee
                  "
                    labelText="Management Fee (%)"
                    placeholder="0"
                    helperText="Annual fee charged by the fund manager for managing the fund."
                  />
                  <TextInput
                    {...register("performanceFee")}
                    className="w-full"
                    id="performance-fee"
                    labelText="Performance Fee (%)"
                    placeholder="0"
                    helperText="Fee charged by the fund manager based on the fund's performance."
                  />
                </div>
                <div className="flex justify-between gap-[125px]">
                  <Dropdown
                    {...register("investmentStatus")}
                    className="max-w-[400px] w-full"
                    id="investment-status"
                    label=""
                    onChange={(e) => {
                      setValue(
                        "investmentStatus",
                        e.selectedItem?.id ?? ("" as any)
                      );
                    }}
                    items={[{ id: "open", name: "open" }]}
                    itemToString={(item) => item?.name ?? ""}
                    titleText="Investment Status"
                  />
                  <TextInput
                    {...register("shareClassLaunchDate")}
                    className="max-w-[200px] w-full"
                    id="share-class-launch-date"
                    labelText="Share Class Launch Date"
                    type="date"
                    helperText="dd/mm/yyyy"
                  />
                  <Dropdown
                    {...register("shareClassLifecycle")}
                    className="w-full"
                    id="share-class-lifecycle"
                    label=""
                    onChange={(e) => {
                      setValue(
                        "shareClassLifecycle",
                        e.selectedItem?.id ?? ("Projected" as any)
                      );
                    }}
                    items={[
                      { id: "Projected", name: "Projected" },
                      { id: "To Be Launched", name: "To Be Launched" },
                      { id: "Offering Period", name: "Offering Period" },
                      { id: "Active", name: "Active" }
                    ]}
                    itemToString={(item) => item?.name ?? ""}
                    titleText="Share Class Lifecycle"
                  />
                </div>
              </>
            ) : currentIndex === 2 ? (
              <p>Policies</p>
            ) : currentIndex === 3 ? (
              <p>Assets</p>
            ) : currentIndex === 4 ? (
              <p>Strategy</p>
            ) : (
              <p>Review</p>
            )}

            {errors.root && <p style={errorStyle}>{errors.root.message}</p>}

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
                iconDescription="Add Button"
                onClick={() => setCurrentIndex(currentIndex + 1)}
              >
                {currentIndex === 5 ? "Submit" : "Next"}
              </Button>
              {/* <button
                type="button"
                onClick={() => {
                  console.log("Get Values");
                  console.log(getValues());
                }}
                className="bg-[#393939] text-white p-2 rounded-md"
              >
                Get Values
              </button> */}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
