"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaqDialog } from "@/components/faq-dialog";
import { AnimatedNumber } from "@/components/animated-number";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();
  const [jupDelegated, setJupDelegated] = useState<number | null>(null);

  useEffect(() => {
    if (connected) {
      router.push("/dashboard");
    }
  }, [connected, router]);

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial value
    const fetchLatestStats = async () => {
      try {
        // First, let's log what we're getting back
        const result = await supabase
          .from('fatcat_stats')
          .select('*');  // Let's select all columns first to debug

        console.log('Full query result:', result);

        const { data, error } = await supabase
          .from('fatcat_stats')
          .select('jup_delegated, created_at')  // Let's also get created_at to verify ordering
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('Data:', data, 'Error:', error);

        if (error) throw error;

        if (data && data.length > 0) {
          console.log('Raw jup_delegated value:', data[0].jup_delegated);
          const jupValue = Number(data[0].jup_delegated);
          setJupDelegated(jupValue);
        } else {
          console.log('No stats found');
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchLatestStats();

    // Subscribe to changes
    const channel = supabase
      .channel('fatcat_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fatcat_stats',
        },
        (payload) => {
          if (payload.new && 'jup_delegated' in payload.new) {
            setJupDelegated(payload.new.jup_delegated);
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "linear" }}
    >
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-8 md:p-8 lg:p-4 mt-24 md:mt-32">
        <div className="flex flex-col items-center justify-center space-y-8 md:space-y-4 max-w-6xl w-full">
          <div className="relative w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-2/5 2xl:w-2/3 aspect-video overflow-hidden">
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ scale: 1.01, x: 0, y: -1, rotate: -1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <Image
                src="/cat-final.png"
                alt="FatCat"
                fill
                className="object-cover w-full h-full"
                priority
              />
            </motion.div>
          </div>
          <p className="text-xl sm:text-xl md:text-xl text-center max-w-2xl font-light text-muted-foreground">
            Put your JUP votes on autopilot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pb-4 pt-4 mt-8 w-full justify-center">
            <div className="w-full order-2 sm:order-1"></div>
            <div className="order-1 sm:order-2 flex flex-col w-full justify-center items-center">
              <AnimatedNumber
                value={jupDelegated ?? 69420}
                className="text-5xl font-mono text-primary mb-4"
              />
              <span className="text-muted-foreground text-sm font-mono">
                JUP Delegated
              </span>
            </div>
            <div className="w-full order-3"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center pb-24 sm:pb-4">
            <Link
              href="https://github.com/glamsystems/jupiter-vote-service"
              passHref
              target="_blank"
              rel="noopener noreferrer"
              className="w-full order-2 sm:order-1"
            >
              <Button
                variant="ghost"
                className="opacity-80 hover:opacity-100 transition-opacity w-full"
              >
                View the Code
              </Button>
            </Link>
            <FaqDialog className="order-1 sm:order-2" />
            <Link
              href="https://glam.systems"
              passHref
              target="_blank"
              rel="noopener noreferrer"
              className="w-full order-3"
            >
              <Button
                variant="ghost"
                className="opacity-80 hover:opacity-100 transition-opacity w-full"
              >
                Powered by GLAM *.+
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
