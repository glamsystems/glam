"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlam } from "@glamsystems/glam-sdk/react";
import DynamicForm from "@/components/DynamicForm";
import schema from "@/data/glamRiskSchema.json";
import { toast } from "@/components/ui/use-toast";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";
import { FormButtons } from "@/app/(vault)/vault/integrations/policies/components/form-buttons";
import { Form } from "@/components/ui/form";

export default function DriftPoliciesPage() {
  const [isTxPending, setIsTxPending] = useState(false);
  const { activeGlamState, glamClient, allGlamStates } = useGlam();
  const state = allGlamStates?.find(
    (s) => s.idStr === activeGlamState?.address,
  );

  const driftForm = useForm<any>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      driftAccessControl: 0,
      driftDelegatedAccount: null,
      driftMarketIndexesPerp: [],
      driftOrderTypes: [],
      driftMaxLeverage: null,
      driftEnableSpot: false,
      driftMarketIndexesSpot: [],
    },
  });

  // Add form change detection for browser navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (driftForm.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [driftForm.formState.isDirty]);

  // Load existing drift policy configuration
  useEffect(() => {
    const fetchDriftData = async () => {
      if (!state) return;

      try {
        // Get the current drift configuration from state
        const driftPolicy =
          state.integrations?.find(
            // @ts-ignore
            (integ) => Object.keys(integ)[0] === "drift",
          )?.drift || {
            driftAccessControl: 0,
            driftDelegatedAccount: null,
            driftMarketIndexesSpot: [],
          };

        // Set initial values
        driftForm.reset(driftPolicy);
      } catch (error: any) {
        toast({
          title: "Failed to load Drift policy configuration",
          description: parseTxError(error),
          variant: "destructive",
        });
      }
    };

    fetchDriftData();
  }, [state, driftForm]);

  // Update form fields visibility based on access control selection
  const watchDriftAccessControl = driftForm.watch("driftAccessControl");
  useEffect(() => {
    if (watchDriftAccessControl === 0) {
      // Reset fields when switching to GLAM
      driftForm.setValue("driftDelegatedAccount", null);
      driftForm.setValue("driftMarketIndexesPerp", []);
      driftForm.setValue("driftOrderTypes", []);
      driftForm.setValue("driftMarketIndexesSpot", []);
      driftForm.setValue("driftMaxLeverage", null);
      driftForm.setValue("driftEnableSpot", false);

      schema.drift.fields.driftDelegatedAccount["x-hidden"] = false;
      schema.drift.fields.driftMarketIndexesPerp["x-hidden"] = true;
      schema.drift.fields.driftOrderTypes["x-hidden"] = true;
      schema.drift.fields.driftMarketIndexesSpot["x-hidden"] = true;
    } else {
      schema.drift.fields.driftDelegatedAccount["x-hidden"] = true;
      schema.drift.fields.driftMarketIndexesPerp["x-hidden"] = false;
      schema.drift.fields.driftOrderTypes["x-hidden"] = false;
      schema.drift.fields.driftMarketIndexesSpot["x-hidden"] = false;
    }
  }, [watchDriftAccessControl]);

  const handleSubmit = async (data: any) => {
    if (!state) return;

    setIsTxPending(true);
    try {
      // Update the state with the new drift configuration
      const updated = {
        integrations: [
          ...(state.integrations || []).filter(
            // @ts-ignore
            (integ) => Object.keys(integ)[0] !== "drift",
          ),
          { drift: data },
        ],
      };
      const txSig = await glamClient.state.updateState(state.id!, updated);
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
  };

  const handleReset = async () => {
    if (!state) return;

    try {
      // Get the current drift configuration from state
      const driftPolicy =
        state.integrations?.find(
          // @ts-ignore
          (integ) => Object.keys(integ)[0] === "drift",
        )?.drift || {
          driftAccessControl: 0,
          driftDelegatedAccount: null,
          driftMarketIndexesPerp: [],
          driftOrderTypes: [],
          driftMaxLeverage: null,
          driftEnableSpot: false,
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
    <form
      onSubmit={driftForm.handleSubmit(handleSubmit)}
      className="flex flex-col space-y-4"
    >
      <Form {...driftForm}>
        <div className="space-y-4">
          <DynamicForm
            schema={schema}
            isNested={true}
            groups={["drift"]}
            formData={driftForm}
            showSubmitButton={false}
            onSubmit={handleSubmit}
          />
        </div>
      </Form>
      <FormButtons
        integrationName="Drift"
        onReset={handleReset}
        isLoading={isTxPending}
        isDirty={formState.isDirty}
        onSubmit={driftForm.handleSubmit(handleSubmit)}
      />
    </form>
  );
}
