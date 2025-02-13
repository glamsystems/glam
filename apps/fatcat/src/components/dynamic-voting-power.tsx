"use client";

import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from "framer-motion";
import { BN } from "@coral-xyz/anchor";

const MAX_STAKE_DURATION_SECONDS = 2592000; // 30 days in seconds

interface DynamicVotingPowerProps {
  baseAmount: BN;
  escrowEndsAt: BN;
  className?: string;
}

export function DynamicVotingPower({ baseAmount, escrowEndsAt, className }: DynamicVotingPowerProps) {
  const spring = useSpring(0, {
    damping: 15,
    stiffness: 30,
  });

  const display = useTransform(spring, (current) => {
    // Format with more decimals for smooth animation, but trim trailing zeros
    return Number(current.toFixed(9)).toString();
  });

  useEffect(() => {
    const calculateAndSetPower = () => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = escrowEndsAt.toNumber();

      if (now >= endTime) {
        spring.set(0);
        return;
      }

      const timeRemaining = endTime - now;
      const multiplier = Math.min(timeRemaining / MAX_STAKE_DURATION_SECONDS, 1);

      // Convert baseAmount to number, considering 6 decimals
      const baseAmountNum = Number(baseAmount.toString()) / 1_000_000;
      const currentPower = baseAmountNum * multiplier;

      spring.set(currentPower);
    };

    // Initial calculation
    calculateAndSetPower();

    // Update frequently for smooth countdown
    const interval = setInterval(calculateAndSetPower, 50);

    return () => clearInterval(interval);
  }, [baseAmount, escrowEndsAt, spring]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}
