// mint/create/page.tsx

"use client";

import MultiStepForm from "./createMintForm";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function Page() {
  return (
    <PageContentWrapper>
      <MultiStepForm />
    </PageContentWrapper>
  );
}
