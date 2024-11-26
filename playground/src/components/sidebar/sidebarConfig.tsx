// config/sidebar.ts
import {
  BoxModelIcon,
  CardStackPlusIcon,
  Component1Icon,
  CodeIcon,
  DashboardIcon,
  DiscIcon,
  DownloadIcon,
  ExitIcon,
  FilePlusIcon,
  GearIcon,
  GlobeIcon,
  LayersIcon,
  ListBulletIcon,
  LoopIcon,
  MarginIcon,
  MixerHorizontalIcon,
  MixerVerticalIcon,
  MixIcon,
  PaddingIcon,
  PersonIcon,
  PlusIcon,
  ShuffleIcon,
  StackIcon,
  TargetIcon,
  TokensIcon,
  TransformIcon,
  LightningBoltIcon,
  ActivityLogIcon,
  WidthIcon,
} from "@radix-ui/react-icons";

export type IconType =
  | typeof ActivityLogIcon
  | typeof BoxModelIcon
  | typeof CardStackPlusIcon
  | typeof CodeIcon
  | typeof Component1Icon
  | typeof DashboardIcon
  | typeof DiscIcon
  | typeof DownloadIcon
  | typeof ExitIcon
  | typeof FilePlusIcon
  | typeof GearIcon
  | typeof GlobeIcon
  | typeof LayersIcon
  | typeof ListBulletIcon
  | typeof LoopIcon
  | typeof MarginIcon
  | typeof MixerHorizontalIcon
  | typeof MixerVerticalIcon
  | typeof MixIcon
  | typeof PaddingIcon
  | typeof PersonIcon
  | typeof PlusIcon
  | typeof ShuffleIcon
  | typeof StackIcon
  | typeof TargetIcon
  | typeof TokensIcon
  | typeof TransformIcon
  | typeof LightningBoltIcon
  | typeof WidthIcon;

