// app/(mint)/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import MobileOverlay from "@/components/MobileOverlay";
import SharedDashboardLayout from "@/components/layouts/SharedDashboardLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GLAM *.+ Mint",
  description: "The New Standard for Asset Management.",
};

export default function MintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${inter.className} select-none`}>
      <MobileOverlay />
      <SharedDashboardLayout beta={true}>{children}</SharedDashboardLayout>
    </div>
  );
}
