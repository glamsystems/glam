import { Button, NumberInput, Select, Toggle } from '@carbon/react';

import { Add } from '@carbon/icons-react';
import { gray70Hover } from '@carbon/colors';
import { useState } from 'react';

type SideActionBarProps = {
  type: 'Subscribe' | 'Redeem' | 'Manage';
  primayButtonFunction: () => void;
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
    <div className="flex flex-col gap-[16px] h-full overflow-y-auto hide-scrollbar">
      {type === 'Manage' && (
        <>
          <Select
            labelText="From"
            id="from"
            defaultValue="placeholder"
            onChange={() => {}}
          >
            <option value="placeholder" disabled>
              Choose an option
            </option>
            <option value="Subscribe">Option 1</option>
            <option value="Redeem">Option 2</option>
            <option value="Transfer">Option 3</option>
          </Select>
          <Select
            labelText="To"
            id="to"
            defaultValue="placeholder"
            onChange={() => {}}
          >
            <option value="placeholder" disabled>
              Choose an option
            </option>
            <option value="Subscribe">Option 1</option>
            <option value="Redeem">Option 2</option>
            <option value="Transfer">Option 3</option>
          </Select>
          <Select
            labelText="Asset"
            id="asset"
            defaultValue="placeholder"
            onChange={() => {}}
          >
            <option value="placeholder" disabled>
              Choose an option
            </option>
            <option value="Subscribe">Option 1</option>
            <option value="Redeem">Option 2</option>
            <option value="Transfer">Option 3</option>
          </Select>
        </>
      )}

      <NumberInput
        label="Quantity"
        id="quantity"
        min={0}
        value={quantity}
        onChange={(event, { value, direction }) => {
          if (value) {
            setQuantity(value as number);
            return;
          }
          if (direction === 'up') {
            setQuantity(quantity + 1);
          } else {
            if (quantity === 0) {
              return;
            }
            setQuantity(quantity - 1);
          }
        }}
        step={1}
        helperText={<span>Number of Shares</span>}
      />
      {type !== 'Manage' && (
        <NumberInput
          label="Amount"
          id="amount"
          min={0}
          max={100}
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
          helperText={<span>Amount in USDC</span>}
        />
      )}
      <Toggle
        labelText="Subscription Type"
        id="subscription-type"
        labelA="In Kind"
        labelB="In Cash"
        disabled
      />
      <div className="flex justify-between">
        <h1 className="text-xl">Total</h1>
        <h1 className="text-xl">397.20</h1>
      </div>
      <p style={{ ...grayStyle, fontStyle: 'italic' }}>
        Not including network fees.
      </p>
      <div className="flex flex-col gap-[16px] h-full justify-end">
        <Button
          style={{
            backgroundColor:
              type === 'Subscribe'
                ? '#48BF84'
                : type === 'Redeem'
                ? '#BF4883'
                : '#0F62FE',
          }}
          className="w-full"
          kind="primary"
          renderIcon={Add}
          iconDescription={'Plus Icon'}
          onClick={primayButtonFunction}
        >
          {type === 'Subscribe'
            ? 'Subscribe'
            : type === 'Redeem'
            ? 'Redeem'
            : 'Transfer'}
        </Button>
        <Button
          className="bg-[#393939] w-full"
          kind="secondary"
          renderIcon={Add}
          onClick={() => {
            setAmount(0);
            setQuantity(0);
          }}
          iconDescription="Clear Order"
        >
          Clear Order
        </Button>
      </div>
    </div>
  );
};
