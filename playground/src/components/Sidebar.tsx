"use client";

import React from "react";
import {
  BoxModelIcon, CardStackIcon, Component1Icon, Crosshair2Icon, DashboardIcon, DownloadIcon, ExitIcon, FilePlusIcon, GlobeIcon, LayersIcon, ListBulletIcon, LoopIcon, MarginIcon, MixerHorizontalIcon, MixIcon, PersonIcon, PlusIcon, ShuffleIcon, StackIcon, TargetIcon, TokensIcon, TransformIcon
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

  return (
    <li className={`relative flex items-center text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 ml-2 mr-2 p-0 transition-all hover:bg-muted opacity-50 hover:opacity-100 cursor-pointer ${isActive ? 'bg-muted/75' : ''}`}>
      <Link href={route} className="p-2 flex grow items-center min-h-[40px]">
        <Icon className="ml-1 mr-3 h-4 w-4" />
        <span className="flex-grow">{text}</span>
        <span className="ml-auto text-xs tracking-widest text-muted-foreground">{shortcut}</span>
      </Link>
    </li>);
}

export default function Sidebar() {
  const navList = [{
    group: "Investment",
    items: [
      { route: "/screener", text: "Screener", shortcut: "", Icon: LayersIcon },
      { route: "/flows", text: "Flows", shortcut: "", Icon: LoopIcon },
    ],
  }, {
    group: "Administration", items: [{ route: "/create", text: "Create", shortcut: "", Icon: PlusIcon },
        { route: "/products", text: "Products", shortcut: "", Icon: StackIcon },
        { route: "/shareclasses", text: "Share Classes", shortcut: "", Icon: TokensIcon },
        { route: "/policies", text: "Policies", shortcut: "", Icon: BoxModelIcon },
        { route: "/integrations", text: "Integrations", shortcut: "", Icon: TransformIcon },
        { route: "/access", text: "Access Control", shortcut: "", Icon: TargetIcon },
      ],
    },
    {
      group: "Management",
      items: [
        { route: "/holdings", text: "Holdings", shortcut: "", Icon: ListBulletIcon},
        { route: "/stake", text: "Stake", shortcut: "", Icon: DownloadIcon },
        { route: "/wrap", text: "Wrap", shortcut: "", Icon: MarginIcon },
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
      ],
    }
  ];

  return (
    <div className="flex flex-col w-[280px] min-w-[280px] border-r min-h-screen overflow-hidden fixed">
      <div className="flex p-[8px]">
        <AccountMenu />
      </div>
      <div className="grow pt-2">
        {navList.map((nav, index) => (
          <div key={index} className="mb-4">
            {nav.group && <div className="text-muted-foreground opacity-50  text-xs ml-2 mb-2">{nav.group}</div>}
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
