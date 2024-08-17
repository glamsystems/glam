"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import crypto from 'crypto';

interface SparkleBackgroundProps {
  className?: string;
  interval?: number;
  visibleCount?: number;
  hover?: boolean;
  randomness?: number;
  rows?: number;
  cols?: number;
  fadeOut?: boolean;
  fadeInSpeed?: number;
  fadeOutSpeed?: number;
  gap?: number;
  size?: number;
}

const SparkleBackgroundCore: React.FC<SparkleBackgroundProps> = ({
                                                                   className,
                                                                   interval = 2000,
                                                                   visibleCount = 3,
                                                                   hover = false,
                                                                   randomness = 5,
                                                                   rows = 3,
                                                                   cols = 3,
                                                                   fadeOut = true,
                                                                   fadeInSpeed = 1,
                                                                   fadeOutSpeed = 1,
                                                                   gap = 0,
                                                                   size = 20,
                                                                   ...rest
                                                                 }) => {
  const [visibleSparkles, setVisibleSparkles] = useState<Record<string, boolean>>({});
  const [fadingSparkles, setFadingSparkles] = useState<Record<string, boolean>>({});

  const generateSparkleProperties = useCallback((identifier: string) => {
    const hashHex = crypto.createHash('sha256').update(identifier).digest('hex');
    const r = parseInt(hashHex.substring(0, 4), 16) % 256;
    const g = parseInt(hashHex.substring(4, 8), 16) % 256;
    const b = parseInt(hashHex.substring(8, 12), 16) % 256;
    const angle = parseInt(hashHex.substring(12, 18), 16) % 360;
    const color = `rgb(${r},${g},${b})`;
    return `conic-gradient(from ${angle}deg at 50% 50%, ${color}, rgba(0,0,0,0))`;
  }, []);

  const getRandomDelay = useCallback(() => randomness > 0 ? Math.random() * randomness : 0, [randomness]);

  useEffect(() => {
    if (hover) return;

    const intervalId = setInterval(() => {
      setVisibleSparkles(prev => {
        const newSparkles: Record<string, boolean> = {};
        for (let i = 0; i < visibleCount; i++) {
          const row = Math.floor(Math.random() * rows);
          const col = Math.floor(Math.random() * cols);
          newSparkles[`${col}-${row}`] = true;
        }
        return fadeOut ? newSparkles : { ...prev, ...newSparkles };
      });
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, visibleCount, rows, cols, hover, fadeOut]);

  const handleHoverStart = useCallback((key: string) => {
    if (hover) {
      setVisibleSparkles(prev => ({ ...prev, [key]: true }));
      setFadingSparkles(prev => ({ ...prev, [key]: false }));
    }
  }, [hover]);

  const handleHoverEnd = useCallback((key: string) => {
    if (hover && fadeOut) {
      setFadingSparkles(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setVisibleSparkles(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        setFadingSparkles(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }, fadeOutSpeed * 1000);
    }
  }, [hover, fadeOut, fadeOutSpeed]);

  const gridCells = Array.from({ length: rows * cols }).map((_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const key = `${col}-${row}`;
    const conicGradient = generateSparkleProperties(key);
    const randomDelay = getRandomDelay();

    const cellSize = size + gap;

    return (
      <motion.div
        key={key}
        className="absolute"
        style={{
          top: `${row * cellSize}px`,
          left: `${col * cellSize}px`,
          width: `${size}px`,
          height: `${size}px`,
        }}
        onHoverStart={() => handleHoverStart(key)}
        onHoverEnd={() => handleHoverEnd(key)}
      >
        <AnimatePresence>
          {visibleSparkles[key] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: fadingSparkles[key] ? fadeOutSpeed : fadeInSpeed,
                delay: hover ? 0 : randomDelay,
              }}
              style={{
                width: '100%',
                height: '100%',
                background: conicGradient,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  });

  return (
    <div
      className={cn('relative', className)}
      style={{
        width: `${cols * (size + gap) - gap}px`,
        height: `${rows * (size + gap) - gap}px`,
        overflow: 'hidden',
      }}
      {...rest}
    >
      {gridCells}
    </div>
  );
};

export const SparkleBackground = React.memo(SparkleBackgroundCore);

export default SparkleBackground;
