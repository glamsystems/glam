import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  TransactionSignature,
  VersionedTransaction
} from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  mintTo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getAccount,
  createTransferCheckedInstruction
} from "@solana/spl-token";

import { BaseClient } from "./base";

class Asset {
  pricingAccount: PublicKey = new PublicKey("");
  programId?: PublicKey;
}

const ASSETS_DEVNET: Map<string, Asset> = new Map([
  // wSOL
  [
    "So11111111111111111111111111111111111111112",
    {
      pricingAccount: new PublicKey(
        "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix" // pyth
      )
    }
  ],
  // USDC
  [
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    {
      pricingAccount: new PublicKey(
        "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7" // pyth
      )
    }
  ],
  // BTC
  [
    "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
    {
      pricingAccount: new PublicKey(
        "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J" // pyth
      )
    }
  ],
  // ETH
  [
    "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    {
      pricingAccount: new PublicKey(
        "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw" // pyth
      )
    }
  ],
  // mSOL
  [
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    {
      pricingAccount: new PublicKey(
        "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC" // state
      )
    }
  ],

  //
  // LOCALNET
  //

  // USDC
  [
    "AwRP1kuJbykXeF4hcLzfMDMY2ZTGN3cx8ErCWxVYekef",
    {
      pricingAccount: new PublicKey(
        "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7" // pyth
      )
    }
  ],
  // BTC
  [
    "7Pz5yQdyQm64WtzxvpQZi3nD1q5mbxj4Hhcjy2kmZ7Zd",
    {
      pricingAccount: new PublicKey(
        "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J" // pyth
      ),
      programId: TOKEN_2022_PROGRAM_ID
    }
  ],
  // ETH
  [
    "GRxagtBNxzjwxkKdEgW7P1oqU57Amai6ha5F3UBJzU1m",
    {
      pricingAccount: new PublicKey(
        "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw" // pyth
      )
    }
  ]
]);

export class InvestorClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async subscribe(
    fund: PublicKey,
    asset: PublicKey,
    amount: BN,
    shareClassId: number = 0,
    skipState: boolean = true,
    user?: Keypair
  ): Promise<TransactionSignature> {
    if (user === undefined) {
      user = this.base.getWalletSigner();
    }
    const tx = await this.subscribeTx(
      fund,
      user.publicKey,
      asset,
      amount,
      shareClassId,
      skipState
    );
    return await this.base.sendAndConfirm(tx, user);
  }

  /*
   * API methods
   */

  public async subscribeTx(
    fund: PublicKey,
    signer: PublicKey,
    asset: PublicKey,
    amount: BN,
    shareClassId: number = 0,
    skipState: boolean = true
  ): Promise<VersionedTransaction> {
    const shareClass = this.base.getShareClassPDA(fund, shareClassId);
    const signerShareAta = this.base.getShareClassAta(signer, shareClass);
    const assetMeta = ASSETS_DEVNET.get(asset.toBase58());
    const treasuryAta = this.base.getTreasuryAta(
      fund,
      asset,
      assetMeta?.programId
    );
    const signerAssetAta = getAssociatedTokenAddressSync(
      asset,
      signer,
      true,
      assetMeta?.programId
    );

    const fundModel = await this.base.fetchFund(fund);
    const remainingAccounts = (fundModel.assets || []).flatMap((asset) => {
      const assetMeta = ASSETS_DEVNET.get(asset.toBase58()) || new Asset();
      const treasuryAta = this.base.getTreasuryAta(
        fund,
        asset,
        assetMeta?.programId
      );
      return [
        { pubkey: treasuryAta, isSigner: false, isWritable: false },
        { pubkey: assetMeta.pricingAccount, isSigner: false, isWritable: false }
      ];
    });

    const tx = await this.base.program.methods
      .subscribe(amount, skipState)
      .accounts({
        fund,
        shareClass,
        signerShareAta,
        asset,
        treasuryAta,
        signerAssetAta,
        signer,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
      ])
      .transaction();

    return await this.base.intoVersionedTransaction(tx, signer);
  }
}
