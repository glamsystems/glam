"use client";

import React from "react";
import {
  BoxModelIcon,
  Component1Icon,
  DashboardIcon,
  DownloadIcon,
  ExitIcon,
  GlobeIcon,
  LayersIcon,
  ListBulletIcon,
  LoopIcon,
  MixerHorizontalIcon,
  MixIcon,
  PlusIcon,
  TransformIcon,
} from "@radix-ui/react-icons";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import AccountMenu from "./AccountMenu";
import Link from "next/link";
import FeedbackInput from "@/components/FeedbackInput";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type IconType =
  | typeof BoxModelIcon
  | typeof Component1Icon
  | typeof DashboardIcon
  | typeof DownloadIcon
  | typeof ExitIcon
  | typeof GlobeIcon
  | typeof LayersIcon
  | typeof ListBulletIcon
  | typeof LoopIcon
  | typeof MixIcon
  | typeof MixerHorizontalIcon
  | typeof PlusIcon
  | typeof TransformIcon;

interface SidebarItemProps {
  route: string;
  text: string;
  shortcut: string;
  Icon: IconType;
}

function SidebarItem({ route, text, shortcut, Icon }: SidebarItemProps) {
  return (
    <CommandItem>
      <Link href={route} className="flex grow items-center">
        <Icon className="mr-2 h-4 w-4" />
        {text}
        <CommandShortcut>{shortcut}</CommandShortcut>
      </Link>
    </CommandItem>
  );
}

export default function Sidebar() {
  const navList = [
    {
      group: "Manager",
      items: [
        {
          route: "/holdings",
          text: "Holdings",
          shortcut: "⌘H",
          Icon: ListBulletIcon,
        },
        /*{ route: "/dashboard", text: "Dashboard", shortcut: "⌘D", Icon: DashboardIcon },
        { route: "/policies", text: "Policies", shortcut: "⌘P", Icon: TransformIcon },
        { route: "/roles", text: "Roles", shortcut: "⌘R", Icon: Component1Icon },
        { route: "/settings", text: "Settings", shortcut: "⌘N", Icon: MixerHorizontalIcon },
        { route: "/create", text: "Create Product", shortcut: "⌘N", Icon: PlusIcon }*/
      ],
    },
    {
      group: "Trader",
      items: [
        { route: "/trade", text: "Trade", shortcut: "⌘L", Icon: LoopIcon },
        { route: "/stake", text: "Stake", shortcut: "⌘K", Icon: DownloadIcon },
        {
          route: "/transfer",
          text: "Transfer",
          shortcut: "⌘J",
          Icon: ExitIcon,
        },
        { route: "/wrap", text: "Wrap", shortcut: "⌘W", Icon: BoxModelIcon },
      ],
    },
    {
      group: "Investor",
      items: [
        {
          route: "/screener",
          text: "Screener",
          shortcut: "⌘S",
          Icon: LayersIcon,
        },
        /*{ route: "/portfolio", text: "Portfolio", shortcut: "⌘A", Icon: MixIcon },*/
      ],
    },
    {
      group: "Utilities",
      items: [
        {
          route: "/assets",
          text: "Assets",
          shortcut: "⌘A",
          Icon: GlobeIcon,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col w-[280px] min-w-[280px] border-r min-h-screen overflow-hidden fixed">
      <div className="min-h-[56px] h-[56px] flex justify-start items-center font-extralight text-xl p-4 select-none border-b bg-zinc-100 dark:bg-zinc-900">
        GLAM *.+
      </div>
      <div className="grow">
        <Command style={{ overflow: "visible" }}>
          <CommandList style={{ overflow: "visible" }}>
            {navList.map((nav, index) => (
              <CommandGroup key={index} heading={nav.group}>
                {nav.items.map((item, itemIndex) => (
                  <SidebarItem key={itemIndex} {...item} />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
      <div className="p-4">
        <FeedbackInput />
      </div>
      {/* <AccountMenu /> */}
      <WalletMultiButton style={{}} />
    </div>
  );
}
