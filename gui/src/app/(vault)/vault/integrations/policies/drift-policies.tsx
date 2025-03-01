"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useGlam } from "@glamsystems/glam-sdk/react";
import DynamicForm from "@/components/DynamicForm";
import schema from "@/data/glamRiskSchema.json";
import { toast } from "@/components/ui/use-toast";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";
import { FormButtons } from "@/app/(vault)/vault/integrations/policies/components/form-buttons";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  driftAccessControl: z.number(),
  driftDelegatedAccount: z.string().nullable(),
  driftMarketIndexesPerp: z.array(z.number()).nullable(),
  driftOrderTypes: z.array(z.number()).nullable(),
  driftMaxLeverage: z.number().nullable(),
  driftEnableSpotMargin: z.boolean(),
  driftMarketIndexesSpot: z.array(z.number()).nullable(),
});

type FormSchema = z.infer<typeof formSchema>;

const defaultValues: FormSchema = {
  driftAccessControl: 0,
  driftDelegatedAccount: null,
  driftMarketIndexesPerp: [],
  driftOrderTypes: [],
  driftMaxLeverage: null,
  driftEnableSpotMargin: false,
  driftMarketIndexesSpot: [],
};

export default function DriftPoliciesPage() {
  const [isTxPending, setIsTxPending] = useState(false);
  const { activeGlamState, glamClient, allGlamStates, driftUser } = useGlam();
  const glamState = allGlamStates?.find(
    (s) => s.idStr === activeGlamState?.address,
  );

  const driftForm = useForm<FormSchema>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Add form change detection for browser navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (driftForm.formState.isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [driftForm.formState.isDirty]);

  // Load existing drift policy configuration
  useEffect(() => {
    const fetchDriftData = async () => {
      if (!glamState || !driftUser) return;
      try {
        // Set initial values
        driftForm.reset({
          driftAccessControl: 0,
          driftDelegatedAccount:
            driftUser.delegate === "11111111111111111111111111111111"
              ? null
              : driftUser.delegate,
          driftMarketIndexesPerp: glamState.driftMarketIndexesPerp,
          driftOrderTypes: glamState.driftOrderTypes,
          driftMaxLeverage: driftUser.maxMarginRatio,
          driftEnableSpotMargin: driftUser.isMarginTradingEnabled,
          driftMarketIndexesSpot: glamState.driftMarketIndexesSpot || [1, 2],
        });
      } catch (error: any) {
        toast({
          title: "Failed to load Drift policy configuration",
          description: parseTxError(error),
          variant: "destructive",
        });
      }
    };

    fetchDriftData();
  }, [glamState, driftUser, driftForm]);

  // Update form fields visibility based on access control selection
  const watchDriftAccessControl = Number(driftForm.watch("driftAccessControl"));
  const dynamicSchema = useMemo(() => {
    // Create a deep copy of the schema to avoid mutating the original
    const schemaCopy = JSON.parse(JSON.stringify(schema));
    delete schemaCopy.$id; // Remove the $id to avoid conflicts with Ajv
    const isDelegatedMode = watchDriftAccessControl === 0;

    Object.keys(schemaCopy.drift.fields).forEach((fieldName) => {
      const field = schemaCopy.drift.fields[fieldName];
      if (fieldName === "driftAccessControl") {
        field["x-hidden"] = false;
      } else if (fieldName === "driftDelegatedAccount") {
        field["x-hidden"] = !isDelegatedMode;
      } else if (field["x-glam-only"]) {
        field["x-hidden"] = isDelegatedMode; // Hide GLAM-only fields in delegated mode
      }
    });

    return schemaCopy;
  }, [watchDriftAccessControl]);

  const updateDelegatedAccount = useCallback(
    async (data: FormSchema) => {
      if (!glamState) return;

      const { driftDelegatedAccount, driftEnableSpotMargin, driftMaxLeverage } =
        data;

      const preInstructions = [];
      if (
        driftDelegatedAccount !== null &&
        driftDelegatedAccount.length >= 32
      ) {
        preInstructions.push(
          await glamClient.drift.updateUserDelegateIx(
            glamState.id!,
            driftDelegatedAccount,
          ),
        );
      }

      if (driftMaxLeverage) {
        preInstructions.push(
          await glamClient.drift.updateUserCustomMarginRatioIx(
            glamState.id!,
            driftMaxLeverage,
          ),
        );
      }

      try {
        const txSig = await glamClient.drift.updateUserMarginTradingEnabled(
          glamState.id!,
          driftEnableSpotMargin,
          0,
          {
            preInstructions,
          },
        );
        toast({
          title: "Updated Drift policy configuration",
          description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
        });
      } catch (error: any) {
        toast({
          title: "Failed to update Drift policy configuration",
          description: parseTxError(error),
          variant: "destructive",
        });
      }
    },
    [glamState, glamClient],
  );

  const updateGlamDriftPolicies = useCallback(
    async (data: FormSchema) => {
      setIsTxPending(true);
      try {
        // Update the state with the new drift configuration
        const updated = {
          integrations: [
            ...(glamState.integrations || []).filter(
              // @ts-ignore
              (integ) => Object.keys(integ)[0] !== "drift",
            ),
            { drift: data },
          ],
        };
        const txSig = await glamClient.state.updateState(
          glamState.id!,
          updated,
        );
        toast({
          title: "Drift policy configuration updated",
          description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
        });
        // Reset form with new values to update dirty state
        driftForm.reset(data);
      } catch (error: any) {
        toast({
          title: "Failed to update Drift policy configuration",
          description: parseTxError(error),
          variant: "destructive",
        });
      }
      setIsTxPending(false);
    },
    [glamState, driftForm, glamClient],
  );

  const onSubmitForm = useCallback(
    async (data: FormSchema) => {
      switch (watchDriftAccessControl) {
        case 0:
          await updateDelegatedAccount(data);
          break;
        case 1:
          await updateGlamDriftPolicies(data);
          break;
      }
    },
    [watchDriftAccessControl],
  );

  const handleReset = async () => {
    if (!glamState) return;

    try {
      // Get the current drift configuration from state
      const driftPolicy = glamState.integrations?.find(
        // @ts-ignore
        (integ) => Object.keys(integ)[0] === "drift",
      )?.drift || {
        driftAccessControl: 0,
        driftDelegatedAccount: null,
        driftMarketIndexesPerp: [],
        driftOrderTypes: [],
        driftMaxLeverage: null,
        driftEnableSpotMargin: false,
        driftMarketIndexesSpot: [],
      };

      // Reset form with values
      driftForm.reset(driftPolicy);
    } catch (error: any) {
      toast({
        title: "Failed to reset Drift policy configuration",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
  };

  // Track form state changes
  const [formState, setFormState] = useState(driftForm.formState);

  useEffect(() => {
    const subscription = driftForm.watch(() => {
      setFormState({ ...driftForm.formState });
    });
    return () => subscription.unsubscribe();
  }, [driftForm]);

  return (
    <Form {...driftForm}>
      <div className="flex flex-col space-y-4">
        <div className="space-y-4">
          <DynamicForm
            schema={dynamicSchema}
            isNested={true}
            groups={["drift"]}
            formData={driftForm}
            showSubmitButton={false}
          />
        </div>
        <FormButtons
          integrationName="Drift"
          onReset={handleReset}
          isLoading={isTxPending}
          // isDirty={formState.isDirty}
          isDirty={true}
          onSubmit={driftForm.handleSubmit(onSubmitForm)}
        />
      </div>
    </Form>
  );
}
