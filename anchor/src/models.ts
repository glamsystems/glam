import { IdlTypes, IdlAccounts } from "@coral-xyz/anchor";
import { Glam, GlamIDLJson } from "./glamExports";
import { PublicKey } from "@solana/web3.js";
import { ExtensionType, getExtensionData, Mint } from "@solana/spl-token";
import { TokenMetadata, unpack } from "@solana/spl-token-metadata";

export const GlamIntegrations =
  GlamIDLJson?.types
    ?.find((t) => t.name === "IntegrationName")
    ?.type?.variants?.map((v) => v.name) ?? [];

export const VaultIntegrations = GlamIntegrations.filter((i) => i !== "Mint");

const GlamProgramId = new PublicKey(GlamIDLJson.address);

// FIXME: Anchor is not able to handle enums with too many options
// The culprit of so many broken types suppressed by @ts-ignore is ShareClassFieldName, which
// has 100+ options.

// @ts-ignore
export type FundAccount = IdlAccounts<Glam>["fundAccount"];
export type FundMetadataAccount = IdlAccounts<Glam>["fundMetadataAccount"];

export type FundModelType = IdlTypes<Glam>["fundModel"];
export class FundIdlModel implements FundModelType {
  id: PublicKey | null;
  name: string | null;
  uri: string | null;
  openfundsUri: string | null;
  isEnabled: boolean | null;
  assets: PublicKey[];
  assetsWeights: number[]; // deprecated
  externalTreasuryAccounts: PublicKey[];
  shareClasses: ShareClassModel[];
  company: CompanyModel | null;
  manager: ManagerModel | null;
  created: CreatedModel | null;
  delegateAcls: DelegateAcl[];
  integrationAcls: IntegrationAcl[];
  driftMarketIndexesPerp: number[];
  driftMarketIndexesSpot: number[];
  driftOrderTypes: number[];
  isRawOpenfunds: boolean;
  rawOpenfunds: FundOpenfundsModel | null;

  constructor(data: Partial<FundModelType>) {
    this.id = data.id ?? null;
    this.name = data.name ?? null;
    this.uri = data.uri ?? null;
    this.openfundsUri = data.openfundsUri ?? null;
    this.isEnabled = data.isEnabled ?? null;
    this.assets = data.assets ?? [];
    this.assetsWeights = data.assetsWeights ?? [];
    this.externalTreasuryAccounts = data.externalTreasuryAccounts ?? [];
    this.shareClasses = data.shareClasses ?? [];
    this.company = data.company ?? null;
    this.manager = data.manager ?? null;
    this.created = data.created ?? null;
    this.delegateAcls = data.delegateAcls ?? [];
    this.integrationAcls = data.integrationAcls ?? [];
    this.driftMarketIndexesPerp = data.driftMarketIndexesPerp ?? [];
    this.driftMarketIndexesSpot = data.driftMarketIndexesSpot ?? [];
    this.driftOrderTypes = data.driftOrderTypes ?? [];
    this.isRawOpenfunds = data.isRawOpenfunds ?? false;
    this.rawOpenfunds = data.rawOpenfunds ?? null;
  }
}
export class FundModel extends FundIdlModel {
  constructor(data: Partial<FundIdlModel>) {
    super(data);
  }

  get idStr() {
    return this.id?.toBase58() || "";
  }

