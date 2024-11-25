"use client";

import DynamicForm from "@/components/DynamicForm";
import schema from "../../../../data/glamFormSchema.json";
import PageContentWrapper from "@/components/PageContentWrapper";
import React from "react";

export default function Product() {
  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <DynamicForm
          schema={schema}
          isNested={true}
          groups={["company", "fund", "fundManager"]}
          columns={2}
        />
      </div>
    </PageContentWrapper>
  );
}
