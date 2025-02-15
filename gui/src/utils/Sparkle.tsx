"use client";

import { PublicKey } from "@solana/web3.js";
const crypto = require("crypto");
import React, { useEffect } from "react";

interface SparkleProps {
  address: string;
  size: number;
  onColorGenerated?: (color: string) => void; // Optional prop
}

const defaultSparkleProps: SparkleProps = {
  address: "So11111111111111111111111111111111111111111",
  size: 32,
};

const Sparkle: React.FC<SparkleProps> = ({
  address,
  size,
  onColorGenerated,
}) => {
  if (!address) return null;
  const pubKey = new PublicKey(address);
  const keyBytes = pubKey.toBytes();
  const hash = crypto.createHash("sha256").update(keyBytes).digest("hex");

  // 6,039,797,760 Unique Combinations

  // Color New
  // const r = parseInt(keyBytes.slice(0,7).toString())  % 256;
  // const g = parseInt(keyBytes.slice(7,14).toString())  % 256;
  // const b = parseInt(keyBytes.slice(14,21).toString())  % 256;
  // const angle = parseInt(keyBytes.slice(21,32).toString())  % 360;

  // Color Legacy
  const r = parseInt(hash.substring(0, 4), 16) % 256;
  const g = parseInt(hash.substring(4, 8), 16) % 256;
  const b = parseInt(hash.substring(8, 12), 16) % 256;
  const angle = parseInt(hash.substring(12, 18), 16) % 360;

  const color = `rgb(${r},${g},${b})`;

  const conicGradient =
    "conic-gradient(from " +
    angle +
    "deg at 50% 50%, " +
    color +
    ", rgba(0,0,0,0))";
  const svgViewBox = "0 0 " + String(size) + " " + String(size);

  useEffect(() => {
    if (onColorGenerated) {
      onColorGenerated(color); // Only call if the prop is provided
    }
  }, [color, onColorGenerated]);

  return (
    <div
      style={{
        width: size,
        height: size,
        padding: 0,
        margin: 0,
        background: conicGradient,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox={svgViewBox}
        style={{ display: "block" }}
      ></svg>
    </div>
  );
};

export default Sparkle;
