"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageContentWrapper from "@/components/PageContentWrapper";
import { toast } from "@/components/ui/use-toast";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";
import { allIntegrations, Integration } from "./data";
import {
  useGlam,
  Integration as IntegrationType,
} from "@glamsystems/glam-sdk/react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Import integration-specific policies components
import JupiterPolicies from "./policies/jupiter-policies";
import DriftPolicies from "./policies/drift-policies";

// Function to get badge variant from label
function getBadgeVariantFromLabel(
  label: string,
): "default" | "outline" | "secondary" {
  if (["work"].includes(label.toLowerCase())) {
    return "default";
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "secondary";
}

const IntegrationsTabContent = React.memo(
  ({
    value,
    integrations,
    selected,
    onSelectIntegration,
  }: {
    value: string;
    integrations: Integration[];
    selected: number;
    onSelectIntegration: (integ: Integration) => void;
  }) => {
    return (
      <TabsContent value={value} className="mt-4">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="flex flex-col gap-2 pr-4">
            {integrations
              .filter(
                (integ) =>
                  value === "all" || (integ.enabled && !integ.comingSoon),
              )
              .map((integ) => (
                <button
                  key={integ.id}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent min-h-[70px] cursor-pointer",
                    selected === integ.id && "bg-muted",
                  )}
                  onClick={() => onSelectIntegration(integ)}
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{integ.name}</div>
                        {integ.enabled && !integ.comingSoon && (
                          <span className="flex h-2 w-2 bg-emerald-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  {integ.labels && integ.labels.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {integ.labels.map((label) => (
                        <Badge
                          key={label}
                          variant={getBadgeVariantFromLabel(label)}
                          className="rounded-none"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
          </div>
        </ScrollArea>
      </TabsContent>
    );
  },
);

export default function PageIntegrations() {
  const { glamClient, allGlamStates, activeGlamState } = useGlam();
  const [selected, setSelected] = useState(-1); // index of selected integration
  const [integrations, setIntegrations] = useState(allIntegrations);
  const [contentKey, setContentKey] = useState(0);
  const [isTxPending, setIsTxPending] = useState(false);

  const selectIntegration = useCallback((integ: Integration) => {
    if (integ.comingSoon) return;
    setSelected(integ.id);
  }, []);

  const toggleIntegration = useCallback(
    async (integ: Integration, enabled: boolean) => {
      if (!activeGlamState?.address || integ.comingSoon) {
        return;
      }

      setIsTxPending(true);

      const lowercaseFirstLetter = (s: string) => {
        if (!s) return s;
        return s.charAt(0).toLowerCase() + s.slice(1);
      };

      const integration = lowercaseFirstLetter(allIntegrations[integ.id].key);

      const action = enabled ? "disable" : "enable";

      const stateModel = (allGlamStates || []).find(
        (s) => s.idStr === activeGlamState?.address,
      );
      const updated =
        action === "disable"
          ? {
              integrations: (stateModel?.integrations || []).filter(
                // @ts-ignore
                (integ) => Object.keys(integ)[0] !== integration,
              ),
            }
          : {
              integrations: [
                ...(stateModel?.integrations || []),
                // @ts-ignore
                { [integration]: {} } as IntegrationType,
              ],
            };
      try {
        const txSig = await glamClient.state.updateState(
          activeGlamState.pubkey,
          updated,
        );

        // Update local state immediately
        setIntegrations((prevIntegrations) =>
          prevIntegrations.map((integration) =>
            integration.id === integ.id
              ? { ...integration, enabled: !enabled }
              : integration,
          ),
        );
        // Force content refresh
        setContentKey((prev) => prev + 1);

        toast({
          title: `Successfully ${action}d integration ${integration}`,
          description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
        });
      } catch (error) {
        toast({
          title: `Error enabling integration ${integration}`,
          description: parseTxError(error),
          variant: "destructive",
        });
      } finally {
        setIsTxPending(false);
      }
    },
    [activeGlamState, glamClient, allGlamStates, allIntegrations],
  );

  useEffect(() => {
    if (!activeGlamState?.address || !allGlamStates) return;

    const state = allGlamStates.find(
      (s) => s.idStr === activeGlamState.address,
    );
    if (!state) return;

    console.log(
      `Enabled integrations on ${state.name} (${state.idStr}):`,
      state.integrations,
    );
    const enabledIntegrations = (state.integrations || []).map((integ) =>
      Object.keys(integ)[0].toLowerCase(),
    );

    setIntegrations((prev) =>
      prev.map((integ) => ({
        ...integ,
        enabled: enabledIntegrations.includes(integ.key.toLowerCase()),
      })),
    );
  }, [allGlamStates, activeGlamState]);

  // Function to render the policies component based on selected integration
  const renderIntegrationPolicies = useCallback(() => {
    if (selected < 0 || !integrations[selected]) return null;

    const integration = integrations[selected];
    if (!integration.enabled) {
      return null;
    }

    // Return the appropriate policies component based on the integration name
    switch (integration.key) {
      case "JupiterSwap":
        return <JupiterPolicies key={contentKey} />;
      case "Drift":
        return <DriftPolicies key={contentKey} />;
      default:
        return (
          <div className="text-muted-foreground">
            No additional policies available for this integration.
          </div>
        );
    }
  }, [selected, integrations, contentKey]);

  return (
    <PageContentWrapper>
      <div className="flex">
        <div className="w-[25%] max-w-[25%] min-w-[25%]">
          <Tabs defaultValue="all">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
            </div>

            <IntegrationsTabContent
              value="all"
              integrations={integrations}
              selected={selected}
              onSelectIntegration={selectIntegration}
            />
            <IntegrationsTabContent
              value="active"
              integrations={integrations}
              selected={selected}
              onSelectIntegration={selectIntegration}
            />
          </Tabs>
        </div>
        <div className="w-full ml-16">
          {selected >= 0 && (
            <Card className="w-full border-none shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {integrations[selected].name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`integration-${integrations[selected].id}`}
                      checked={integrations[selected].enabled}
                      onCheckedChange={(checked) =>
                        toggleIntegration(
                          integrations[selected],
                          integrations[selected].enabled,
                        )
                      }
                      disabled={
                        integrations[selected].comingSoon || isTxPending
                      }
                    />
                    <Label htmlFor={`integration-${integrations[selected].id}`}>
                      {integrations[selected].enabled ? "Enabled" : "Disabled"}
                    </Label>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {integrations[selected].description ||
                    "Configure this integration's policies below."}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderIntegrationPolicies()}</CardContent>
            </Card>
          )}
          {selected < 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select an integration from the list to view and configure its
              policies.
            </div>
          )}
        </div>
      </div>
    </PageContentWrapper>
  );
}
