"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { IntegrationsList } from "../components/integrations/integrations-list";
import PageContentWrapper from "../components/PageContentWrapper";
import { toast } from "../components/ui/use-toast";
import { parseTxError } from "../lib/error";
import { ExplorerLink } from "../components/ExplorerLink";
import { allIntegrations, Integration } from "./integrations/data";
import { useGlam, IntegrationName } from "@glam/anchor/react";

export default function PageIntegrations() {
  const { glamClient, allGlamStates, activeGlamState } = useGlam();
  const [selected, setSelected] = useState(-1);
  const [integrations, setIntegrations] = useState(allIntegrations);

  const toggleIntegration = useCallback(
    async (integ: Integration) => {
      setSelected(integ.id);

      if (!activeGlamState?.address) {
        return;
      }

      const lowercaseFirstLetter = (s: string) => {
        if (!s) return s;
        return s.charAt(0).toLowerCase() + s.slice(1);
      };

      const integration = lowercaseFirstLetter(allIntegrations[integ.id].name);

      const action = integ.enabled ? "disable" : "enable";

      const stateModel = (allGlamStates || []).find(
        (s) => s.idStr === activeGlamState?.address,
      );
      const updated =
        action === "disable"
          ? {
              integrationAcls: stateModel!.integrationAcls.filter(
                // @ts-ignore
                (acl) => Object.keys(acl.name)[0] !== integration,
              ),
            }
          : {
              integrationAcls: [
                ...stateModel!.integrationAcls,
                {
                  // @ts-ignore
                  name: { [integration]: {} } as IntegrationName,
                  features: [],
                },
              ],
            };
      try {
        const txSig = await glamClient.state.updateState(
          activeGlamState.pubkey,
          updated,
        );

        setIntegrations((prevIntegrations) =>
          prevIntegrations.map((integration) =>
            integration.id === integ.id
              ? { ...integration, enabled: !integration.enabled }
              : integration,
          ),
        );

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
      }
    },
    [activeGlamState, glamClient, allGlamStates],
  );

  useEffect(() => {
    const enabled =
      (allGlamStates || [])
        .find((s) => s.idStr === activeGlamState?.address)
        ?.integrationAcls.map((acl) =>
          Object.keys(acl.name)[0].toLowerCase(),
        ) || [];

    integrations.forEach((integ, index) => {
      if (enabled.includes(integ.name.toLowerCase())) {
        integrations[index].enabled = true;
      }
    });
  }, [allGlamStates, activeGlamState]);

  return (
    <PageContentWrapper>
      <div className="flex">
        <Tabs defaultValue="all">
          <div className="flex items-center justify-start gap-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>
            <div className="text-muted-foreground text-sm">
              Click on an integration to toggle it on or off.
            </div>
          </div>
          <TabsContent value="all">
            <IntegrationsList
              items={integrations}
              selected={selected}
              onSelect={toggleIntegration}
            />
          </TabsContent>
          <TabsContent value="active">
            <IntegrationsList
              items={integrations.filter((integ) => integ.enabled)}
              selected={selected}
              onSelect={toggleIntegration}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContentWrapper>
  );
}
