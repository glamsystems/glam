"use client";

import { DataTable } from "./access/data-table";
import { columns } from "./access/columns";
import React, { useCallback, useMemo } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import { usePubkeyLabels } from "@/hooks/usePubkeyLabels";

export default function PageAccess({
  perms,
}: {
  perms: "vault" | "mint" | "all";
}) {
  const { allFunds, activeFund } = useGlam();
  const { getLabel } = usePubkeyLabels();

  const fundId = activeFund?.address;
  const fund = (allFunds || []).find((f) => f.idStr === fundId);

  const data = useMemo(() => {
    if (!fund) return [];

    return (fund.delegateAcls || []).map((acl: any) => {
      const pubkey = acl.pubkey.toBase58();
      return {
        pubkey,
        label: getLabel(pubkey),
        tags: (acl.permissions || []).map((x: any) => Object.keys(x)[0]),
      };
    });
  }, [fund, getLabel]);

  const handleSuccess = useCallback(() => {
    // Force a re-render when a key is modified
    // This will cause getData to run again with the latest fund data
    window.setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, []);

  return (
    <PageContentWrapper>
      <DataTable
        data={data}
        columns={columns}
        perms={perms}
        onSuccess={handleSuccess}
      />
    </PageContentWrapper>
  );
}
