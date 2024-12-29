"use client";

import BetaWarning from "@/components/BetaWarning";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import GlamSidebar from "@/components/sidebar/GlamSidebar";
import { motion } from "framer-motion";
import { Toaster } from "../ui/toaster";

interface SharedDashboardLayoutProps {
  children: React.ReactNode;
  beta?: boolean;
}

export default function SharedDashboardLayout({
  children,
  beta = false,
}: SharedDashboardLayoutProps) {
  return (
    <SidebarProvider>
      {beta && <BetaWarning />}
      <div className="relative flex min-h-screen w-[100dvw]">
        <GlamSidebar />
        <SidebarTrigger className="z-40" />
        <motion.section
          className="flex flex-1 justify-center items-start w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <SidebarInset className="flex justify-start items-center">
            {children}
          </SidebarInset>
        </motion.section>
        {/* Toaster must be within the Cluster Provider context */}
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
