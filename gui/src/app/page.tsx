"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DevOnly } from "@/components/DevOnly";
import { MixIcon } from "@radix-ui/react-icons";

export default function Products() {
  return (
    <motion.div
      className="flex flex-col sm:flex-row justify-center w-[100dvw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Link
        href={"/vault"}
        prefetch={true}
        className="w-full h-[50dvh] sm:h-[100dvh]"
      >
        <button className="text-4xl font-extralight text-muted-foreground/50 hover:text-foreground w-full h-full hover:bg-muted transition-all">
          Vault
        </button>
      </Link>
      <div className="flex justify-center items-center absolute self-center text-center text-5xl font-thin bg-background h-32 w-32">
        <span>*.+</span>
      </div>
      <Link
        href={"/mint"}
        prefetch={true}
        className="w-full h-[50dvh] sm:h-[100dvh]"
      >
        <button className="text-4xl font-extralight text-muted-foreground/50 hover:text-foreground w-full h-full hover:bg-muted transition-all">
          Mint
        </button>
      </Link>
      <DevOnly>
        <Link
          href="/playground"
          className="flex justify-center items-center absolute self-center text-center text-5xl font-thin bg-background h-32 w-32 transition-all text-muted hover:text-foreground"
        >
          <MixIcon width={42} height={42} />
        </Link>
      </DevOnly>
    </motion.div>
  );
}
