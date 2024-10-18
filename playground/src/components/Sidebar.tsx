"use client";

import React from "react";
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
import AccountMenu from "./AccountMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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

interface SidebarItemProps {
  route: string;
  text: string;
  shortcut: string;
  Icon: IconType;
}

function SidebarItem({ route, text, shortcut, Icon }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === route;

  return (
    <li
      className={`focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 relative flex items-center text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 ml-2 mr-2 p-0 transition-all hover:bg-muted opacity-50 hover:opacity-100 cursor-pointer ${
        isActive ? "bg-muted/75" : ""
      }`}
    >
      <Link
        href={route}
        className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 p-2 flex grow items-center min-h-[40px]"
      >
        <Icon className="ml-1 mr-3 h-4 w-4" />
        <span className="flex-grow">{text}</span>
        <span className="ml-auto text-xs tracking-widest text-muted-foreground">
          {shortcut}
        </span>
      </Link>
    </li>
  );
}

export default function Sidebar() {
  const disabledRoutes =
    process.env.NEXT_PUBLIC_DISABLED_ROUTES?.split(",") || [];

  const navList = [
    {
      group: "Investment",
      items: [
        {
          route: "/",
          text: "Screener",
          shortcut: "",
          Icon: LayersIcon,
        },
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
        {
          route: "/risk",
          text: "Risk Management",
          shortcut: "",
          Icon: DiscIcon,
        },
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

  return (
    <motion.div
      className="flex flex-col w-[244px] min-w-[244px] border-r min-h-screen overflow-hidden fixed select-none z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.42 }}
    >
      <div className="flex p-[8px]">
        <AccountMenu />
      </div>
      <div className="grow pt-2">
        {navList.map((nav, index) => (
          <div key={index} className="mb-4">
            {nav.group && (
              <div className="text-muted-foreground opacity-50  text-xs ml-2 mb-2">
                {nav.group}
              </div>
            )}
            <ul className="list-none p-0 m-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0">
              {nav.items.map((item, itemIndex) =>
                disabledRoutes.includes(item.route) ? null : (
                  <SidebarItem key={itemIndex} {...item} />
                )
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="min-h-[56px] h-[56px] flex justify-start items-center font-extralight text-xl p-4 select-none border-b bg-zinc-100 dark:bg-zinc-900">
        GLAM *.+
      </div>
    </motion.div>
  );
}