  get vaultPda() {
    if (!this.id) {
      throw new Error("Fund ID not set");
    }
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), this.id.toBuffer()],
      GlamProgramId,
    );
    return pda;
  }

  get openfundsPda() {
    if (!this.id) {
      throw new Error("Fund ID not set");
    }
    const [pda, _] = PublicKey.findProgramAddressSync(
      [Buffer.from("openfunds"), this.id.toBuffer()],
      GlamProgramId,
    );
    return pda;
  }

  get productType() {
    if (this.shareClasses.length === 0) {
      return "Vault";
    }
    if (
      // @ts-ignore
      this.integrationAcls.find((acl) => Object.keys(acl.name)[0] === "mint")
    ) {
      return "Mint";
    }
    return "Fund";
  }

  get shareClassMints() {
    if (this.shareClasses.length > 0 && !this.id) {
      // If share classes are set, fund ID should be set as well
      throw new Error("Fund ID not set");
    }
    return this.shareClasses.map((_, i) =>
      ShareClassModel.mintAddress(this.id!, i),
    );
  }

  get sparkleKey() {
    if (this.shareClasses.length === 0) {
      return this.idStr;
    }
    return this.shareClassMints[0].toBase58() || this.idStr;
  }

  static openfundsPda(fundPda: PublicKey) {
    const [pda, _] = PublicKey.findProgramAddressSync(
      [Buffer.from("openfunds"), fundPda.toBuffer()],
      GlamProgramId,
    );
    return pda;
  }

  /**
   * Build a FundModel from onchain accounts
   *
   * @param fundAccount provides core fund data
   * @param openfundsAccount includes fund rawOpenfunds data and share class rawOpenfunds data
   * @param shareClassMint provides share class data
   */
  static fromOnchainAccounts(
    fundPDA: PublicKey,
    fundAccount: FundAccount,
    openfundsAccount?: FundMetadataAccount,
    shareClassMint?: Mint,
  ) {
    let fundModel: Partial<FundIdlModel> = {
      id: fundPDA,
      name: fundAccount.name,
      uri: fundAccount.uri,
      manager: new ManagerModel({ pubkey: fundAccount.manager }),
      openfundsUri: fundAccount.openfundsUri,
      shareClasses: [],
    };

    // All fields in fund params[0] should be available on the FundModel
    fundAccount.params[0].forEach((param) => {
      const name = Object.keys(param.name)[0];
      // @ts-ignore
      const value = Object.values(param.value)[0].val;
      if (new FundIdlModel({}).hasOwnProperty(name)) {
        // @ts-ignore
        fundModel[name] = value;
      } else {
        console.warn(`Fund param ${name} not found in FundIdlModel`);
      }
    });

    // Build fundModel.rawOpenfunds from openfunds account
    const fundOpenfundsFields = {};
    openfundsAccount?.fund.forEach((param) => {
      const name = Object.keys(param.name)[0];
      const value = param.value;
      // @ts-ignore
      fundOpenfundsFields[name] = value;
    });
    fundModel.rawOpenfunds = new FundOpenfundsModel(fundOpenfundsFields);

    // Build the array of ShareClassModel
    fundAccount.shareClasses.forEach((_, i) => {
      const shareClassIdlModel = {} as any;
      shareClassIdlModel["fundId"] = fundPDA;

      fundAccount.params[i + 1].forEach((param) => {
        const name = Object.keys(param.name)[0];
        // @ts-ignore
        const value = Object.values(param.value)[0].val;
        if (name === "shareClassAllowlist") {
          shareClassIdlModel["allowlist"] = value as PublicKey[];
        } else if (name === "shareClassBlocklist") {
          shareClassIdlModel["blocklist"] = value as PublicKey[];
        } else if (name == "lockUp") {
          shareClassIdlModel["lockUpPeriodInSeconds"] = Number(value);
        } else {
          shareClassIdlModel[name] = value;
        }
      });

      if (openfundsAccount) {
        const shareClassOpenfundsFields = {};
        openfundsAccount.shareClasses[i].forEach((param) => {
          const name = Object.keys(param.name)[0];
          const value = param.value;
          // @ts-ignore
          shareClassOpenfundsFields[name] = value;
        });
        shareClassIdlModel["rawOpenfunds"] = new ShareClassOpenfundsModel(
          shareClassOpenfundsFields,
        );
      }

      if (shareClassMint) {
        const extMetadata = getExtensionData(
          ExtensionType.TokenMetadata,
          shareClassMint.tlvData,
        );
        const tokenMetadata = extMetadata
          ? unpack(extMetadata)
          : ({} as TokenMetadata);
        shareClassIdlModel["symbol"] = tokenMetadata?.symbol;
        shareClassIdlModel["name"] = tokenMetadata?.name;
        shareClassIdlModel["uri"] = tokenMetadata?.uri;

        const extPermDelegate = getExtensionData(
          ExtensionType.PermanentDelegate,
          shareClassMint.tlvData,
        );
        if (extPermDelegate) {
          const permanentDelegate = new PublicKey(extPermDelegate);
          shareClassIdlModel["permanentDelegate"] = permanentDelegate;
        }
      }

      // fundModel.shareClasses should never be null
      // non-null assertion is safe and is needed to suppress type error
      fundModel.shareClasses!.push(new ShareClassModel(shareClassIdlModel));
    });

    fundModel.name =
      fundModel.name ||
      fundModel.rawOpenfunds?.legalFundNameIncludingUmbrella ||
      (fundModel.shareClasses && fundModel.shareClasses[0]?.name);

    // @ts-ignore
    return new FundModel(fundModel);
  }
}

export type FundOpenfundsModelType = IdlTypes<Glam>["fundOpenfundsModel"];
export class FundOpenfundsModel implements FundOpenfundsModelType {
  fundDomicileAlpha2: string | null;
  legalFundNameIncludingUmbrella: string | null;
  fiscalYearEnd: string | null;
  fundCurrency: string | null;
  fundLaunchDate: string | null;
  investmentObjective: string | null;
  isEtc: boolean | null;
  isEuDirectiveRelevant: boolean | null;
  isFundOfFunds: boolean | null;
  isPassiveFund: boolean | null;
  isReit: boolean | null;
  legalForm: string | null;
  legalFundNameOnly: string | null;
  openEndedOrClosedEndedFundStructure: string | null;
  typeOfEuDirective: string | null;
  ucitsVersion: string | null;

