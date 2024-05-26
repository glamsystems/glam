import * as anchor from "@coral-xyz/anchor";
import { Program, IdlAccounts } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionSignature
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";

import { Glam, GlamIDL, GlamProgram, getGlamProgramId } from "../glamExports";
import { GlamClientConfig } from "../clientConfig";
import { FundModel, FundOpenfundsModel } from "../models";

type FundAccount = IdlAccounts<Glam>["fundAccount"];
type FundMetadataAccount = IdlAccounts<Glam>["fundMetadataAccount"];

export class BaseClient {
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
    const createdKey = fundModel?.created?.key || [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getFundName(fundModel))
      ).slice(0, 8)
    ];

    const manager = this.getManager();
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("fund"),
        manager.toBuffer(),
        Uint8Array.from(createdKey)
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

  getTreasuryAta(fundPDA: PublicKey, mint: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(
      this.getTreasuryPDA(fundPDA),
      mint,
      true
    );
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
      fundModel.rawOpenfunds?.legalFundNameIncludingUmbrella ||
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

    if (!fundModel.rawOpenfunds) {
      fundModel.rawOpenfunds = new FundOpenfundsModel({}) as FundOpenfundsModel;
    }

    if (fundModel.shareClasses?.length == 1) {
      // fund with a single share class
      const shareClass = fundModel.shareClasses[0];
      fundModel.name = fundModel.name || shareClass.name;

      fundModel.rawOpenfunds.fundCurrency =
        fundModel.rawOpenfunds?.fundCurrency ||
        shareClass.rawOpenfunds?.shareClassCurrency ||
        null;
    } else {
      // fund with multiple share classes
      // TODO
    }

    // computed fields

    if (fundModel.isEnabled) {
      fundModel.rawOpenfunds.fundLaunchDate =
        fundModel.rawOpenfunds?.fundLaunchDate ||
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
      if (
        shareClass.rawOpenfunds &&
        shareClass.rawOpenfunds.shareClassLifecycle === "active"
      ) {
        shareClass.rawOpenfunds.shareClassLaunchDate =
          shareClass.rawOpenfunds.shareClassLaunchDate ||
          new Date().toISOString().split("T")[0];
      }

      const sharePDA = this.getShareClassPDA(fundPDA, i);
      shareClass.uri = `https://api.glam.systems/metadata/${sharePDA}`;
      shareClass.imageUri = `https://api.glam.systems/image/${sharePDA}.png`;
    });

    return fundModel;
  }

  public async createFund(
    fund: any
  ): Promise<[TransactionSignature, PublicKey]> {
    let fundModel = this.enrichFundModelInitialize(fund);
    const fundPDA = this.getFundPDA(fundModel);
    const treasury = this.getTreasuryPDA(fundPDA);
    const openfunds = this.getOpenfundsPDA(fundPDA);
    const manager = this.getManager();

    const shareClasses = fundModel.shareClasses;
    fundModel.shareClasses = [];

    const txSig = await this.program.methods
      .initialize(fundModel)
      .accounts({
        fund: fundPDA,
        treasury,
        openfunds,
        manager
      })
      .rpc();
    await Promise.all(
      shareClasses.map(async (shareClass, j) => {
        const shareClassMint = this.getShareClassPDA(fundPDA, j);
        return await this.program.methods
          .addShareClass(shareClass)
          .accounts({
            fund: fundPDA,
            shareClassMint,
            openfunds,
            manager,
            tokenProgram: TOKEN_2022_PROGRAM_ID
          })
          .preInstructions([
            ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
          ])
          .rpc();
      })
    );
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

    let fund = {
      ...fundModel,
      ...this.getOpenfundsFromAccounts(fundAccount, openfundsAccount)
    };

    // Add data from fund params to share classes
    fund.shareClasses = fund.shareClasses.map((shareClass: any, i: number) => {
      const fund_param_idx = 1 + i;
      shareClass.allowlist =
        fundAccount.params[fund_param_idx][0].value.vecPubkey?.val;
      shareClass.blocklist =
        fundAccount.params[fund_param_idx][1].value.vecPubkey?.val;
      return shareClass;
    });

    return fund;
  }
}
