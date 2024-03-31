import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Pricing } from '../target/types/pricing';

describe('pyth', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Pricing as Program<Pricing>;

  const to = new PublicKey("aLice3kGNMajHriHX8R1e1LmqAzojuidxSiU9JT6hVo");

  it("Does nothing", async () => {
    expect(1).toEqual(1);
  });

  // This test needs pyth and only works on devnet
  // it("Send money", async () => {
  //   try {
  //     const tx = await program.methods
  //       .payUsd(new BN(10))
  //       .accounts({
  //         solUsdPriceAccount: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
  //         to,
  //       }).rpc();
  //       console.log("Tx: ", tx);
  //   } catch(e) {
  //     console.error(e);
  //   }
  // });
});