  constructor(data: Partial<FundOpenfundsModelType>) {
    this.fundDomicileAlpha2 = data.fundDomicileAlpha2 ?? null;
    this.legalFundNameIncludingUmbrella =
      data.legalFundNameIncludingUmbrella ?? null;
    this.fiscalYearEnd = data.fiscalYearEnd ?? null;
    this.fundCurrency = data.fundCurrency ?? null;
    this.fundLaunchDate = data.fundLaunchDate ?? null;
    this.investmentObjective = data.investmentObjective ?? null;
    this.isEtc = data.isEtc ?? null;
    this.isEuDirectiveRelevant = data.isEuDirectiveRelevant ?? null;
    this.isFundOfFunds = data.isFundOfFunds ?? null;
    this.isPassiveFund = data.isPassiveFund ?? null;
    this.isReit = data.isReit ?? null;
    this.legalForm = data.legalForm ?? null;
    this.legalFundNameOnly = data.legalFundNameOnly ?? null;
    this.openEndedOrClosedEndedFundStructure =
      data.openEndedOrClosedEndedFundStructure ?? null;
    this.typeOfEuDirective = data.typeOfEuDirective ?? null;
    this.ucitsVersion = data.ucitsVersion ?? null;
  }
}

export type ShareClassModelType = IdlTypes<Glam>["shareClassModel"];
export class ShareClassIdlModel implements ShareClassModelType {
  symbol: string | null;
  name: string | null;
  uri: string | null;
  fundId: PublicKey | null;
  asset: PublicKey | null;
  imageUri: string | null;
  isRawOpenfunds: boolean;
  rawOpenfunds: ShareClassOpenfundsModel | null;
  allowlist: PublicKey[];
  blocklist: PublicKey[];
  lockUpPeriodInSeconds: number;
  permanentDelegate: PublicKey | null;
  defaultAccountStateFrozen: boolean;

  constructor(data: Partial<ShareClassModelType>) {
    this.symbol = data.symbol ?? null;
    this.name = data.name ?? null;
    this.uri = data.uri ?? null;
    this.fundId = data.fundId ?? null;
    this.asset = data.asset ?? null;
    this.imageUri = data.imageUri ?? null;
    this.isRawOpenfunds = data.isRawOpenfunds ?? false;
    this.rawOpenfunds = data.rawOpenfunds ?? null;
    this.allowlist = data.allowlist ?? [];
    this.blocklist = data.blocklist ?? [];
    this.lockUpPeriodInSeconds = data.lockUpPeriodInSeconds ?? 0;
    this.permanentDelegate = data.permanentDelegate ?? null;
    this.defaultAccountStateFrozen = data.defaultAccountStateFrozen ?? false;
  }
}
export class ShareClassModel extends ShareClassIdlModel {
  constructor(data: Partial<ShareClassIdlModel>) {
    super(data);
  }

  static mintAddress(fundPDA: PublicKey, idx: number = 0): PublicKey {
    const [pda, _] = PublicKey.findProgramAddressSync(
      [Buffer.from("share"), Uint8Array.from([idx % 256]), fundPDA.toBuffer()],
      GlamProgramId,
    );
    return pda;
  }
}

export type ShareClassOpenfundsModelType =
  IdlTypes<Glam>["shareClassOpenfundsModel"];
export class ShareClassOpenfundsModel implements ShareClassOpenfundsModelType {
  isin: string | null;
  shareClassCurrency: string | null;
  currencyOfMinimalSubscription: string | null;
  fullShareClassName: string | null;
  investmentStatus: string | null;
  minimalInitialSubscriptionCategory: string | null;
  minimalInitialSubscriptionInAmount: string | null;
  minimalInitialSubscriptionInShares: string | null;
  shareClassDistributionPolicy: string | null;
  shareClassExtension: string | null;
  shareClassLaunchDate: string | null;
  shareClassLifecycle: string | null;
  launchPrice: string | null;
  launchPriceCurrency: string | null;
  launchPriceDate: string | null;
  currencyOfMinimalOrMaximumRedemption: string | null;
  hasLockUpForRedemption: boolean | null;
  isValidIsin: boolean | null;
  lockUpComment: string | null;
  lockUpPeriodInDays: string | null;
  maximumInitialRedemptionInAmount: string | null;
  maximumInitialRedemptionInShares: string | null;
  minimalInitialRedemptionInAmount: string | null;
  minimalInitialRedemptionInShares: string | null;
  minimalRedemptionCategory: string | null;
  shareClassDividendType: string | null;
  cusip: string | null;
  valor: string | null;

