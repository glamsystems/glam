"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountMenu from "../AccountMenu";
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
import { useGlam } from "@glamsystems/glam-sdk/react";
import {
  getNavigationItems,
  isRouteEnabled,
  type NavItem,
} from "@/components/sidebar/sidebarConfig";
import { DevOnly } from "@/components/DevOnly";
import { MixIcon } from "@radix-ui/react-icons";

function SidebarNavItem({ route, text, shortcut, Icon }: NavItem) {
  const pathname = usePathname();
  const isActive = pathname === route;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "items-center text-sm outline-none opacity-50 hover:opacity-100 transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0",
          isActive && "opacity-100",
        )}
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
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isHovered, setIsHovered] = useState(false);
  const { userWallet, activeGlamState } = useGlam();

  // Get navigation items based on current path
  const navList = getNavigationItems(pathname);

  const getVisibleItems = (items: NavItem[]) => {
    if (!userWallet.pubkey) {
      return items.filter((item) => item.route === "/");
    }

    if (
      !activeGlamState ||
      (typeof activeGlamState === "object" &&
        Object.keys(activeGlamState).length === 0)
    ) {
      return items.filter((item) =>
        ["/", "/flows", "/create"].includes(item.route),
      );
    }

    return items.filter((item) => isRouteEnabled(item.route));
  };

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
            const visibleItems = getVisibleItems(nav.items);
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

          <DevOnly>
            <SidebarGroup key={"playground"}>
              <SidebarGroupLabel className="text-muted-foreground opacity-50 text-xs">
                {"Playground"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="list-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0">
                  <SidebarNavItem
                    route="/playground"
                    text={"Playground"}
                    Icon={MixIcon}
                    shortcut={""}
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </DevOnly>
        </SidebarContent>
        <SidebarFooter>
          <div
            className={cn(
              "min-h-[40px] h-[40px] flex items-center relative overflow-hidden",
              "select-none transition-all duration-200 ease-linear",
              isCollapsed ? "justify-center" : "justify-start px-2",
              isHovered ? "opacity-100" : "opacity-20",
            )}
          >
            <div className="flex items-center relative w-full">
              <div
                className={cn(
                  "flex items-center transition-all duration-200 ease-linear absolute left-0",
                  isCollapsed
                    ? "opacity-0 translate-x-[-100%]"
                    : "opacity-100 translate-x-0",
                )}
              >
                <span className="font-thin text-2xl whitespace-nowrap">
                  GLAM
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center transition-all duration-200 ease-linear",
                  isCollapsed ? "ml-0" : "ml-[4.2rem]",
                )}
              >
                <span
                  className={cn(
                    "font-thin text-2xl transition-all duration-200 ease-linear",
                    isCollapsed ? "ml-0.5" : "ml-2",
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
