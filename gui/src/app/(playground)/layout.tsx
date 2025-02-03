import type { Metadata } from "next";
import SharedDashboardLayout from "@/components/layouts/SharedDashboardLayout";

export const metadata: Metadata = {
  title: "GLAM *.+ Playground",
  description: "The New Standard for Asset Management.",
};

export default function PlaygroundLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SharedDashboardLayout beta={false}>{children}</SharedDashboardLayout>;
}
