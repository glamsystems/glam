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
  const { delegateAcls, allGlamStates, activeGlamState, refresh } = useGlam();
  const { getLabel } = usePubkeyLabels();

  const state = (allGlamStates || []).find(
    (s) => s.idStr === activeGlamState?.address,
  );

  const data = useMemo(() => {
    if (!state) return [];

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

    const owner = state.owner?.pubkey
      ? [
          {
            pubkey: state.owner.pubkey.toBase58(),
            label: "Owner",
            tags: flatPermissions,
          },
        ]
      : [];
    const delegates = (delegateAcls || []).map((acl: any) => {
      const pubkey = acl.pubkey.toBase58();
      return {
        pubkey,
        label: getLabel(pubkey),
        tags: (acl.permissions || []).map((x: any) => Object.keys(x)[0]),
      };
    });
    return owner.concat(delegates);
  }, [state, getLabel]);

  const handleSuccess = useCallback(() => {
    refresh();
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
