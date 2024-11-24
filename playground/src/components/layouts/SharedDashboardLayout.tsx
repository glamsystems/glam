"use client";

import dynamic from "next/dynamic";
import { ClusterProvider } from "@/components/solana-cluster-provider";
import { GlamProvider } from "@glam/anchor/react";
import BetaWarning from "@/components/BetaWarning";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import GlamSidebar from "@/components/sidebar/GlamSidebar";
import { motion } from "framer-motion";

const AppWalletProvider = dynamic(
  () => import("@/components/wallet-provider"),
  { ssr: false }
);

interface SharedDashboardLayoutProps {
  children: React.ReactNode;
  beta?: boolean;
}

export default function SharedDashboardLayout({
  children,
  beta = false,
}: SharedDashboardLayoutProps) {
  return (
    <ClusterProvider>
      <AppWalletProvider>
        <GlamProvider>
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
                {children}
              </motion.section>
            </div>
          </SidebarProvider>
        </GlamProvider>
      </AppWalletProvider>
    </ClusterProvider>
  );
}
