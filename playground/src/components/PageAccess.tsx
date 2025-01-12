"use client";

import { DataTable } from "./access/data-table";
import { columns } from "./access/columns";
import React, { useCallback, useMemo } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import { usePubkeyLabels } from "@/hooks/usePubkeyLabels";
import {
  mintTreeDataPermissions,
  vaultTreeDataPermissions,
} from "./access/data/permissions";

export default function PageAccess({
  perms,
}: {
  perms: "vault" | "mint" | "all";
}) {
  const { allGlamStates: allFunds, activeGlamState: activeFund } = useGlam();
  const { getLabel } = usePubkeyLabels();

  const fundId = activeFund?.address;
  const fund = (allFunds || []).find((f) => f.idStr === fundId);

  const data = useMemo(() => {
    if (!fund) return [];

    let treeDataPermissions = vaultTreeDataPermissions;
    if (perms === "mint") {
      treeDataPermissions = mintTreeDataPermissions;
    } else if (perms === "all") {
      treeDataPermissions.children = (
        vaultTreeDataPermissions.children || []
      ).concat(mintTreeDataPermissions.children || []);
    }

    const flatPermissions =
      treeDataPermissions.children?.flatMap(
        (lvl1: any) => lvl1.children?.map((node: any) => node.id) || [],
      ) || [];

    const owner = fund.owner?.pubkey
      ? [
          {
            pubkey: fund.owner.pubkey.toBase58(),
            label: "Owner",
            tags: flatPermissions,
          },
        ]
      : [];
    const delegates = (fund.delegateAcls || []).map((acl: any) => {
      const pubkey = acl.pubkey.toBase58();
      return {
        pubkey,
        label: getLabel(pubkey),
        tags: (acl.permissions || []).map((x: any) => Object.keys(x)[0]),
      };
    });
    return owner.concat(delegates);
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
