import * as anchor from "@coral-xyz/anchor";
import { GlamClient, MSOL, USDC, WSOL } from "@glam/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";

const anchorProvider = anchor.AnchorProvider.env();

const glamClient = new GlamClient({
  provider: anchorProvider,
  cluster: "mainnet-beta",
});

console.log("Program ID:", glamClient.programId.toBase58());
console.log("Wallet connected:", glamClient.getManager().toBase58());
console.log("RPC endpoint:", glamClient.provider.connection.rpcEndpoint);

export const fund = {
  shareClasses: [
    {
      // Glam Token
      name: "Glam Fund SOL-mSOL",
      symbol: "GBS",
      asset: WSOL,
      allowlist: [] as PublicKey[],
      blocklist: [] as PublicKey[],

      // Glam
      lockUpTime: 0,

      // Openfunds Share Class
      fullShareClassName: "Glam Fund SOL-mSOL",
      isin: "",
      cusip: "",
      valor: "",
      shareClassCurrency: "SOL",
      shareClassLifecycle: "active",
      investmentStatus: "open",
      shareClassDistributionPolicy: "accumulating",
      shareClassLaunchDate: new Date().toISOString().split("T")[0],
      minimalInitialSubscriptionCategory: "amount",
      minimalInitialSubscriptionInShares: "0",
      minimalInitialSubscriptionInAmount: "1",
      currencyOfMinimalSubscription: "SOL",
      minimalRedemptionCategory: "shares",
      minimalInitialRedemptionInShares: "1",
      maximumInitialRedemptionInShares: "1000",
      minimalInitialRedemptionInAmount: "0",
      maximumInitialRedemptionInAmount: null,
      currencyOfMinimalOrMaximumRedemption: "SOL",
      shareClassDividendType: "both",
      srri: "7",
      hasLockUpForRedemption: true,
      lockUpComment: "",
      lockUpPeriodInDays: "0",
      launchPrice: "1",
      launchPriceCurrency: "SOL",
      launchPriceDate: new Date().toISOString().split("T")[0],
    },
  ],

  // Glam
  isEnabled: true,
  assets: [WSOL, MSOL],
  assetsWeights: [0, 100],

  // Openfunds (Fund)
  fundDomicileAlpha2: "XS",
  legalFundNameIncludingUmbrella: "Glam Fund SOL-mSOL",
  fundLaunchDate: new Date().toISOString().split("T")[0],
  investmentObjective: "Glam Fund SOL-mSOL",
  fundCurrency: "SOL",
  openEndedOrClosedEndedFundStructure: "open-ended fund",
  fiscalYearEnd: "12-31",
  legalForm: "other",

  // Openfunds Company (simplified)
  company: {
    fundGroupName: "Glam Systems",
    manCo: "Glam Management",
    domicileOfManCo: "CH",
    emailAddressOfManCo: "hello@glam.systems",
    fundWebsiteOfManCo: "https://glam.systems",
  },

  // Openfunds Manager (simplified)
  manager: {
    portfolioManagerName: "glam.sol",
  },
};
async function main(): Promise<void> {
  // Update the fund object listed above before creating the fund
  /*
  const [txId, fundPDA] = await glamClient.createFund(fund);
  console.log("Fund PDA:", fundPDA.toBase58());
  console.log("txId:", txId);
  */

  // Update the fund pubkey before closing the share class
  /*
  const fundPDA = new PublicKey("Dc88inhuwymwyvVR7Sy7MdeYyxsAvPaCgYZfAQsY3skJ");
  try {
    const txId = await glamClient.program.methods
      .closeShareClass(0)
      .accounts({
        fund: fundPDA,
        shareClassMint: glamClient.getShareClassPDA(fundPDA, 0),
        openfunds: glamClient.getOpenfundsPDA(fundPDA),
      })
      .rpc();
    console.log("txId:", txId);
  } catch (error) {
    console.error(error);
    throw error;
  }
  */

  // Update the fund pubkey before closing the fund
  /*
  const fundPDA = new PublicKey("Dc88inhuwymwyvVR7Sy7MdeYyxsAvPaCgYZfAQsY3skJ");
  try {
    const txId = await glamClient.program.methods
      .closeFund()
      .accounts({
        fund: fundPDA,
        openfunds: glamClient.getOpenfundsPDA(fundPDA),
      })
      .rpc();
    console.log("txId:", txId);
  } catch (error) {
    console.error(error);
    throw error;
  }
  */
}

main();
