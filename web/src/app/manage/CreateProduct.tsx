import {
  Button,
  ProgressIndicator,
  ProgressStep,
  TextArea,
  TextInput,
} from '@carbon/react';

import { Add } from '@carbon/icons-react';
import { useState } from 'react';

export const CreateProduct = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="w-full  h-full flex flex-col">
      <h1 className="mt-[100px] ml-[200px] text-[42px]">Create Product</h1>
      <div className=" ml-[200px] w-[80vw] max-h-[600px] h-full items-center flex gap-[130px]">
        <ProgressIndicator
          vertical
          currentIndex={currentIndex}
          className="mb-[170px]"
        >
          <ProgressStep label="Basic Information" description="Label" />
          <ProgressStep label="Share Classes" description="Label" />
          <ProgressStep label="Fees" description="Label" />
          <ProgressStep label="Policies" description="Label" />
        </ProgressIndicator>

        <div className="flex flex-col gap-[70px] w-full max-h-[410px]">
          {currentIndex === 0 ? (
            <>
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
            </>
          ) : currentIndex === 1 ? (
            <p>Share Classes</p>
          ) : currentIndex === 2 ? (
            <p>Fees</p>
          ) : currentIndex === 3 ? (
            <p>Policies</p>
          ) : null}

          <div className="flex justify-end gap-[8px]">
            <Button
              kind="secondary"
              className="bg-[#393939]"
              renderIcon={Add}
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
              renderIcon={Add}
              iconDescription="Add Button"
              onClick={() => setCurrentIndex(currentIndex + 1)}
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