export interface NavItem {
  route: string;
  text: string;
  shortcut: string;
  Icon: IconType;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

// Define all available navigation items
const ALL_NAV_ITEMS = {
  access: {
    route: "/playground/access",
    text: "Access",
    shortcut: "",
    Icon: TargetIcon,
  },
  api: {
    route: "/playground/api",
    text: "GLAM API",
    shortcut: "",
    Icon: CodeIcon,
  },
  cluster: {
    route: "/playground/cluster",
    text: "Cluster",
    shortcut: "",
    Icon: MixerHorizontalIcon,
  },
  components: {
    route: "/playground/components",
    text: "Component Debugger",
    shortcut: "",
    Icon: LightningBoltIcon,
  },
  create: {
    route: "/playground/create",
    text: "Create New",
    shortcut: "",
    Icon: PlusIcon,
  },
  createMint: {
    route: "/mint/create",
    text: "Create Mint",
    shortcut: "",
    Icon: PlusIcon,
  },
  createVault: {
    route: "/vault/create",
    text: "Create Vault",
    shortcut: "",
    Icon: PlusIcon,
  },
  flows: {
    route: "/playground/flows",
    text: "Flows",
    shortcut: "",
    Icon: LoopIcon,
  },
  holders: {
    route: "/mint/holders",
    text: "Holders",
    shortcut: "",
    Icon: PersonIcon,
  },
  holdings: {
    route: "/vault/holdings",
    text: "Holdings",
    shortcut: "",
    Icon: ListBulletIcon,
  },
  idlSearch: {
    route: "/idl-search",
    text: "IDL Search",
    shortcut: "",
    Icon: ActivityLogIcon,
  },
  integrations: {
    route: "/playground/integrations",
    text: "Integrations",
    shortcut: "",
    Icon: MixIcon,
  },
  supply: {
    route: "/mint/supply",
    text: "Supply",
    shortcut: "",
    Icon: CardStackPlusIcon,
  },
  jupiterList: {
    route: "/playground/jupiter",
    text: "Jupiter Token List",
    shortcut: "",
    Icon: GlobeIcon,
  },
  manage: {
    route: "/playground/manage",
    text: "Manage",
    shortcut: "",
    Icon: StackIcon,
  },
  mint: {
    route: "/mint",
    text: "Mint",
    shortcut: "",
    Icon: TokensIcon,
  },
  mintAccess: {
    route: "/mint/access",
    text: "Access",
    shortcut: "",
    Icon: TargetIcon,
  },
  mintContext: {
    route: "/mint/context",
    text: "Context",
    shortcut: "",
    Icon: BoxModelIcon,
  },
  mintDashboard: {
    route: "/mint",
    text: "Dashboard",
    shortcut: "",
    Icon: TokensIcon,
  },
  mintPolicies: {
    route: "/mint/policies",
    text: "Policies",
    shortcut: "",
    Icon: TransformIcon,
  },
  mintTransfers: {
    route: "/mint/transfers",
    text: "Transfers",
    shortcut: "",
    Icon: WidthIcon,
  },
  openfunds: {
    route: "/playground/openfunds",
    text: "Openfunds Debugger",
    shortcut: "",
    Icon: GearIcon,
  },
  policies: {
    route: "/playground/policies",
    text: "Policies",
    shortcut: "",
    Icon: TransformIcon,
  },
  products: {
    route: "/playground/products",
    text: "Products",
    shortcut: "",
    Icon: BoxModelIcon,
  },
  risk: {
    route: "/playground/risk",
    text: "Risk",
    shortcut: "",
    Icon: DiscIcon,
  },
  settings: {
    route: "/settings",
    text: "Settings",
    shortcut: "",
    Icon: GearIcon,
  },
  shareclasses: {
    route: "/playground/shareclasses",
    text: "Share Classes",
    shortcut: "",
    Icon: DashboardIcon,
  },
  stake: {
    route: "/vault/stake",
    text: "Stake",
    shortcut: "",
    Icon: DownloadIcon,
  },
  trade: {
    route: "/vault/trade",
    text: "Trade",
    shortcut: "",
    Icon: ShuffleIcon,
  },
  transfer: {
    route: "/vault/transfer",
    text: "Transfer",
    shortcut: "",
    Icon: ExitIcon,
  },
  vault: {
    route: "/vault",
    text: "Vault",
    shortcut: "",
    Icon: Component1Icon,
  },
  vaultAccess: {
    route: "/vault/access",
    text: "Access",
    shortcut: "",
    Icon: TargetIcon,
  },
  vaultContext: {
    route: "/vault/context",
    text: "Context",
    shortcut: "",
    Icon: BoxModelIcon,
  },
  vaultDashboard: {
    route: "/vault",
    text: "Dashboard",
    shortcut: "",
    Icon: TokensIcon,
  },
  vaultIntegrations: {
    route: "/vault/integrations",
    text: "Integrations",
    shortcut: "",
    Icon: MixIcon,
  },
  wrap: {
    route: "/playground/wrap",
    text: "Wrap",
    shortcut: "",
    Icon: MarginIcon,
  },
} as const;

// Define path contexts - groups of routes that should show specific items
export const PATH_CONTEXTS = {
  VAULT: ["/vault"],
  MINT: ["/mint"],
  PLAYGROUND: ["/playground"],
  DEFAULT: ["/"],
} as const;

// Define base navigation structures that can be reused
const BASE_STRUCTURES = {
  VAULT: [
    {
      group: "Operations",
      itemKeys: ["holdings", "stake", "trade", "transfer"],
    },
    {
      group: "Configuration",
      itemKeys: ["vaultAccess", "vaultContext", "vaultIntegrations"],
    },
  ],
  MINT: [
    {
      group: "Operations",
      itemKeys: ["supply", "mintTransfers", "holders"],
    },
    {
      group: "Configuration",
      itemKeys: ["mintAccess", "mintContext", "mintPolicies"],
    },
  ],
} as const;

// Helper function to get all item keys from a structure
const getAllItemKeysFromStructure = (
  structure: (typeof BASE_STRUCTURES)[keyof typeof BASE_STRUCTURES]
) => {
  return structure.flatMap((group) => group.itemKeys);
};

// Define navigation structure for each context
const NAVIGATION_STRUCTURE = {
  VAULT: BASE_STRUCTURES.VAULT,
  MINT: BASE_STRUCTURES.MINT,
  PLAYGROUND: [
    {
      group: "Products",
      itemKeys: ["vault", "createVault", "mint", "createMint"],
    },
    {
      group: "Vault Pages",
      itemKeys: getAllItemKeysFromStructure(BASE_STRUCTURES.VAULT),
    },
    {
      group: "Mint Pages",
      itemKeys: getAllItemKeysFromStructure(BASE_STRUCTURES.MINT),
    },
    {
      group: "Other Pages",
      itemKeys: [
        "access",
        "create",
        "flows",
        "integrations",
        "manage",
        "policies",
        "products",
        "risk",
        "settings",
        "shareclasses",
        "wrap",
      ],
    },
    {
      group: "Developer Tools",
      itemKeys: [
        "api",
        "cluster",
        "components",
        "jupiterList",
        "openfunds",
        "idlSearch",
      ],
    },
  ],
} as const;

// Function to get navigation items from structure
const getNavGroupsFromStructure = (
  structure: (typeof NAVIGATION_STRUCTURE)[keyof typeof NAVIGATION_STRUCTURE]
): NavGroup[] => {
  return structure.map((group) => ({
    group: group.group,
    items: group.itemKeys.map(
      (key) => ALL_NAV_ITEMS[key as keyof typeof ALL_NAV_ITEMS]
    ),
  }));
};

// Function to determine which navigation items to show based on current path
export const getNavigationItems = (pathname: string): NavGroup[] => {
  let navItems: NavGroup[] = [];

  if (PATH_CONTEXTS.VAULT.some((path) => pathname.startsWith(path))) {
    navItems = [
      ...navItems,
      ...getNavGroupsFromStructure(NAVIGATION_STRUCTURE.VAULT),
    ];
  }

  if (PATH_CONTEXTS.MINT.some((path) => pathname.startsWith(path))) {
    navItems = [
      ...navItems,
      ...getNavGroupsFromStructure(NAVIGATION_STRUCTURE.MINT),
    ];
  }

  if (PATH_CONTEXTS.PLAYGROUND.some((path) => pathname.startsWith(path))) {
    navItems = [
      ...navItems,
      ...getNavGroupsFromStructure(NAVIGATION_STRUCTURE.PLAYGROUND),
    ];
  }

  return navItems;
};

// Function to check if a route should be enabled in production
export const isRouteEnabled = (route: string): boolean => {
  const prodEnabledRoutes =
    process.env.NEXT_PUBLIC_ENABLED_ROUTES?.split(",") || [];
  return (
    process.env.NODE_ENV === "development" || prodEnabledRoutes.includes(route)
  );
};
