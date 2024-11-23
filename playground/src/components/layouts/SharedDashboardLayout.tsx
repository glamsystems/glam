// app/components/layouts/SharedDashboardLayout.tsx
"use client";

import dynamic from "next/dynamic";
import { ClusterProvider } from "@/components/solana-cluster-provider";
import { GlamProvider } from "@glam/anchor/react";
import BetaWarning from "@/components/BetaWarning";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import GlamSidebar from "@/components/GlamSidebar";
import { motion } from "framer-motion";

const AppWalletProvider = dynamic(
  () => import("@/components/wallet-provider"),
  { ssr: false }
);

export default function SharedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClusterProvider>
      <AppWalletProvider>
        <GlamProvider>
          <SidebarProvider>
            <BetaWarning />
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
