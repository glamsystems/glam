import {
  Button,
  NumberInput,
  RadioButton,
  RadioButtonGroup,
  Select
} from "@carbon/react";

import { Add } from "@carbon/icons-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { gray70Hover } from "@carbon/colors";
import { useGlamProgramAccount } from "../glam/glam-data-access";
import { useState } from "react";

type SideActionBarProps = {
  type: "Subscribe" | "Redeem" | "Manage";
  fund: any;
  primayButtonFunction: () => void;
};

const ASSETS_MAP: { [key: string]: string } = {
  USDC: "8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2",
  WSOL: "So11111111111111111111111111111111111111112",
  BTC: "3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv"
};

const SubscribeActionBar = ({
  fund,
  subscribe
}: {
  fund: any;
  subscribe: any;
}) => {
  const [asset, setAsset] = useState("USDC");
  const [amount, setAmount] = useState(0);

  return (
    <>
      <Select
        labelText="Asset"
        id="asset"
        defaultValue={asset}
        onChange={(e) => {
          setAsset(e.target?.value || "");
        }}
      >
        <option value="USDC">USDC</option>
        <option value="WSOL">WSOL</option>
        <option value="BTC">BTC</option>
      </Select>
      <NumberInput
        label="Amount"
        id="amount"
        min={0}
        value={amount}
        onChange={(event, { value, direction }) => {
          if (value) {
            setAmount(value as number);
            return;
          }
          if (direction === "up") {
            setAmount(amount + 1);
          } else {
            if (amount === 0) {
              return;
            }
            setAmount(amount - 1);
          }
        }}
        step={1}
      />
      <div className="flex flex-col gap-[16px] h-full justify-end">
        <Button
          style={{
            backgroundColor: "#48BF84",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingInlineEnd: "16px"
          }}
          className="w-full"
          kind="primary"
          onClick={async () => {
            if (amount <= 0) {
              return;
            }
            const amountBn =
              asset === "WSOL"
                ? new BN(amount * 1_000_000_000)
                : new BN(amount * 1_000_000);
            const subscribeData = {
              fund: fund.data,
              asset: new PublicKey(ASSETS_MAP[asset]),
              amount: amountBn
            };
            try {
              await subscribe.mutateAsync(subscribeData);
            } catch (_e) {
              subscribe.reset();
            }
          }}
          disabled={subscribe.isPending}
        >
          <>
            <span>Subscribe</span>
            <strong>
              {" "}
              {amount} {asset}{" "}
            </strong>
          </>
        </Button>
        <Button
          className="bg-[#393939] w-full"
          kind="secondary"
          onClick={() => {
            setAmount(0);
          }}
          iconDescription="Clear Order"
        >
          Clear
        </Button>
      </div>
    </>
  );
};

const RedeemActionBar = ({ fund, redeem }: { fund: any; redeem: any }) => {
  const [amount, setAmount] = useState(0);
  const [inKind, setInKind] = useState(1);

  return (
    <>
      <NumberInput
        label="Shares"
        id="amount"
        min={0}
        value={amount}
        onChange={(event, { value, direction }) => {
          if (value) {
            setAmount(value as number);
            return;
          }
          if (direction === "up") {
            setAmount(amount + 1);
          } else {
            if (amount === 0) {
              return;
            }
            setAmount(amount - 1);
          }
        }}
        step={1}
      />
      <RadioButtonGroup
        legendText="Redemption"
        name="radio-button-group"
        defaultSelected={inKind}
        onChange={(val) => {
          setInKind(val as number);
        }}
        orientation="vertical"
      >
        <RadioButton labelText="In kind" value={1} id="radio-1" />
        <RadioButton labelText="USDC" value={0} id="radio-2" />
      </RadioButtonGroup>
      <div className="flex flex-col gap-[16px] h-full justify-end">
        <Button
          style={{
            backgroundColor: "#BF4883",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingInlineEnd: "16px"
          }}
          className="w-full"
          kind="primary"
          onClick={async () => {
            if (amount <= 0) {
              return;
            }
            const amountBn = new BN(amount * 1_000_000_000);
            const redeemData = {
              fund: fund.data,
              amount: amountBn,
              inKind: inKind == 1
            };
            try {
              await redeem.mutateAsync(redeemData);
            } catch (_e) {
              redeem.reset();
            }
          }}
          disabled={redeem.isPending}
        >
          <>
            <span>Redeem</span>
            <strong> {amount} shares </strong>
          </>
        </Button>
        <Button
          className="bg-[#393939] w-full"
          kind="secondary"
          onClick={() => {
            setAmount(0);
          }}
          iconDescription="Clear Order"
        >
          Clear
        </Button>
      </div>
    </>
  );
};

const ManageActionBar = ({ fund }: { fund: any }) => {
  const [app, setApp] = useState("Drift");
  const [asset, setAsset] = useState("USDC");
  const [amount, setAmount] = useState(0);

  return (
    <>
      <Select
        labelText="App"
        id="app"
        defaultValue={app}
        onChange={(e) => {
          setApp(e.target?.value || "");
        }}
      >
        <option value="Drift">Drift</option>
        <option value="Backpack">Backpack</option>
      </Select>

      <Select
        labelText="Asset"
        id="asset"
        defaultValue={asset}
        onChange={(e) => {
          setAsset(e.target?.value || "");
        }}
      >
        <option value="USDC">USDC</option>
        <option value="BTC">BTC</option>
        <option value="SOL">SOL</option>
      </Select>
      <NumberInput
        label="Amount"
        id="amount"
        min={0}
        value={amount}
        onChange={(event, { value, direction }) => {
          if (value) {
            setAmount(value as number);
            return;
          }
          if (direction === "up") {
            setAmount(amount + 1);
          } else {
            if (amount === 0) {
              return;
            }
            setAmount(amount - 1);
          }
        }}
        step={1}
      />
      <div className="flex flex-col gap-[16px] h-full justify-end">
        <Button
          style={{
            backgroundColor: "#0F62FE",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingInlineEnd: "16px"
          }}
          className="w-full"
          kind="primary"
          onClick={() => {}}
        >
          <>
            <span>Deposit</span>
            <strong>
              {" "}
              {amount} {asset}{" "}
            </strong>
          </>
        </Button>
        <Button
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingInlineEnd: "16px"
          }}
          className="bg-[#393939] w-full"
          kind="secondary"
          onClick={() => {}}
          iconDescription="Clear Order"
        >
          <>
            <span>Withdraw</span>
            <strong>
              {" "}
              {amount} {asset}{" "}
            </strong>
          </>
        </Button>
      </div>
    </>
  );
};

export const SideActionBar = ({
  type,
  fund,
  primayButtonFunction
}: SideActionBarProps) => {
  const grayStyle = {
    color: gray70Hover,
    fontSize: "14px",
    lineHeight: "18px"
  };

  const { subscribe, redeem } = useGlamProgramAccount({ fundKey: fund.key });

  return (
    <div className="flex flex-col gap-[16px] h-full">
      {type === "Subscribe" && (
        <SubscribeActionBar fund={fund} subscribe={subscribe} />
      )}
      {type === "Redeem" && <RedeemActionBar fund={fund} redeem={redeem} />}
      {type === "Manage" && <ManageActionBar fund={fund} />}
    </div>
  );
};
