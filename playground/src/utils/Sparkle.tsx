import {PublicKey} from "@solana/web3.js";
import React from "react";

interface SparkleProps {
  address: string;
  size: number;
}

const defaultSparkleProps: SparkleProps = {
  address: "AdXkDnJpFKqZeoUygLvm5dp2b5JGVPz3rEWfGCtB5Kc2",
  size: 32
}

const Sparkle: React.FC<SparkleProps> = ({ address, size }) => {
  const pubKey = new PublicKey(address);
  const keyBytes = pubKey.toBytes();
  const attributes: any = {};

  // Color
  const r = parseInt(keyBytes.slice(0,7).toString())  % 256;
  const g = parseInt(keyBytes.slice(7,14).toString())  % 256;
  const b = parseInt(keyBytes.slice(14,21).toString())  % 256;
  const angle = parseInt(keyBytes.slice(21,32).toString())  % 360;
  attributes[`color${1}`] = `rgb(${r},${g},${b})`;

  const conicGradient = "conic-gradient(from " + angle + "deg at 50% 50%, " + attributes.color1 + ", rgba(0,0,0,0))"
  const svgViewBox = "0 0 " + String(size) + " " + String(size)

  return (
    <div>
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={svgViewBox} style={{padding: 0, margin: 0}}>
        <foreignObject width="100%" height="100%" style={{margin: 0, background: conicGradient}}>
          <div></div>
        </foreignObject>
      </svg>
      <div>r: {r} </div>
      <div>g: {g}</div>
      <div>b: {b}</div>
      <div>angle: {angle}</div>
      <div>Pub Key: {pubKey.toBase58()}</div>
      <div>Key Bytes: {keyBytes}</div>
    </div>);
}

export default Sparkle;
