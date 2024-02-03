// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import type { Counter } from '../target/types/counter';
import { IDL as CounterIDL } from '../target/types/counter';

// Re-export the generated IDL and type
export { Counter, CounterIDL };
export type CounterProgram = Program<Counter>;

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const COUNTER_PROGRAM_ID = new PublicKey(
  '6YExFUKSmNXcj7TANp2HsaVfENPGhiAcJC8kuAZ5vGZw'
);

// This is a helper function to get the program ID for the Counter program depending on the cluster.
export function getCounterProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
      // You only need to update this if you deploy your program on one of these clusters.
      return new PublicKey('CounNZdmsQmWh7uVngV9FXW2dZ6zAgbJyYsvBpqbykg');
    default:
      return COUNTER_PROGRAM_ID;
  }
}
