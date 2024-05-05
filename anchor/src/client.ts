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

  getOpenfundPDA(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("openfund"), fundPDA.toBuffer()],
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
      fundModel.rawOpenfund.legalFundNameIncludingUmbrella ||
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

      fundModel.rawOpenfund.fundCurrency =
        fundModel.rawOpenfund.fundCurrency ||
        shareClass.rawOpenfund.shareClassCurrency;
    } else {
      // fund with multiple share classes
      // TODO
    }

    // computed fields

    if (fundModel.isEnabled) {
      fundModel.rawOpenfund.fundLaunchDate =
        fundModel.rawOpenfund.fundLaunchDate ||
        new Date().toISOString().split("T")[0];
    }

    // fields containing fund id / pda
    const fundPDA = this.getFundPDA(fundModel);
    fundModel.uri =
      fundModel.uri || `https://devnet.glam.systems/products/${fundPDA}`;
    fundModel.openfundUri =
      fundModel.openfundUri ||
      `https://api.glam.systems/openfund/${fundPDA}.xlsx`;

    // share classes
    fundModel.shareClasses.forEach((shareClass, i) => {
      if (shareClass.rawOpenfund.shareClassLifecycle == "active") {
        shareClass.rawOpenfund.shareClassLaunchDate =
          shareClass.rawOpenfund.shareClassLaunchDate ||
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
    const openfund = this.getOpenfundPDA(fundPDA);
    const manager = this.getManager();

    //TODO: add instructions to "addShareClass" in the same tx
    const txSig = await this.program.methods
      .initializeV2(fundModel)
      .accounts({
        fund: fundPDA,
        treasury,
        openfund,
        share,
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

  remapKeyValueArray(vec: Array<any>): any {
    return vec.reduce((prev, el) => {
      prev[Object.keys(el.name)[0]] = el.value;
      return prev;
    }, {});
  }

  public async fetchFund(fundPDA: PublicKey): Promise<any> {
    const fundAccount = await this.fetchFundAccount(fundPDA);
    const openfundAccount = await this.fetchFundMetadataAccount(fundPDA);

    //TODO rebuild model from accounts
    let fundModel = this.getFundModel(fundAccount);
    fundModel.id = fundPDA;
    delete fundModel.manager;

    let shareClasses = openfundAccount.shareClasses.map((shareClass) =>
      this.remapKeyValueArray(shareClass)
    );
    shareClasses.forEach((shareClass, i) => {
      shareClass.shareClassId = fundAccount.shareClasses[i];
    });
    let fundManagers = openfundAccount.fundManagers.map((fundManager) =>
      this.remapKeyValueArray(fundManager)
    );
    fundManagers[0].pubkey = fundAccount.manager;

    const openfundRemapped = {
      ...this.remapKeyValueArray(openfundAccount.fund),
      company: this.remapKeyValueArray(openfundAccount.company),
      fundManagers,
      shareClasses
    };

    return {
      ...fundModel,
      openfund: openfundRemapped
    };
  }
}
