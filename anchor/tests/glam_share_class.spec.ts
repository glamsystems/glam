import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import { createFundForTest, fundTestExample, str2seed } from "./setup";
import {
  FundModel,
  GlamClient,
  MSOL,
  ShareClassModel,
  USDC,
  WSOL,
} from "../src";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));
const key2 = Keypair.fromSeed(str2seed("acl_test_key2"));

describe("glam_share_class", () => {
  const glamClient = new GlamClient();
  const glamClientCustomWallet = new GlamClient({ wallet: new Wallet(key1) });
  let fundPDA: PublicKey;

  it("Initialize fund with default account state frozen", async () => {
    const fundForTest = { ...fundTestExample };
    fundForTest.shareClasses[0].allowlist = [glamClient.getManager()];
    fundForTest.shareClasses[0].defaultAccountStateFrozen = true;
    const fundData = await createFundForTest(glamClient, fundForTest);

    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFund(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    expect(fund.shareClasses[0].shareClassAllowlist).toEqual([
      glamClient.getManager(),
    ]);
    expect(fund.shareClasses[0].shareClassBlocklist).toEqual([]);
  });

  it("Mint share class fail due to default state frozen", async () => {
    const recipient = key1.publicKey;
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const mintTo = glamClient.getShareClassAta(recipient, shareClassMint);

    const ix = createAssociatedTokenAccountIdempotentInstruction(
      glamClient.getManager(),
      mintTo,
      recipient,
      shareClassMint,
      TOKEN_2022_PROGRAM_ID
    );

    try {
      const txId = await glamClient.program.methods
        .mintShare(0, new BN(1_000_000_000))
        .accounts({
          recipient,
          shareClassMint,
          fund: fundPDA,
        })
        .preInstructions([ix])
        .rpc();
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.logs).toContain("Program log: Error: Account is frozen");
    }
  });

  it("Thaws token account and mint again", async () => {
    const recipient = key1.publicKey;
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const mintTo = glamClient.getShareClassAta(recipient, shareClassMint);

    const ixCreateAta = createAssociatedTokenAccountIdempotentInstruction(
      glamClient.getManager(),
      mintTo,
      recipient,
      shareClassMint,
      TOKEN_2022_PROGRAM_ID
    );
    const ixUpdateAtaState = await glamClient.program.methods
      .setTokenAccountsStates(0, false)
      .accounts({
        shareClassMint,
        fund: fundPDA,
      })
      .remainingAccounts([
        { pubkey: mintTo, isSigner: false, isWritable: true },
      ])
      .instruction();

    const amount = new BN(1_000_000_000);
    try {
      const txId = await glamClient.program.methods
        .mintShare(0, amount)
        .accounts({
          recipient,
          shareClassMint,
          fund: fundPDA,
        })
        .preInstructions([ixCreateAta, ixUpdateAtaState])
        .rpc();
      console.log("mintShare txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const tokenAccount = await getAccount(
      glamClient.provider.connection,
      mintTo,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(tokenAccount.amount.toString()).toEqual(amount.toString());
  });
});
