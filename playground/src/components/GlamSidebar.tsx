"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountMenu from "./AccountMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BoxModelIcon,
  Component1Icon,
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
} from "@radix-ui/react-icons";

type IconType =
  | typeof BoxModelIcon
  | typeof Component1Icon
  | typeof DashboardIcon
  | typeof DiscIcon
  | typeof DownloadIcon
  | typeof ExitIcon
  | typeof FilePlusIcon
  | typeof GlobeIcon
  | typeof LayersIcon
  | typeof ListBulletIcon
  | typeof LoopIcon
  | typeof MarginIcon
  | typeof MixIcon
  | typeof MixerHorizontalIcon
  | typeof MixerVerticalIcon
  | typeof PaddingIcon
  | typeof PlusIcon
  | typeof StackIcon
  | typeof TargetIcon
  | typeof TransformIcon
  | typeof TokensIcon;

interface NavItem {
  route: string;
  text: string;
  shortcut: string;
  Icon: IconType;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navList: NavGroup[] = [
  {
    group: "Investment",
    items: [
      { route: "/", text: "Screener", shortcut: "", Icon: LayersIcon },
      { route: "/flows", text: "Flows", shortcut: "", Icon: LoopIcon },
    ],
  },
  {
    group: "Administration",
    items: [
      { route: "/create", text: "Create", shortcut: "", Icon: PlusIcon },
      { route: "/manage", text: "Product", shortcut: "", Icon: StackIcon },
      {
        route: "/shareclasses",
        text: "Share Classes",
        shortcut: "",
        Icon: DashboardIcon,
      },
      {
        route: "/policies",
        text: "Policies",
        shortcut: "",
        Icon: TransformIcon,
      },
      {
        route: "/integrations",
        text: "Integrations",
        shortcut: "",
        Icon: MixIcon,
      },
      { route: "/risk", text: "Risk Management", shortcut: "", Icon: DiscIcon },
      {
        route: "/access",
        text: "Access Control",
        shortcut: "",
        Icon: TargetIcon,
      },
    ],
  },
  {
    group: "Management",
    items: [
      {
        route: "/holdings",
        text: "Holdings",
        shortcut: "",
        Icon: ListBulletIcon,
      },
      { route: "/wrap", text: "Wrap", shortcut: "", Icon: MarginIcon },
      { route: "/stake", text: "Stake", shortcut: "", Icon: DownloadIcon },
      { route: "/trade", text: "Trade", shortcut: "", Icon: ShuffleIcon },
      { route: "/transfer", text: "Transfer", shortcut: "", Icon: ExitIcon },
    ],
  },
  {
    group: "Utilities",
    items: [
      {
        route: "/jupiter",
        text: "Jupiter Token List",
        shortcut: "",
        Icon: GlobeIcon,
      },
      {
        route: "/openfunds",
        text: "Openfunds Debugger",
        shortcut: "",
        Icon: GearIcon,
      },
    ],
  },
];

function SidebarNavItem({ route, text, shortcut, Icon }: NavItem) {
  const pathname = usePathname();
  const isActive = pathname === route;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={`
          items-center text-sm outline-none transition-all
          hover:bg-muted opacity-50 hover:opacity-100 cursor-pointer
          data-[active=true]:bg-muted/75 data-[active=true]:opacity-100
          focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0
        `}
      >
        <Link
          href={route}
          className="
            focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0
            flex grow items-center w-full
          "
        >
          <Icon />
          <span className="flex-grow">{text}</span>
          {shortcut && (
            <span className="text-xs tracking-widest text-muted-foreground">
              {shortcut}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function RefactoredSidebar() {
  const disabledRoutes =
    process.env.NEXT_PUBLIC_DISABLED_ROUTES?.split(",") || [];
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.42 }}
      className="flex flex-col min-h-screen overflow-hidden select-none z-40 border-r"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Sidebar variant="sidebar" collapsible="icon" className="border-none">
        <SidebarHeader className="flex p-[8px]">
          <AccountMenu />
        </SidebarHeader>
        <SidebarContent className="grow pt-2">
          {navList.map((nav, index) => {
            const visibleItems = nav.items.filter(
              (item) => !disabledRoutes.includes(item.route)
            );
            if (visibleItems.length === 0) return null;
            return (
              <SidebarGroup key={index}>
                <SidebarGroupLabel className="text-muted-foreground opacity-50 text-xs">
                  {nav.group}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="list-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0">
                    {visibleItems.map((item, itemIndex) => (
                      <SidebarNavItem key={itemIndex} {...item} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
        <SidebarFooter>
          <div
            className={cn(
              "min-h-[40px] h-[40px] flex items-center relative overflow-hidden",
              "select-none transition-all duration-200 ease-linear",
              isCollapsed ? "justify-center" : "justify-start px-2",
              isHovered ? "opacity-100" : "opacity-20"
            )}
          >
            <div className="flex items-center relative w-full">
              <div
                className={cn(
                  "flex items-center transition-all duration-200 ease-linear absolute left-0",
                  isCollapsed
                    ? "opacity-0 translate-x-[-100%]"
                    : "opacity-100 translate-x-0"
                )}
              >
                <span className="font-thin text-2xl whitespace-nowrap">
                  GLAM
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center transition-all duration-200 ease-linear",
                  isCollapsed ? "ml-0" : "ml-[4.2rem]"
                )}
              >
                <span
                  className={cn(
                    "font-thin text-2xl transition-all duration-200 ease-linear",
                    isCollapsed ? "ml-0.5" : "ml-2"
                  )}
                >
                  *.+
                </span>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </motion.div>
  );
}
