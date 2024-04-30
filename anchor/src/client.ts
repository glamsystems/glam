import * as anchor from "@coral-xyz/anchor";
import { BN, Program, IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionSignature
} from "@solana/web3.js";
import {
  getMint,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";

import { Glam, GlamIDL, GlamProgram, getGlamProgramId } from "./glamExports";
import { GlamClientConfig } from "./clientConfig";

type FundAccount = IdlAccounts<Glam>["fundAccount"];
type FundMetadataAccount = IdlAccounts<Glam>["fundMetadataAccount"];
type FundModel = IdlTypes<Glam>["FundModel"];

export class GlamClient {
  provider: anchor.Provider;
  program: GlamProgram;
  programId: PublicKey;

  public constructor(config?: GlamClientConfig) {
    this.programId = getGlamProgramId(config?.cluster || "devnet");
    if (config?.provider) {
      this.provider = config.provider;
      this.program = new Program(
        GlamIDL,
        this.programId,
        this.provider
      ) as GlamProgram;
    } else {
      const defaultProvider = anchor.AnchorProvider.env();
      const url = defaultProvider.connection.rpcEndpoint;
      const connection = new Connection(url, "confirmed");
      this.provider = new anchor.AnchorProvider(
        connection,
        defaultProvider.wallet,
        {
          ...defaultProvider.opts,
          commitment: "confirmed",
          preflightCommitment: "confirmed"
        }
      );
      anchor.setProvider(this.provider);
      this.program = anchor.workspace.Glam as GlamProgram;
    }
  }

  getManager(): PublicKey {
    return this.provider?.publicKey || new PublicKey(0);
  }

  getFundModel(fund: any): FundModel {
    const defaultFundModel = <FundModel>{
      id: null,
      name: null,
      symbol: null,
      uri: null,
      openfundUri: null,
      isActive: null,
      assets: [],
      assetsWeights: [],
      shareClass: [],
      company: null,
      manager: null,
      created: null
    };
    return {
      ...defaultFundModel,
      ...fund
    };
  }

  getFundPDA(fundModel: FundModel): PublicKey {
    const manager = this.getManager();
    const [fundPDA, fundBump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("fund"),
        manager.toBuffer(),
        Uint8Array.from(fundModel?.created?.key || [])
      ],
      this.programId
    );
    return fundPDA;
  }

  getTreasuryPDA(fundPDA: PublicKey): PublicKey {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("treasury"), fundPDA.toBuffer()],
      this.programId
    );
    return pda;
  }

  getOpenfundPDA(fundPDA: PublicKey): PublicKey {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("openfund"), fundPDA.toBuffer()],
      this.programId
    );
    return pda;
  }

  enrichFundModelInitialize(fundModel: FundModel): FundModel {
    let { name, symbol } = fundModel;

    if (fundModel.shareClass.length == 1) {
      // fund with a single share class
      const shareClass = fundModel.shareClass[0];
      name = fundModel.name || shareClass.name;
      symbol = fundModel.symbol || shareClass.symbol;
    } else {
      // fund with multiple share classes
      // TODO
    }

    // createdKey = hash fund name and get first 8 bytes
    const createdKey = [
      ...Buffer.from(anchor.utils.sha256.hash(fundModel.name || "")).slice(0, 8)
    ];

    return {
      ...fundModel,
      name,
      symbol,
      created: {
        key: createdKey,
        manager: null
      }
    };
  }

  public async createFund(
    fund: any
  ): Promise<[TransactionSignature, PublicKey]> {
    const fundModel = this.enrichFundModelInitialize(this.getFundModel(fund));
    const fundPDA = this.getFundPDA(fundModel);
    const treasury = this.getTreasuryPDA(fundPDA);
    const openfund = this.getOpenfundPDA(fundPDA);
    const manager = this.getManager();

    //TODO: add instructions to "addShareClass" in the same tx
    const txSig = await this.program.methods
      .initializeV2(fundModel)
      .accounts({
        fund: fundPDA,
        treasury,
        openfund,
        share: treasury,
        manager,
        tokenProgram: TOKEN_2022_PROGRAM_ID
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
      ])
      .rpc();
    return [txSig, fundPDA];
  }

  public async fetchFundAccount(fundPDA: PublicKey): Promise<FundAccount> {
    return this.program.account.fundAccount.fetch(fundPDA);
  }

  public async fetchFundMetadataAccount(
    fundPDA: PublicKey
  ): Promise<FundMetadataAccount> {
    const openfund = this.getOpenfundPDA(fundPDA);
    return this.program.account.fundMetadataAccount.fetch(openfund);
  }

  public async fetchFund(fundPDA: PublicKey): Promise<FundModel> {
    const fundAccount = await this.fetchFundAccount(fundPDA);
    const openfundAccount = await this.fetchFundMetadataAccount(fundPDA);
    //TODO rebuild model from accounts
    return this.getFundModel(fundAccount);
  }
}
