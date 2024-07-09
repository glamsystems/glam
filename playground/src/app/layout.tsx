import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ClusterProvider } from "@/components/solana-cluster-provider";
import { GlamProvider } from "@glam/anchor";
import { ReactQueryProvider } from './react-query-provider';

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
      <body className={`${inter.className} flex items-start justify-between`}>
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
                  <Sidebar />
                  <main className="flex justify-center items-center p-[56px] ml-[280px] h-fit w-full">
                    {children}
                  </main>
                  <Toaster />
                </GlamProvider>
              </AppWalletProvider>
            </ClusterProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
