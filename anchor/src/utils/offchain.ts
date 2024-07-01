import { PublicKey } from "@solana/web3.js";

export const API = "api.glam.systems";
export const WEB = "devnet.glam.systems";

export const getMetadataUri = (key: PublicKey) =>
  `https://${API}/metadata/${key.toBase58()}`;

export const getImageUri = (key: PublicKey) =>
  `https://${API}/image/${key.toBase58()}.png`;

export const getFundUri = (key: PublicKey) =>
  `https://${WEB}/#/products/${key.toBase58()}`;
