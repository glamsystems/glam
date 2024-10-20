import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClusterProvider } from "@/components/solana-cluster-provider";
import { GlamProvider } from "@glam/anchor/react";
import { ReactQueryProvider } from "./react-query-provider";
import MobileOverlay from "@/components/MobileOverlay";
import BetaWarning from "@/components/BetaWarning";
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import GlamSidebar from "@/components/GlamSidebar";

const AppWalletProvider = dynamic(
  () => import("@/components/wallet-provider"),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GLAM *.+",
  description: "The New Standard for Asset Management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} flex items-start justify-between select-none`}
      >
        <MobileOverlay />
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClusterProvider>
              <AppWalletProvider>
                <GlamProvider>
                  <SidebarProvider>
                    <BetaWarning />
                    <div className="relative">
                      <GlamSidebar />
                      <SidebarTrigger className="z-40" />
                    </div>
                    <main className="flex justify-center items-center h-fit w-full">
                      {children}
                    </main>
                    <Toaster />
                  </SidebarProvider>
                </GlamProvider>
              </AppWalletProvider>
            </ClusterProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
