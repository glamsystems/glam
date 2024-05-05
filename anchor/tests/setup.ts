import { Program, Wallet, workspace } from "@coral-xyz/anchor";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { Glam } from "../target/types/glam";
import { getMetadataUri, getImageUri, getFundUri } from "../src/offchain";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"; // Fix import warning in VSCode

const program = workspace.Glam as Program<Glam>;

const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"); // 6 decimals
const eth = new PublicKey("So11111111111111111111111111111111111111112"); // 6 decimals
const btc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv"); // 9 decimals

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createFundForTest = async (
  name: string,
  symbol: string,
  manager: Wallet
) => {
  const [fundPDA, fundBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("fund"), manager.publicKey.toBuffer(), Buffer.from(name)],
    program.programId
  );

  const [treasuryPDA, treasuryBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), fundPDA.toBuffer()],
    program.programId
  );

  const shareClassSymbol = `${symbol}.A`;
  const [sharePDA, shareBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("share"), Buffer.from(shareClassSymbol), fundPDA.toBuffer()],
    program.programId
  );
  const shareClassMetadata = {
    name: `${name} - A Share`,
    symbol: shareClassSymbol,
    uri: getMetadataUri(sharePDA),
    shareClassAsset: "USDC",
    shareClassAssetId: usdc,
    isin: "XS1082172823",
    status: "open",
    feeManagement: 15_000, // 1_000_000 * 0.015,
    feePerformance: 100_000, // 1_000_000 * 0.1,
    policyDistribution: "accumulating",
    extension: "",
    launchDate: "2024-04-01",
    lifecycle: "active",
    imageUri: getImageUri(sharePDA)
  };

  try {
    let txId = await program.methods
      .initialize(name, symbol, getFundUri(fundPDA), [10, 50, 40], true)
      .accounts({
        fund: fundPDA,
        treasury: treasuryPDA,
        manager: manager.publicKey
      })
      .remainingAccounts([
        { pubkey: usdc, isSigner: false, isWritable: false },
        { pubkey: btc, isSigner: false, isWritable: false },
        { pubkey: eth, isSigner: false, isWritable: false }
      ])
      .rpc({ commitment: "confirmed" });
    console.log(`Fund ${fundPDA} initialized, txId: ${txId}`);

    txId = await program.methods
      .addShareClass(shareClassMetadata)
      .accounts({
        fund: fundPDA,
        shareClassMint: sharePDA,
        manager: manager.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
      ])
      .rpc({ commitment: "confirmed" });
    console.log(`Share class ${sharePDA} added, txId: ${txId}`);
  } catch (e) {
    console.error(e);
    throw e;
  }

  return { fundPDA, fundBump, treasuryPDA, treasuryBump, sharePDA, shareBump };
};
