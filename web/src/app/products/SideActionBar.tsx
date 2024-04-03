import { Button, NumberInput, Select, RadioButton, RadioButtonGroup } from '@carbon/react';

import { Add } from '@carbon/icons-react';
import { gray70Hover } from '@carbon/colors';
import { useState } from 'react';

type SideActionBarProps = {
  type: 'Subscribe' | 'Redeem' | 'Manage';
  primayButtonFunction: () => void;
};


const SubscribeActionBar = ({

}) => {

  const [asset, setAsset] = useState("USDC");
  const [amount, setAmount] = useState(0);

  return (<>
  
    <Select
      labelText="Asset"
      id="asset"
      defaultValue={asset}
      onChange={(e) => { setAsset(e.target?.value || ""); }}
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
        if (direction === 'up') {
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
            backgroundColor: '#48BF84',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInlineEnd: '16px',
          }}
          className="w-full"
          kind="primary"
          onClick={() => {}}
        >
          <>
            <span>Subscribe</span>
            <strong> {amount} {asset} </strong>
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
  </>);
};

const RedeemActionBar = ({

}) => {

  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState(0);

  return (<>
  
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
        if (direction === 'up') {
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
    <RadioButtonGroup legendText="Redemption" name="radio-button-group" defaultSelected="radio-1" orientation="vertical">
      <RadioButton labelText="In kind (cheaper)" value="radio-1" id="radio-1" />
      <RadioButton labelText="USDC" value="radio-2" id="radio-2" />
    </RadioButtonGroup>
    <div className="flex flex-col gap-[16px] h-full justify-end">
        <Button
          style={{
            backgroundColor: '#BF4883',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInlineEnd: '16px',
          }}
          className="w-full"
          kind="primary"
          onClick={() => {}}
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
  </>);
};

const ManageActionBar = ({

}) => {

  const [app, setApp] = useState("Drift");
  const [asset, setAsset] = useState("USDC");
  const [amount, setAmount] = useState(0);

  return (<>

    <Select
      labelText="App"
      id="app"
      defaultValue={app}
      onChange={(e) => { setApp(e.target?.value || ""); }}
    >
      <option value="Drift">Drift</option>
      <option value="Backpack">Backpack</option>
    </Select>

    <Select
      labelText="Asset"
      id="asset"
      defaultValue={asset}
      onChange={(e) => { setAsset(e.target?.value || ""); }}
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
        if (direction === 'up') {
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
            backgroundColor: '#0F62FE',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInlineEnd: '16px',
          }}
          className="w-full"
          kind="primary"
          onClick={() => {}}
        >
          <>
            <span>Deposit</span>
            <strong> {amount} {asset} </strong>
          </>
        </Button>
        <Button
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInlineEnd: '16px',
          }}
          className="bg-[#393939] w-full"
          kind="secondary"
          onClick={() => {}}
          iconDescription="Clear Order"
        >
          <>
            <span>Withdraw</span>
            <strong> {amount} {asset} </strong>
          </>
        </Button>
      </div>

  </>);
};


export const SideActionBar = ({
  type,
  primayButtonFunction,
}: SideActionBarProps) => {
  const grayStyle = {
    color: gray70Hover,
    fontSize: '14px',
    lineHeight: '18px',
  };

  const [amount, setAmount] = useState(0);
  const [quantity, setQuantity] = useState(0);

  return (
    <div className="flex flex-col gap-[16px] h-[510px]">
      {type === 'Subscribe' && <SubscribeActionBar/>}
      {type === 'Redeem' && <RedeemActionBar/>}
      {type === 'Manage' && <ManageActionBar/>}
    </div>
  );
};
