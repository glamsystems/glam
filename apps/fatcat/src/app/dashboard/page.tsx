// Dashboard.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, memo, useState } from "react";
import DelegateForm from "../../components/delegate-form";
import VoteList from "@/components/vote-list";
import { motion } from "framer-motion";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
  </div>
);

const DashboardContent = memo(() => (
  <motion.div
    className="min-h-screen flex flex-col"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <main className="flex-grow flex flex-col items-center justify-start py-24 gap-y-4 mt-12 md:mt-10">
      <DelegateForm />
      <VoteList />
    </main>
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
  </motion.div>
));

DashboardContent.displayName = "DashboardContent";

export default function Dashboard() {
  const { connected } = useWallet();
  const router = useRouter();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Always show loading for at most 1s
    const loadingTimer = setTimeout(() => {
      setShowLoading(false);
    }, 1000);

    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    // Redirect if wallet is still not connected after 1s
    if (!showLoading && !connected) {
      router.push("/");
    }
  }, [showLoading, connected, router]);

  // As soon as the wallet is connected, show the page content
  return showLoading && !connected ? <LoadingSpinner /> : <DashboardContent />;
}
