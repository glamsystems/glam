import { TreeNodeData } from "@/components/CustomTree";

export const treeDataPermissions: TreeNodeData = {
  id: "mint",
  label: "Mint permissions",
  description: "",
  children: [
    {
      id: "burnShare",
      label: "Burn shares",
      description: "",
      collapsed: true,
    },
    {
      id: "mintShare",
      label: "Mint shares",
      description: "",
      collapsed: true,
    },
    {
      id: "forceTransferShare",
      label: "Force transfer shares",
      description: "",
      collapsed: true,
    },
    {
      id: "setTokenAccountsStates",
      label: "Update token account state",
      description: "",
      collapsed: true,
    },
  ],
};

export const mintPermissions =
  treeDataPermissions.children?.map((node) => ({
    label: node.id,
    value: node.id,
  })) || [];
