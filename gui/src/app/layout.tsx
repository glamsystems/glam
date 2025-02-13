import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "./react-query-provider";
import React from "react";
import MobileOverlay from "@/components/MobileOverlay";
import { ClusterProvider, GlamProvider } from "@glamsystems/glam-sdk/react";
import AppWalletProvider from "@/components/wallet-provider";

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
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${inter.className} min-h-screen h-full flex flex-col select-none`}
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
                  <main className="flex-1 flex min-h-screen w-full">
                    {children}
                  </main>
                </GlamProvider>
              </AppWalletProvider>
            </ClusterProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
