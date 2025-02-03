"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  static?: boolean;
}

const generateRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const angle = Math.floor(Math.random() * 360);
  return `conic-gradient(from ${angle}deg at 50% 50%, rgb(${r},${g},${b}), rgba(0,0,0,0))`;
};

const StaticSparkleBackground: React.FC<Omit<SparkleBackgroundProps, 'static' | 'hover' | 'interval' | 'visibleCount' | 'fadeOut' | 'fadeInSpeed' | 'fadeOutSpeed'>> = ({
                                                                                                                                                                          className,
                                                                                                                                                                          rows = 3,
                                                                                                                                                                          cols = 3,
                                                                                                                                                                          gap = 0,
                                                                                                                                                                          size = 20,
                                                                                                                                                                          ...rest
                                                                                                                                                                        }) => {
  const sparkleColors = useMemo(() => {
    return Array.from({ length: rows * cols }).map(() => generateRandomColor());
  }, [rows, cols]);

  const gridCells = useMemo(() => sparkleColors.map((color, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const cellSize = size + gap;

    return (
      <div
        key={`${col}-${row}`}
        className="absolute"
        style={{
          top: `${row * cellSize}px`,
          left: `${col * cellSize}px`,
          width: `${size}px`,
          height: `${size}px`,
          background: color,
        }}
      />
    );
  }), [rows, cols, size, gap, sparkleColors]);

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

const AnimatedSparkleBackground: React.FC<Omit<SparkleBackgroundProps, 'static'>> = ({
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
  const [sparkleColors, setSparkleColors] = useState<Record<string, string>>({});
  const [sparkleDelays, setSparkleDelays] = useState<Record<string, number>>({});

  const getRandomDelay = useCallback(() => randomness > 0 ? Math.random() * randomness : 0, [randomness]);

  useEffect(() => {
    if (hover) return;

    const intervalId = setInterval(() => {
      setVisibleSparkles(prev => {
        const newSparkles: Record<string, boolean> = {};
        const newDelays: Record<string, number> = {};
        for (let i = 0; i < visibleCount; i++) {
          const row = Math.floor(Math.random() * rows);
          const col = Math.floor(Math.random() * cols);
          const key = `${col}-${row}`;
          newSparkles[key] = true;
          newDelays[key] = getRandomDelay();
          if (!sparkleColors[key]) {
            setSparkleColors(prevColors => ({
              ...prevColors,
              [key]: generateRandomColor()
            }));
          }
        }
        setSparkleDelays(prev => ({ ...prev, ...newDelays }));
        return fadeOut ? newSparkles : { ...prev, ...newSparkles };
      });
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, visibleCount, rows, cols, hover, fadeOut, sparkleColors, getRandomDelay]);

  const handleHoverStart = useCallback((key: string) => {
    if (hover) {
      setVisibleSparkles(prev => ({ ...prev, [key]: true }));
      setSparkleDelays(prev => ({ ...prev, [key]: 0 }));
      if (!sparkleColors[key]) {
        setSparkleColors(prevColors => ({
          ...prevColors,
          [key]: generateRandomColor()
        }));
      }
    }
  }, [hover, sparkleColors]);

  const handleHoverEnd = useCallback((key: string) => {
    if (hover && fadeOut) {
      setVisibleSparkles(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  }, [hover, fadeOut]);

  const gridCells = useMemo(() => Array.from({ length: rows * cols }).map((_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const key = `${col}-${row}`;
    const cellSize = size + gap;

    return (
      <div
        key={key}
        className="absolute"
        style={{
          top: `${row * cellSize}px`,
          left: `${col * cellSize}px`,
          width: `${size}px`,
          height: `${size}px`,
        }}
        onMouseEnter={() => handleHoverStart(key)}
        onMouseLeave={() => handleHoverEnd(key)}
      >
        <AnimatePresence>
          {visibleSparkles[key] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: {
                  duration: visibleSparkles[key] ? fadeInSpeed : fadeOutSpeed,  // Different durations for fading in and out
                  delay: sparkleDelays[key] || 0
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                background: sparkleColors[key] || generateRandomColor(),
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }), [rows, cols, size, gap, visibleSparkles, sparkleColors, sparkleDelays, fadeInSpeed, fadeOutSpeed, handleHoverStart, handleHoverEnd]);

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

const SparkleBackground: React.FC<SparkleBackgroundProps> = ({ static: isStatic, ...props }) => {
  if (isStatic) {
    return <StaticSparkleBackground {...props} />;
  }
  return <AnimatedSparkleBackground {...props} />;
};

export default SparkleBackground;

// ## SparkleBackground Component Documentation (Markdown)
//
// This component renders a background with animated sparkles. You can customize various aspects of the sparkle behavior.
//
// ### Usage
//
//   ```jsx
// import SparkleBackground from './SparkleBackground';
//
// <SparkleBackground
//   rows={5} // Number of rows of sparkles (default: 3)
//   cols={5} // Number of columns of sparkles (default: 3)
//   size={20} // Size of each sparkle in pixels (default: 20)
//   interval={1000} // Interval in milliseconds for automatic sparkle generation (default: 2000) for animated background, set to 0 for static background
//   visibleCount={3} // Number of sparkles visible at a time (default: 3)
//   hover={true} // Enables sparkle interaction on hover (default: false)
//   randomness={5} // Randomness in positioning new sparkles (default: 5)
//   fadeOut={true} // Enables fading out of sparkles (default: true)
//   fadeInSpeed={0.5} // Duration for fading in sparkles in seconds (default: 1)
//   fadeOutSpeed={1} // Duration for fading out sparkles in seconds (default: 1)
//   gap={5} // Spacing between sparkles in pixels (default: 0)
//   static={true} // Renders a static background with pre-generated sparkles (default: false)
// />
// ```
//
// ### Props
//
// | Prop Name     | Type                 | Default Value | Description                                                                           |
// |----------------|----------------------|----------------|----------------------------------------------------------------------------------------|
// | `className`   | `string`              | `''`           | Optional CSS class name to apply to the container element.                             |
// | `rows`         | `number`              | `3`            | Number of rows of sparkles.                                                              |
// | `cols`         | `number`              | `3`            | Number of columns of sparkles.                                                            |
// | `size`         | `number`              | `20`           | Size of each sparkle in pixels.                                                          |
// | `interval`     | `number`              | `2000`         | Interval in milliseconds for automatic sparkle generation (animated background only). |
// | `visibleCount` | `number`              | `3`            | Number of sparkles visible at a time.                                                    |
// | `hover`        | `boolean`             | `false`         | Enables sparkle interaction on hover (animates sparkles on hover).                     |
// | `randomness`   | `number`              | `5`            | Randomness in positioning new sparkles.                                                   |
// | `fadeOut`      | `boolean`             | `true`          | Enables fading out of sparkles.                                                         |
// | `fadeInSpeed`  | `number`              | `1`             | Duration for fading in sparkles in seconds.                                             |
// | `fadeOutSpeed` | `number`              | `1`             | Duration for fading out sparkles in seconds.                                            |
// | `gap`          | `number`              | `0`            | Spacing between sparkles in pixels.                                                       |
// | `static`       | `boolean`             | `false`         | Renders a static background with pre-generated sparkles.                               |
//
// ### Notes
//
// - For an animated background, set the `interval` prop to a non-zero value (e.g., `1000` milliseconds). Set `interval` to 0 for a static background.
// - The `hover` prop only has an effect when set to `true`.
// - The `randomness` prop affects the randomness in positioning new sparkles when `interval` is set.
// - Fading behavior is controlled by `fadeOut` and `fadeInSpeed/fadeOutSpeed`.
// - Use `static` to render a static background with pre-generated sparkles.
//
//   This component utilizes Framer Motion for the animations. Refer to Framer Motion documentation for detailed information on available animation options.
