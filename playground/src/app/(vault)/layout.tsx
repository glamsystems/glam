// app/(vault)/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import MobileOverlay from "@/components/MobileOverlay";
import SharedDashboardLayout from "@/components/layouts/SharedDashboardLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GLAM *.+ Vault",
  description: "The New Standard for Asset Management.",
};

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileOverlay />
      <SharedDashboardLayout beta={true}>{children}</SharedDashboardLayout>
      <Toaster />
    </>
  );
}
