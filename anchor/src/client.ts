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
import { FundModel } from "./models";

type FundAccount = IdlAccounts<Glam>["fundAccount"];
type FundMetadataAccount = IdlAccounts<Glam>["fundMetadataAccount"];

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
    return new FundModel(fund) as FundModel;
  }

  getFundPDA(fundModel: FundModel): PublicKey {
    const manager = this.getManager();
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("fund"),
        manager.toBuffer(),
        Uint8Array.from(fundModel?.created?.key || [])
      ],
      this.programId
    );
    return pda;
  }

  getTreasuryPDA(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("treasury"), fundPDA.toBuffer()],
      this.programId
    );
    return pda;
  }

  getOpenfundsPDA(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("openfunds"), fundPDA.toBuffer()],
      this.programId
    );
    return pda;
  }

  getShareClassPDA(fundPDA: PublicKey, shareId: number): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("share"),
        Uint8Array.from([shareId % 256]),
        fundPDA.toBuffer()
      ],
      this.programId
    );
    return pda;
  }

  getFundName(fundModel: FundModel) {
    return (
      fundModel.name ||
      fundModel.rawOpenfunds.legalFundNameIncludingUmbrella ||
      fundModel.shareClasses[0]?.name ||
      ""
    );
  }

  enrichFundModelInitialize(fund: FundModel): FundModel {
    let fundModel = this.getFundModel(fund);

    // createdKey = hash fund name and get first 8 bytes
    const createdKey = [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getFundName(fundModel))
      ).slice(0, 8)
    ];
    fundModel.created = {
      key: createdKey,
      manager: null
    };

    if (fundModel.shareClasses?.length == 1) {
      // fund with a single share class
      const shareClass = fundModel.shareClasses[0];
      fundModel.name = fundModel.name || shareClass.name;

      fundModel.rawOpenfunds.fundCurrency =
        fundModel.rawOpenfunds.fundCurrency ||
        shareClass.rawOpenfunds.shareClassCurrency;
    } else {
      // fund with multiple share classes
      // TODO
    }

    // computed fields

    if (fundModel.isEnabled) {
      fundModel.rawOpenfunds.fundLaunchDate =
        fundModel.rawOpenfunds.fundLaunchDate ||
        new Date().toISOString().split("T")[0];
    }

    // fields containing fund id / pda
    const fundPDA = this.getFundPDA(fundModel);
    fundModel.uri =
      fundModel.uri || `https://devnet.glam.systems/products/${fundPDA}`;
    fundModel.openfundsUri =
      fundModel.openfundsUri ||
      `https://api.glam.systems/openfunds/${fundPDA}.xlsx`;

    // share classes
    fundModel.shareClasses.forEach((shareClass, i) => {
      if (shareClass.rawOpenfunds.shareClassLifecycle == "active") {
        shareClass.rawOpenfunds.shareClassLaunchDate =
          shareClass.rawOpenfunds.shareClassLaunchDate ||
          new Date().toISOString().split("T")[0];
      }

      const sharePDA = this.getShareClassPDA(fundPDA, i);
      shareClass.imageUri = `https://api.glam.systems/image/${sharePDA}.png`;
    });

    return fundModel;
  }

  public async createFund(
    fund: any
  ): Promise<[TransactionSignature, PublicKey]> {
    const fundModel = this.enrichFundModelInitialize(fund);
    const fundPDA = this.getFundPDA(fundModel);
    const treasury = this.getTreasuryPDA(fundPDA);
    const share = this.getShareClassPDA(fundPDA, 0);
    const openfunds = this.getOpenfundsPDA(fundPDA);
    const manager = this.getManager();

    //TODO: add instructions to "addShareClass" in the same tx
    const txSig = ""; /*await this.program.methods
      .initialize(fundModel)
      .accounts({
        fund: fundPDA,
        treasury,
        openfunds,
        share,
        manager,
        tokenProgram: TOKEN_2022_PROGRAM_ID
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
      ])
      .rpc();*/
    return [txSig, fundPDA];
  }

  public async fetchFundAccount(fundPDA: PublicKey): Promise<FundAccount> {
    return this.program.account.fundAccount.fetch(fundPDA);
  }

  public async fetchFundMetadataAccount(
    fundPDA: PublicKey
  ): Promise<FundMetadataAccount> {
    const openfunds = this.getOpenfundsPDA(fundPDA);
    return this.program.account.fundMetadataAccount.fetch(openfunds);
  }

  remapKeyValueArray(vec: Array<any>): any {
    return vec.reduce((prev, el) => {
      prev[Object.keys(el.name)[0]] = el.value;
      return prev;
    }, {});
  }

  getOpenfundsFromAccounts(
    fundAccount: FundAccount,
    openfundsAccount: FundMetadataAccount
  ): any {
    let shareClasses = openfundsAccount.shareClasses.map((shareClass, i) => ({
      shareClassId: fundAccount.shareClasses[i],
      ...this.remapKeyValueArray(shareClass)
    }));
    let fundManagers = openfundsAccount.fundManagers.map((fundManager) => ({
      pubkey: fundAccount.manager,
      ...this.remapKeyValueArray(fundManager)
    }));

    const company = this.remapKeyValueArray(openfundsAccount.company);

    let openfund = {
      legalFundNameIncludingUmbrella: fundAccount.name,
      ...this.remapKeyValueArray(openfundsAccount.fund),
      company,
      fundManagers,
      shareClasses
    };

    return openfund;
  }

  public async fetchFund(fundPDA: PublicKey): Promise<any> {
    const fundAccount = await this.fetchFundAccount(fundPDA);
    const openfundsAccount = await this.fetchFundMetadataAccount(fundPDA);

    //TODO rebuild model from accounts
    let fundModel = this.getFundModel(fundAccount);
    fundModel.id = fundPDA;

    return {
      ...fundModel,
      ...this.getOpenfundsFromAccounts(fundAccount, openfundsAccount)
    };
  }
}