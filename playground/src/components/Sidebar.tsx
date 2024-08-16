"use client";

import React from "react";
import {
  BoxModelIcon, CardStackIcon, Component1Icon, Crosshair2Icon, DashboardIcon, DownloadIcon, ExitIcon, FilePlusIcon, GlobeIcon, LayersIcon, ListBulletIcon, LoopIcon, MarginIcon, MixerHorizontalIcon, MixIcon, PersonIcon, PlusIcon, StackIcon, TargetIcon, TokensIcon, TransformIcon,
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
  | typeof FilePlusIcon
  | typeof GlobeIcon
  | typeof LayersIcon
  | typeof ListBulletIcon
  | typeof LoopIcon
  | typeof MarginIcon
  | typeof MixIcon
  | typeof MixerHorizontalIcon
  | typeof PlusIcon
  | typeof StackIcon
  | typeof TargetIcon
  | typeof TransformIcon
  | typeof TokensIcon
  ;

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
      //group: "Investor",
      items: [
        { route: "/screener", text: "Screener", shortcut: "⌘R", Icon: LayersIcon },
      ],
    },
    {
      group: "Manage",
      items: [
        { route: "/create", text: "Create", shortcut: "⌘N", Icon: PlusIcon },
        { route: "/products", text: "Products", shortcut: "⌘F", Icon: StackIcon },
        { route: "/shareclasses", text: "Share Classes", shortcut: "⌘S", Icon: TokensIcon },
        { route: "/policies", text: "Investment Policies", shortcut: "⌘P", Icon: BoxModelIcon },
        { route: "/integrations", text: "Venues & Integrations", shortcut: "⌘I", Icon: TransformIcon },
        { route: "/access", text: "Access Management", shortcut: "⌘A", Icon: TargetIcon },
      ],
    },
    {
      group: "Actions",
      items: [
        { route: "/holdings", text: "Holdings", shortcut: "⌘H", Icon: ListBulletIcon},
        { route: "/wrap", text: "Wrap", shortcut: "⌘W", Icon: MarginIcon },
        { route: "/stake", text: "Stake", shortcut: "⌘K", Icon: DownloadIcon },
        { route: "/trade", text: "Trade", shortcut: "⌘L", Icon: LoopIcon },
        { route: "/transfer", text: "Transfer", shortcut: "⌘J", Icon: ExitIcon },
      ],
    },
    {
      group: "Utilities",
      items: [
        {
          route: "/jupiter",
          text: "Jupiter Token List",
          shortcut: "⌘T",
          Icon: GlobeIcon,
        },
      ],
    }
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
      {/* <AccountMenu /> */}
      <WalletMultiButton style={{}} />
    </div>
  );
}
