import type { Metadata } from "next";
import SharedDashboardLayout from "@/components/layouts/SharedDashboardLayout";

export const metadata: Metadata = {
  title: "GLAM *.+ Vault",
  description: "The New Standard for Asset Management.",
};

export default function VaultLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SharedDashboardLayout beta={true}>{children}</SharedDashboardLayout>;
}
