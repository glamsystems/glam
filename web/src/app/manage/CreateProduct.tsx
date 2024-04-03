import {
  Add,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Asleep,
  IbmPowerVs,
  NextFilled,
  NextOutline
} from "@carbon/icons-react";
import {
  Button,
  Checkbox,
  Dropdown,
  NumberInput,
  ProgressIndicator,
  ProgressStep,
  SelectableTile,
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
  Tag,
  TextArea,
  TextInput
} from "@carbon/react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";

import { MultiSelect } from "carbon-components-react";
import backpackLogo from "../../assets/backpacklogo.png";
import { countryList } from "../data/countryList";
import driftLogo from "../../assets/driftlogo.png";
import jupiterLogo from "../../assets/logo-bright.svg";
import mndeLogo from "../../assets/MNDE.png";
import { tokenList } from "../data/tokenList";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z.object({
  // ------ Fund ------
  fundName: z.string(),
  fundSymbol: z.string(),
  website: z.string(),
  managerID: z.string().min(32).max(44),
  openEndedStructure: z.enum(["Open Ended Fund", "Closed Ended Fund"]),
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
  // ------ Share Class ------
  fullShareClassName: z.string(),
  shareClassSymbol: z.string(),
  shareClassAsset: z.string(),
  shareClassAssetID: z.string(),
  ISIN: z.string(),
  investmentStatus: z.enum(["Open"]),
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
  ]),
  // ------ Policies ------
  lockupPeriod: z.number(), // (Transfer Hook)
  lockupPeriodUnits: z.enum([
    "seconds",
    "minutes",
    "hours",
    "days",
    "weeks",
    "months",
    "quarters",
    "years"
  ]),
  nonTransferable: z.boolean(),
  transferFees: z.string(),
  permanentDelegate: z.string(),
  // ------ Assets ------
  assets: z.array(z.string()),
  // ------ Strategy ------
  enableTrading: z.boolean(),
  counterParties: z.array(z.string()),
  traderIdDrift: z.optional(z.string().min(32).max(44))
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

  const [disabeld, setDisabled] = useState(true);

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
      fiscalYearEnd: "",
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
      extension: "1",
      shareClassLaunchDate: new Date().toISOString().split("T")[0],
      shareClassLifecycle: "Active"
    },
    resolver: zodResolver(FormSchema)
  });

  const assets = watch("assets");

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

  console.log("Get Values Lockup Period", getValues("lockupPeriod"));

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
                    helperText="Legal name of the collective investment scheme."
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
                    helperText="Unique alphanumeric code representing the fund."
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
                <div className="flex justify-between gap-[125px]">
                  <TextArea
                    {...register("investmentObjective")}
                    enableCounter
                    className="max-w-[400px] w-full mt-2"
                    id="investment-objective"
                    invalidText="Text too long."
                    labelText="Investment Objective"
                    maxCount={100}
                    placeholder="The investment objective of the Fund is to seek to provide investment results that correspond generally to the price and yield performance, before fees and expenses, of the Nasdaq Blockchain Economy Index."
                    rows={8}
                    required
                  />
                  <div className="flex flex-col max-w-[200px] w-full gap-[32px]">
                    <Dropdown
                      {...register("fundAsset")}
                      className="w-full"
                      id="fund-asset"
                      label={getValues("fundAsset")}
                      onChange={(e) => {
                        setValue("fundAsset", e.selectedItem?.symbol ?? "");
                        setValue(
                          "fundAssetID",
                          e.selectedItem?.tokenMint ?? ""
                        );
                      }}
                      items={tokenList}
                      itemToString={(item) => (item ? item.symbol : "")}
                      titleText="Fund Asset"
                      helperText="The asset in which the fund is denominated."
                    />
                    {errors.fundAsset && (
                      <p style={errorStyle}>{errors.fundAsset.message}</p>
                    )}
                    <TextInput
                      {...register("fiscalYearEnd")}
                      className="w-full"
                      id="fiscal-year-end"
                      labelText="Fiscal Year End"
                      placeholder="12/31"
                      helperText="MM/DD"
                    />
                    {errors.fiscalYearEnd && (
                      <p style={errorStyle}>{errors.fiscalYearEnd.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col w-full h-full justify-between gap-[50px]">
                    <Dropdown
                      {...register("countryAlpha2")}
                      className="w-full"
                      id="country"
                      label={getValues("countryAlpha2")}
                      selectedItem={countryList.find(
                        (item) =>
                          item.code_alpha_2 === getValues("countryAlpha2")
                      )}
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
                    <TextInput
                      {...register("openEndedStructure")}
                      className="w-full"
                      id="fund-structure"
                      labelText="Fund Structure"
                      value={getValues("openEndedStructure")}
                      readOnly
                    />
                  </div>
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
                    readOnly
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
                    readOnly
                  />
                  <Dropdown
                    {...register("extension")}
                    className="max-w-[400px] w-full"
                    id="extension"
                    label={getValues("extension")}
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
                  <Dropdown
                    {...register("shareClassAsset")}
                    className="max-w-[400px] w-full"
                    id="share-class-asset"
                    label={getValues("shareClassAsset")}
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
                  <Dropdown
                    {...register("investmentStatus")}
                    className="max-w-[200px] w-full"
                    id="investment-status"
                    label={getValues("investmentStatus")}
                    onChange={(e) => {
                      setValue(
                        "investmentStatus",
                        e.selectedItem?.id ?? ("" as any)
                      );
                    }}
                    items={[{ id: "open", name: "open" }]}
                    itemToString={(item) => item?.name ?? ""}
                    titleText="Investment Status"
                    disabled
                  />
                  <Dropdown
                    {...register("shareClassLifecycle")}
                    className="w-full"
                    id="share-class-lifecycle"
                    label={getValues("shareClassLifecycle")}
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
                    disabled
                  />
                </div>
                <div className="flex justify-between gap-[125px]">
                  <Dropdown
                    {...register("policyDistribution")}
                    className="max-w-[400px] w-full"
                    id="policy-distribution"
                    label={getValues("policyDistribution")}
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
                    disabled
                  />
                  <TextInput
                    {...register("managementFee")}
                    className="max-w-[200px] w-full"
                    id="management-fee
                  "
                    labelText="Management Fee (%)"
                    placeholder="0"
                    helperText="Annual fee charged by the fund manager for managing the fund."
                    readOnly
                  />
                  <TextInput
                    {...register("performanceFee")}
                    className="w-full"
                    id="performance-fee"
                    labelText="Performance Fee (%)"
                    placeholder="0"
                    helperText="Fee charged by the fund manager based on the fund's performance."
                    readOnly
                  />
                </div>
              </>
            ) : currentIndex === 2 ? (
              <div className="flex flex-col gap-[30px]">
                <div className="flex gap-8">
                  <NumberInput
                    {...register("lockupPeriod")}
                    className="w-full mt-[6px]"
                    id="lockup-period"
                    label="Lockup Period"
                    onChange={(event, { value, direction }) => {
                      console.log("Value", value);
                      if (value) {
                        setValue("lockupPeriod", +value);
                        if (+value === 0) {
                          setDisabled(true);
                          return;
                        }
                        setDisabled(false);
                        return;
                      }
                      if (direction === "up") {
                        setValue("lockupPeriod", getValues("lockupPeriod") + 1);
                      } else {
                        if (value === 0) {
                          setValue("lockupPeriod", 0);
                          setDisabled(true);
                          return;
                        }
                        setValue("lockupPeriod", getValues("lockupPeriod") - 1);
                      }
                      setDisabled(false);
                    }}
                    min={0}
                    max={undefined}
                    step={1}
                    helperText="The period of time during which an investor cannot redeem shares."
                  />
                  <Dropdown
                    {...register("lockupPeriodUnits")}
                    className="w-full"
                    id="lockup-period-units"
                    label={getValues("lockupPeriodUnits")}
                    onChange={(e) => {
                      setValue(
                        "lockupPeriodUnits",
                        e.selectedItem?.id ?? ("days" as any)
                      );
                    }}
                    items={[
                      { id: "seconds", name: "seconds" },
                      { id: "minutes", name: "minutes" },
                      { id: "hours", name: "hours" },
                      { id: "days", name: "days" },
                      { id: "weeks", name: "weeks" },
                      { id: "months", name: "months" },
                      { id: "quarters", name: "quarters" },
                      { id: "years", name: "years" }
                    ]}
                    itemToString={(item) => item?.name ?? "days"}
                    titleText="Lockup Time Units"
                    disabled={disabeld}
                  />
                </div>

                <NumberInput
                  {...register("transferFees")}
                  className="w-full"
                  id="transfer-fees"
                  label="Transfer Fees (%)"
                  min={0}
                  max={100}
                  step={1}
                  helperText="The fee charged for transferring shares."
                />
                <TextInput
                  {...register("permanentDelegate")}
                  className="w-full"
                  id="permanent-delegate"
                  labelText="Permanent Delegate"
                  placeholder="Public Key"
                  helperText="Public key of the permanent delegate."
                />
                <Checkbox
                  {...register("nonTransferable")}
                  id="non-transferable"
                  labelText="Non-Transferable"
                />
              </div>
            ) : currentIndex === 3 ? (
              <>
                <MultiSelect
                  {...register("assets")}
                  id="assets"
                  titleText="Assets"
                  items={tokenList}
                  selectedItems={
                    assets ? assets.map((asset) => ({ symbol: asset })) : []
                  }
                  itemToString={(item) => (item ? item.symbol : "")}
                  onChange={(e) => {
                    setValue(
                      "assets",
                      e.selectedItems.map((item) => item.symbol)
                    );
                  }}
                  helperText="Assets that the fund can hold."
                />
                {/* display all selected assets */}

                <div className="flex flex-wrap gap-2 justify-center ">
                  {assets &&
                    assets?.map((asset) => (
                      <Tag
                        className="w-full max-w-[180px] max-h-[10px] sm:max-h-[30px] lg:max-h-[60px] h-full rounded-none m-0"
                        key={asset}
                        renderIcon={() => (
                          <img
                            src={
                              tokenList.find((item) => item.symbol === asset)
                                ?.imgURL
                            }
                            alt={asset}
                            className="border-2 border-white rounded-full"
                          />
                        )}
                      >
                        {asset}
                      </Tag>
                    ))}
                </div>
              </>
            ) : currentIndex === 4 ? (
              <div className="flex flex-col h-full gap-[30px]">
                <div className="flex h-full items-center gap-8 flex-wrap">
                  <SelectableTile
                    className="w-full max-w-[500px] h-full max-h-[200px]"
                    id="counter-party-drift"
                    onClick={() => {
                      setValue("counterParties", ["Drift"]);
                    }}
                    value="Drift"
                  >
                    <div className="flex items-center gap-[16px]">
                      <img
                        src={driftLogo}
                        className="h-[50px] w-[50px]"
                        alt="Drift Logo"
                      />
                      <p className="text-[28px] font-bold">Drift</p>
                    </div>
                    <TextInput
                      {...register("traderIdDrift")}
                      className="w-full mt-8"
                      id="trader-id-drift"
                      labelText="(Optional) Trader ID"
                      placeholder="Public Key"
                      helperText="Public key of the trader."
                    />
                  </SelectableTile>

                  <SelectableTile
                    className="w-full h-full max-h-[200px] max-w-[500px]"
                    id="counter-party-marinade"
                    disabled
                    value={"Marinade"}
                    onClick={() => {
                      setValue("counterParties", ["Marinade"]);
                    }}
                  >
                    <div className="flex items-center gap-[16px]">
                      <img
                        src={mndeLogo}
                        className="h-[50px] w-[40px]"
                        alt="Marinade Logo"
                      />
                      <p className="text-[28px] font-bold">Marinade</p>
                    </div>
                    <p className="flex text-[16px] h-[90%] justify-center items-center">
                      Coming Soon...
                    </p>
                  </SelectableTile>
                  <SelectableTile
                    className="w-full h-full max-h-[200px] max-w-[500px]"
                    id="counter-party-backpack  "
                    disabled
                    value={"Backpack"}
                    onClick={() => {
                      setValue("counterParties", ["Backpack"]);
                    }}
                  >
                    <div className="flex items-center gap-[16px]">
                      <img
                        src={backpackLogo}
                        className="h-[50px] w-[40px]"
                        alt="Backpack Logo"
                      />
                      <p className="text-[28px] font-bold">Backpack</p>
                    </div>
                    <p className="flex text-[16px] h-[90%] justify-center items-center">
                      Coming Soon...
                    </p>
                  </SelectableTile>
                  <SelectableTile
                    className="w-full h-full max-h-[200px] max-w-[500px]"
                    id="counter-party-jupyter"
                    disabled
                    value={"Jupyter"}
                    onClick={() => {
                      setValue("counterParties", ["Jupyter"]);
                    }}
                  >
                    <div className="flex items-center gap-[16px]">
                      <img
                        src={jupiterLogo}
                        className="h-[50px] w-[40px]"
                        alt="Jupyter Logo"
                      />
                      <p className="text-[28px] font-bold">Jupyter</p>
                    </div>
                    <p className="flex text-[16px] h-[90%] justify-center items-center">
                      Coming Soon...
                    </p>
                  </SelectableTile>
                </div>
              </div>
            ) : (
              <div className="h-full max-h-[50vh] overflow-y-auto">
                <StructuredListWrapper>
                  <StructuredListHead>
                    <StructuredListRow head>
                      <StructuredListCell head>
                        Basic Information
                      </StructuredListCell>
                    </StructuredListRow>
                  </StructuredListHead>
                  <StructuredListBody>
                    <StructuredListRow>
                      <StructuredListCell>Fund Name</StructuredListCell>
                      <StructuredListCell>
                        {getValues("fundName")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Fund Symbol</StructuredListCell>
                      <StructuredListCell>
                        {getValues("fundSymbol")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Website</StructuredListCell>
                      <StructuredListCell>
                        {getValues("website")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>
                        Investment Objective
                      </StructuredListCell>
                      <StructuredListCell>
                        {getValues("investmentObjective")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Fund Asset</StructuredListCell>
                      <StructuredListCell>
                        {getValues("fundAsset")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Country</StructuredListCell>
                      <StructuredListCell>
                        {getValues("countryAlpha2")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Fiscal Year End</StructuredListCell>
                      <StructuredListCell>
                        {getValues("fiscalYearEnd")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Fund Structure</StructuredListCell>
                      <StructuredListCell>
                        {getValues("openEndedStructure")}
                      </StructuredListCell>
                    </StructuredListRow>
                    {/* divider for share class */}
                    <StructuredListRow head>
                      <StructuredListCell head>
                        Share Classes
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>
                        Full Share Class Name
                      </StructuredListCell>
                      <StructuredListCell>
                        {getValues("fullShareClassName")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>
                        Share Class Symbol
                      </StructuredListCell>
                      <StructuredListCell>
                        {getValues("shareClassSymbol")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Share Class Asset</StructuredListCell>
                      <StructuredListCell>
                        {getValues("shareClassAsset")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Investment Status</StructuredListCell>
                      <StructuredListCell>
                        {getValues("investmentStatus")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Management Fee</StructuredListCell>
                      <StructuredListCell>
                        {getValues("managementFee")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Performance Fee</StructuredListCell>
                      <StructuredListCell>
                        {getValues("performanceFee")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>
                        Policy Distribution
                      </StructuredListCell>
                      <StructuredListCell>
                        {getValues("policyDistribution")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>Extension</StructuredListCell>
                      <StructuredListCell>
                        {getValues("extension")}
                      </StructuredListCell>
                    </StructuredListRow>
                    <StructuredListRow>
                      <StructuredListCell>
                        Share Class Lifecycle
                      </StructuredListCell>
                      <StructuredListCell>
                        {getValues("shareClassLifecycle")}
                      </StructuredListCell>
                    </StructuredListRow>
                    {/* divider for policies */}
                    <StructuredListRow head>
                      <StructuredListCell head>Policies</StructuredListCell>
                    </StructuredListRow>
                    {getValues("lockupPeriod") && (
                      <StructuredListRow>
                        <StructuredListCell>Lockup Period</StructuredListCell>
                        <StructuredListCell>
                          {getValues("lockupPeriod")}{" "}
                          {getValues("lockupPeriodUnits")}
                        </StructuredListCell>
                      </StructuredListRow>
                    )}
                    <StructuredListRow>
                      <StructuredListCell>Transfer Fees</StructuredListCell>
                      <StructuredListCell>
                        {getValues("transferFees")}%
                      </StructuredListCell>
                    </StructuredListRow>
                    {getValues("permanentDelegate") && (
                      <StructuredListRow>
                        <StructuredListCell>
                          Permanent Delegate
                        </StructuredListCell>
                        <StructuredListCell>
                          {getValues("permanentDelegate")}
                        </StructuredListCell>
                      </StructuredListRow>
                    )}
                    <StructuredListRow>
                      <StructuredListCell>Non-Transferable</StructuredListCell>
                      <StructuredListCell>
                        {getValues("nonTransferable") ? "Yes" : "No"}
                      </StructuredListCell>
                    </StructuredListRow>
                    {/* divider for assets */}
                    <StructuredListRow head>
                      <StructuredListCell head>Assets</StructuredListCell>
                    </StructuredListRow>
                    {assets && (
                      <StructuredListRow>
                        <StructuredListCell>Assets</StructuredListCell>
                        <StructuredListCell>
                          {assets.join(", ")}
                        </StructuredListCell>
                      </StructuredListRow>
                    )}
                    {/* divider for strategy */}
                    <StructuredListRow head>
                      <StructuredListCell head>Strategy</StructuredListCell>
                    </StructuredListRow>
                    {getValues("counterParties") && (
                      <StructuredListRow>
                        <StructuredListCell>Counter Parties</StructuredListCell>
                        <StructuredListCell>
                          {getValues("counterParties").join(", ")}
                        </StructuredListCell>
                      </StructuredListRow>
                    )}
                    {getValues("traderIdDrift") && (
                      <StructuredListRow>
                        <StructuredListCell>Trader ID</StructuredListCell>
                        <StructuredListCell>
                          {getValues("traderIdDrift")}
                        </StructuredListCell>
                      </StructuredListRow>
                    )}
                  </StructuredListBody>
                </StructuredListWrapper>
              </div>
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