  constructor(obj: Partial<ShareClassOpenfundsModelType>) {
    this.isin = obj.isin ?? null;
    this.shareClassCurrency = obj.shareClassCurrency ?? null;
    this.currencyOfMinimalSubscription =
      obj.currencyOfMinimalSubscription ?? null;
    this.fullShareClassName = obj.fullShareClassName ?? null;
    this.investmentStatus = obj.investmentStatus ?? null;
    this.minimalInitialSubscriptionCategory =
      obj.minimalInitialSubscriptionCategory ?? null;
    this.minimalInitialSubscriptionInAmount =
      obj.minimalInitialSubscriptionInAmount ?? null;
    this.minimalInitialSubscriptionInShares =
      obj.minimalInitialSubscriptionInShares ?? null;
    this.shareClassDistributionPolicy =
      obj.shareClassDistributionPolicy ?? null;
    this.shareClassExtension = obj.shareClassExtension ?? null;
    this.shareClassLaunchDate = obj.shareClassLaunchDate ?? null;
    this.shareClassLifecycle = obj.shareClassLifecycle ?? null;
    this.launchPrice = obj.launchPrice ?? null;
    this.launchPriceCurrency = obj.launchPriceCurrency ?? null;
    this.launchPriceDate = obj.launchPriceDate ?? null;
    this.currencyOfMinimalOrMaximumRedemption =
      obj.currencyOfMinimalOrMaximumRedemption ?? null;
    this.hasLockUpForRedemption = obj.hasLockUpForRedemption ?? null;
    this.isValidIsin = obj.isValidIsin ?? null;
    this.lockUpComment = obj.lockUpComment ?? null;
    this.lockUpPeriodInDays = obj.lockUpPeriodInDays ?? null;
    this.maximumInitialRedemptionInAmount =
      obj.maximumInitialRedemptionInAmount ?? null;
    this.maximumInitialRedemptionInShares =
      obj.maximumInitialRedemptionInShares ?? null;
    this.minimalInitialRedemptionInAmount =
      obj.minimalInitialRedemptionInAmount ?? null;
    this.minimalInitialRedemptionInShares =
      obj.minimalInitialRedemptionInShares ?? null;
    this.minimalRedemptionCategory = obj.minimalRedemptionCategory ?? null;
    this.shareClassDividendType = obj.shareClassDividendType ?? null;
    this.cusip = obj.cusip ?? null;
    this.valor = obj.valor ?? null;
  }
}

export type CompanyModelType = IdlTypes<Glam>["companyModel"];
export class CompanyModel implements CompanyModelType {
  fundGroupName: string | null;
  manCo: string | null;
  domicileOfManCo: string | null;
  emailAddressOfManCo: string | null;
  fundWebsiteOfManCo: string | null;

  constructor(data: Partial<CompanyModelType>) {
    this.fundGroupName = data.fundGroupName ?? null;
    this.manCo = data.manCo ?? null;
    this.domicileOfManCo = data.domicileOfManCo ?? null;
    this.emailAddressOfManCo = data.emailAddressOfManCo ?? null;
    this.fundWebsiteOfManCo = data.fundWebsiteOfManCo ?? null;
  }
}

export type ManagerModelType = IdlTypes<Glam>["managerModel"];
export class ManagerModel implements ManagerModelType {
  portfolioManagerName: string | null;
  pubkey: PublicKey | null;
  kind: { wallet: {} } | { squads: {} } | null;

  constructor(data: Partial<ManagerModelType>) {
    this.portfolioManagerName = data.portfolioManagerName ?? null;
    this.pubkey = data.pubkey ?? null;
    this.kind = data.kind ?? null;
  }
}

export type CreatedModelType = IdlTypes<Glam>["createdModel"];
export class CreatedModel implements CreatedModelType {
  key: number[]; // Uint8Array;
  manager: PublicKey | null;

  constructor(obj: Partial<CreatedModelType>) {
    this.key = obj.key ?? [];
    this.manager = obj.manager ?? null;
  }
}

export type Permission = IdlTypes<Glam>["permission"];
export type DelegateAclType = IdlTypes<Glam>["delegateAcl"];
export class DelegateAcl implements DelegateAclType {
  pubkey: PublicKey;
  permissions: Permission[];

  constructor(obj: Partial<DelegateAclType>) {
    this.pubkey = obj.pubkey;
    this.permissions = obj.permissions ?? [];
  }
}

export type IntegrationName = IdlTypes<Glam>["integrationName"];
export type IntegrationAclType = IdlTypes<Glam>["integrationAcl"];
export class IntegrationAcl implements IntegrationAclType {
  name: IntegrationName;
  features: { all: {} }[];

  constructor(obj: Partial<IntegrationAclType>) {
    this.name = obj.name;
    this.features = obj.features ?? [];
  }
}
