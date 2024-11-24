// config/sidebar.ts
import {
  BoxModelIcon,
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
  PlusIcon,
  ShuffleIcon,
  StackIcon,
  TargetIcon,
  TokensIcon,
  TransformIcon,
  LightningBoltIcon,
  ActivityLogIcon,
} from "@radix-ui/react-icons";

export type IconType =
  | typeof ActivityLogIcon
  | typeof BoxModelIcon
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
  | typeof PlusIcon
  | typeof ShuffleIcon
  | typeof StackIcon
  | typeof TargetIcon
  | typeof TokensIcon
  | typeof TransformIcon
  | typeof LightningBoltIcon;

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
  flows: {
    route: "/playground/flows",
    text: "Flows",
    shortcut: "",
    Icon: LoopIcon,
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
  screener: {
    route: "/playground/screener",
    text: "Screener",
    shortcut: "",
    Icon: LayersIcon,
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
      itemKeys: ["holdings", "wrap", "stake", "trade", "transfer"],
    },
  ],
  MINT: [
    {
      group: "Operations",
      itemKeys: [],
    },
  ],
} as const;

// Define navigation structure for each context
const NAVIGATION_STRUCTURE = {
  VAULT: BASE_STRUCTURES.VAULT,
  MINT: BASE_STRUCTURES.MINT,
  PLAYGROUND: [
    {
      group: "Products",
      itemKeys: ["vault", "mint"],
    },
    {
      group: "Vault Pages",
      itemKeys: [...BASE_STRUCTURES.VAULT[0].itemKeys],
    },
    {
      group: "Mint Pages",
      itemKeys: [...BASE_STRUCTURES.MINT[0].itemKeys],
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
        "screener",
        "settings",
        "shareclasses",
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
