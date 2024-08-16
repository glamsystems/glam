"use client";

import React from "react";
import {
  BoxModelIcon, CardStackIcon, Component1Icon, Crosshair2Icon, DashboardIcon, DownloadIcon, ExitIcon, FilePlusIcon, GlobeIcon, LayersIcon, ListBulletIcon, LoopIcon, MarginIcon, MixerHorizontalIcon, MixIcon, PersonIcon, PlusIcon, StackIcon, TargetIcon, TokensIcon, TransformIcon,
} from "@radix-ui/react-icons";
import AccountMenu from "./AccountMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (// <li className={`ml-1 mr-1 p-0 cursor-pointer opacity-50 hover:opacity-100 ${isActive ? 'text-opacity-100 bg-muted bg-opacity-75' : ''}`}>
    <li className={`relative flex cursor-pointer items-center text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 ml-2 mr-2 p-0 opacity-50 hover:opacity-100 ${isActive ? 'text-opacity-100 bg-muted bg-opacity-75' : ''}`}>
      <Link href={route} className="p-2 flex grow items-center">
        <Icon className="ml-1 mr-3 h-4 w-4" />
        <span className="flex-grow">{text}</span>
        <span className="ml-auto text-xs tracking-widest text-muted-foreground">{shortcut}</span>
      </Link>
    </li>);
}

export default function Sidebar() {
  const navList = [{
    // Adding the Screener link back
    items: [{ route: "/screener", text: "Screener", shortcut: "⌘R", Icon: LayersIcon },],
  }, {
    group: "Manage", items: [{ route: "/create", text: "Create", shortcut: "⌘N", Icon: PlusIcon },
        { route: "/products", text: "Products", shortcut: "⌘F", Icon: StackIcon },
        { route: "/shareclasses", text: "Share Classes", shortcut: "⌘S", Icon: TokensIcon },
        { route: "/policies", text: "Policies", shortcut: "⌘P", Icon: BoxModelIcon },
        { route: "/integrations", text: "Integrations", shortcut: "⌘I", Icon: TransformIcon },
        { route: "/access", text: "Access Control", shortcut: "⌘A", Icon: TargetIcon },
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
      <div className="flex p-[8px]">
        <AccountMenu />
      </div>
      <div className="grow">
        {navList.map((nav, index) => (
          <div key={index} className="mb-4">
            {nav.group && <div className="text-muted-foreground text-xs ml-2 mb-2">{nav.group}</div>}
            <ul className="list-none p-0 m-0">
              {nav.items.map((item, itemIndex) => (
                <SidebarItem key={itemIndex} {...item} />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="min-h-[56px] h-[56px] flex justify-start items-center font-extralight text-xl p-4 select-none border-b bg-zinc-100 dark:bg-zinc-900">
        GLAM *.+
      </div>
    </div>
  );
}
