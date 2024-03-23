import {
  Button,
  ProgressIndicator,
  ProgressStep,
  TextArea,
  TextInput,
} from '@carbon/react';

import { Add } from '@carbon/icons-react';

export const CreateProduct = () => {
  return (
    <div className="w-full flex flex-col mx-[180px]">
      <div>
        <h1 className="mt-[48px] text-[42px]">Create Product</h1>
      </div>
      <div className="w-full max-h-[600px] h-full items-center flex gap-[130px]">
        <ProgressIndicator vertical currentIndex={0} className="mb-[170px]">
          <ProgressStep label="Basic Information" description="Label" />
          <ProgressStep label="Share Classes" description="Label" />
          <ProgressStep label="Fees" description="Label" />
          <ProgressStep label="Policies" description="Label" />
        </ProgressIndicator>

        <div className="flex flex-col gap-[70px] w-full max-h-[410px]">
          <div className="flex justify-between gap-[125px]">
            <TextInput
              id="product-name"
              labelText="Product Name"
              placeholder="iBTC Shares"
              helperText="Helper Text"
              required
            />
            <TextInput
              id="product-ticker"
              labelText="Product Ticker"
              placeholder="iBTC"
              helperText="Helper Text"
              required
            />
          </div>
          <TextArea
            enableCounter
            helperText="Helper Text"
            id="investment-objective"
            invalidText="Text too long."
            labelText="Investment Objective"
            maxCount={100}
            placeholder="The investment objective of the Fund is to seek to provide investment results that correspond generally to the price and yield performance, before fees and expenses, of the Nasdaq Blockchain Economy Index."
            rows={8}
            required
          />

          <div className="flex justify-end gap-[8px]">
            <Button
              kind="secondary"
              className="bg-[#393939]"
              renderIcon={Add}
              iconDescription="Back Button"
            >
              Back
            </Button>
            <Button
              kind="primary"
              className="bg-[#0F62FE]"
              renderIcon={Add}
              iconDescription="Add Button"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
