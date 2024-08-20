import * as anchor from "@coral-xyz/anchor";
import { GlamClient, MSOL, USDC, WSOL } from "@glam/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

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
      asset: USDC,
      allowlist: [] as PublicKey[],
      blocklist: [] as PublicKey[],
      // Glam
      lockUpTime: 4 * 60 * 60,
      requiresMemoOnTransfer: true,
      // Openfunds Share Class
      fullShareClassName: "Glam Fund SOL-mSOL",
      isin: "XS1082172823",
      cusip: "demo",
      valor: "demo",
      shareClassCurrency: "SOL",
      shareClassLifecycle: "active",
      investmentStatus: "open",
      shareClassDistributionPolicy: "accumulating",
      shareClassLaunchDate: new Date().toISOString().split("T")[0],
      minimalInitialSubscriptionCategory: "amount",
      minimalInitialSubscriptionInShares: "0",
      minimalInitialSubscriptionInAmount: "1000",
      currencyOfMinimalSubscription: "SOL",
      minimalRedemptionCategory: "shares",
      minimalInitialRedemptionInShares: "1",
      maximumInitialRedemptionInShares: "1000",
      minimalInitialRedemptionInAmount: "0",
      maximumInitialRedemptionInAmount: null,
      currencyOfMinimalOrMaximumRedemption: "SOL",
      shareClassDividendType: "both",
      srri: "4",
      hasLockUpForRedemption: true,
      lockUpComment: "demo",
      lockUpPeriodInDays: "40",
      launchPrice: "100",
      launchPriceCurrency: "USD",
      launchPriceDate: new Date().toISOString().split("T")[0],
    },
  ],
  // Glam
  isEnabled: true,
  // Openfunds (Fund)
  fundDomicileAlpha2: "XS",
  legalFundNameIncludingUmbrella: "Glam Fund SOL-mSOL",
  fundLaunchDate: new Date().toISOString().split("T")[0],
  investmentObjective: "demo",
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
  /*
  const [txId, fundPDA] = await glamClient.createFund(fund);
  console.log("Fund PDA:", fundPDA.toBase58());
  console.log("txId:", txId);

  const fundPDA = new PublicKey("G6AAkp7ZY3aAh8E1Nbpm6f87ngR68XN6KpBmopDJZXCb");
  try {
    const txId = await glamClient.program.methods
      .closeShareClass(0)
      .accounts({
        manager: glamClient.getManager(),
        fund: fundPDA,
        shareClass: glamClient.getShareClassPDA(fundPDA, 0),
        token2022Program: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
    console.log("txId:", txId);
  } catch (error) {
    console.error(error);
    throw error;
  }

  const fundPDA = new PublicKey("G6AAkp7ZY3aAh8E1Nbpm6f87ngR68XN6KpBmopDJZXCb");
  try {
    const txId = await glamClient.program.methods
      .closeFund()
      .accounts({
        manager: glamClient.getManager(),
        fund: fundPDA,
        openfunds: glamClient.getOpenfundsPDA(fundPDA),
        treasury: glamClient.getTreasuryPDA(fundPDA),
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
