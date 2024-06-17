import {
  ProgressBar,
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
} from "@carbon/react";

import { FormFields } from "./CreateProduct";
import { UseFormGetValues } from "react-hook-form";
import { tokenList } from "../data/tokenList";

type ReviewFormProps = {
  getValues: UseFormGetValues<FormFields>;
  assets: string[];
  isSubmitting: boolean;
};

export const ReviewForm = ({
  getValues,
  assets,
  isSubmitting,
}: ReviewFormProps) => {
  return (
    <>
      <div className="h-full max-h-[50vh] overflow-y-auto">
        <StructuredListWrapper
          isCondensed
          style={{
            width: "80%",
          }}
        >
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Basic Information</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            <StructuredListRow>
              <StructuredListCell>Fund Name</StructuredListCell>
              <StructuredListCell>{getValues("fundName")}</StructuredListCell>
            </StructuredListRow>
            <StructuredListRow>
              <StructuredListCell>Fund Symbol</StructuredListCell>
              <StructuredListCell>{getValues("fundSymbol")}</StructuredListCell>
            </StructuredListRow>
            <StructuredListRow>
              <StructuredListCell>Investment Objective</StructuredListCell>
              <StructuredListCell>
                {getValues("investmentObjective")}
              </StructuredListCell>
            </StructuredListRow>
            <StructuredListRow>
              <StructuredListCell>Fund Asset</StructuredListCell>
              <StructuredListCell>{getValues("fundAsset")}</StructuredListCell>
            </StructuredListRow>
            <StructuredListRow>
              <StructuredListCell>Country</StructuredListCell>
              <StructuredListCell>
                {getValues("countryAlpha2")}
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
              <StructuredListCell head>Share Classes</StructuredListCell>
            </StructuredListRow>
            <StructuredListRow>
              <StructuredListCell>Full Share Class Name</StructuredListCell>
              <StructuredListCell>
                {`${getValues("fundName")} ${getValues(
                  "extension"
                )} ${getValues("fundAsset")}`}
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
              <StructuredListCell>Policy Distribution</StructuredListCell>
              <StructuredListCell>
                {getValues("policyDistribution")}
              </StructuredListCell>
            </StructuredListRow>
            <StructuredListRow>
              <StructuredListCell>Extension</StructuredListCell>
              <StructuredListCell>{getValues("extension")}</StructuredListCell>
            </StructuredListRow>
            <StructuredListRow>
              <StructuredListCell>Share Class Lifecycle</StructuredListCell>
              <StructuredListCell>
                {getValues("shareClassLifecycle")}
              </StructuredListCell>
            </StructuredListRow>
            {/* divider for policies */}
            <StructuredListRow head>
              <StructuredListCell head>Policies</StructuredListCell>
            </StructuredListRow>
            {Boolean(getValues("lockupPeriod")) && (
              <StructuredListRow>
                <StructuredListCell>Lockup Period</StructuredListCell>
                <StructuredListCell>
                  {getValues("lockupPeriod")} {getValues("lockupPeriodUnits")}
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
                <StructuredListCell>Permanent Delegate</StructuredListCell>
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
                <StructuredListCell>Tokens</StructuredListCell>
                <StructuredListCell>
                  {tokenList
                    .filter((token) => assets.includes(token.tokenMint))
                    .map((token) => token.symbol)
                    .join(", ")}
                </StructuredListCell>
              </StructuredListRow>
            )}
            {/* divider for strategy */}
            {getValues("counterParties")?.length !== 0 && (
              <>
                <StructuredListRow head>
                  <StructuredListCell head>Strategy</StructuredListCell>
                </StructuredListRow>
                <StructuredListRow>
                  <StructuredListCell>Counter Parties</StructuredListCell>
                  <StructuredListCell>
                    {getValues("counterParties")?.join(", ")}
                  </StructuredListCell>
                </StructuredListRow>
                {getValues("traderIdDrift") && (
                  <StructuredListRow>
                    <StructuredListCell>Trader ID</StructuredListCell>
                    <StructuredListCell>
                      {getValues("traderIdDrift")}
                    </StructuredListCell>
                  </StructuredListRow>
                )}
              </>
            )}
          </StructuredListBody>
        </StructuredListWrapper>
      </div>
      {isSubmitting && (
        <ProgressBar
          label="Creating Fund..."
          helperText="Please sign the transaction to create the fund in your wallet."
          className="w-[80%]"
        />
      )}
    </>
  );
};

export default ReviewForm;
