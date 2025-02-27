import { IdlTypes, IdlAccounts } from "@coral-xyz/anchor";
import { Glam, GlamIDLJson } from "./glamExports";
import { PublicKey } from "@solana/web3.js";
import { ExtensionType, getExtensionData, Mint } from "@solana/spl-token";
import { TokenMetadata, unpack } from "@solana/spl-token-metadata";
import { BN } from "@coral-xyz/anchor";
import { SEED_METADATA, SEED_MINT, SEED_VAULT } from "./constants";

export const GlamIntegrations =
  GlamIDLJson?.types
    ?.find((t) => t.name === "Integration")
    ?.type?.variants?.map((v) => v.name) ?? [];

export const GlamPermissions =
  GlamIDLJson?.types
    ?.find((t) => t.name === "Permission")
    ?.type?.variants?.map((v) => v.name) ?? [];

const GLAM_PROGRAM_ID_DEFAULT = new PublicKey(GlamIDLJson.address);

export type StateAccountType = { vault: {} } | { mint: {} } | { fund: {} };

// @ts-ignore cli-build failed due to "Type instantiation is excessively deep and possibly infinite."
export type StateAccount = IdlAccounts<Glam>["stateAccount"];

export type OpenfundsMetadataAccount =
  IdlAccounts<Glam>["openfundsMetadataAccount"];

export type StateModelType = IdlTypes<Glam>["stateModel"];
export class StateIdlModel implements StateModelType {
  id: PublicKey | null;
  accountType: StateAccountType | null;
  name: string | null;
  uri: string | null;
  enabled: boolean | null;

  assets: PublicKey[] | null;
  externalVaultAccounts: PublicKey[] | null;

  mints: MintModel[] | null;
  company: CompanyModel | null;
  owner: ManagerModel | null;
  created: CreatedModel | null;

  delegateAcls: DelegateAcl[] | null;
  integrations: Integration[] | null;
  driftMarketIndexesPerp: number[] | null;
  driftMarketIndexesSpot: number[] | null;
  driftOrderTypes: number[] | null;

  metadata: Metadata | null;
  rawOpenfunds: FundOpenfundsModel | null;

  constructor(data: Partial<StateModelType>) {
    this.id = data.id ?? null;
    this.accountType = data.accountType ?? null;
    this.name = data.name ?? null;
    this.uri = data.uri ?? null;
    this.enabled = data.enabled ?? null;
    this.assets = data.assets ?? null;
    this.externalVaultAccounts = data.externalVaultAccounts ?? null;
    this.mints = data.mints ?? null;
    this.company = data.company ?? null;
    this.owner = data.owner ?? null;
    this.created = data.created ?? null;
    this.delegateAcls = data.delegateAcls ?? null;
    this.integrations = data.integrations ?? null;
    this.driftMarketIndexesPerp = data.driftMarketIndexesPerp ?? null;
    this.driftMarketIndexesSpot = data.driftMarketIndexesSpot ?? null;
    this.driftOrderTypes = data.driftOrderTypes ?? null;
    this.metadata = data.metadata ?? null;
    this.rawOpenfunds = data.rawOpenfunds ?? null;
  }
}
export class StateModel extends StateIdlModel {
  readonly glamProgramId: PublicKey;

  constructor(
    data: Partial<StateIdlModel>,
    glamProgramId = GLAM_PROGRAM_ID_DEFAULT,
  ) {
    super(data);
    this.glamProgramId = glamProgramId;
  }

  get idStr() {
    return this.id?.toBase58() || "";
  }

  get vaultPda() {
    if (!this.id) {
      throw new Error("Glam state ID not set");
    }
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED_VAULT), this.id.toBuffer()],
      this.glamProgramId,
    );
    return pda;
  }

  get openfundsPda() {
    if (!this.id) {
      throw new Error("Glam state ID not set");
    }
    const [pda, _] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED_METADATA), this.id.toBuffer()],
      this.glamProgramId,
    );
    return pda;
  }

  get productType() {
    // @ts-ignore
    const val = Object.keys(this.accountType)[0];
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  }

  get launchDate() {
    const createdAt = this.created?.createdAt.toNumber() ?? 0;
    return this.rawOpenfunds?.fundLaunchDate || createdAt
      ? new Date(createdAt * 1000).toISOString().split("T")[0]
      : "Unknown";
  }

  get mintAddresses() {
    if (this.mints && this.mints.length > 0 && !this.id) {
      // If share classes are set, state ID should also be set
      throw new Error("Glam state ID not set");
    }
    return (this.mints || []).map((_, i) =>
      MintModel.mintAddress(this.id!, i, this.glamProgramId),
    );
  }

  get sparkleKey() {
    if (!this.mints || this.mints.length === 0) {
      return this.idStr;
    }
    return this.mintAddresses[0].toBase58() || this.idStr;
  }

  /**
   * Build a StateModel from onchain accounts
   *
   * @param stateAccount provides core fund data
   * @param openfundsMetadataAccount includes fund rawOpenfunds data and share class rawOpenfunds data
   * @param glamMint
   */
  static fromOnchainAccounts(
    statePda: PublicKey,
    stateAccount: StateAccount,
    openfundsMetadataAccount?: OpenfundsMetadataAccount,
    glamMint?: Mint,
    glamProgramId: PublicKey = GLAM_PROGRAM_ID_DEFAULT,
  ) {
    let stateModel: Partial<StateIdlModel> = {
      id: statePda,
      name: stateAccount.name,
      uri: stateAccount.uri,
      accountType: stateAccount.accountType,
      metadata: stateAccount.metadata,
      assets: stateAccount.assets,
      created: stateAccount.created,
      delegateAcls: stateAccount.delegateAcls,
      integrations: stateAccount.integrations,
      owner: new ManagerModel({ pubkey: stateAccount.owner }),
      mints: [],
    };

    // All fields in fund params[0] should be available on the StateModel
    stateAccount.params[0].forEach((param) => {
      const name = Object.keys(param.name)[0];
      // @ts-ignore
      const value = Object.values(param.value)[0].val;
      if (new StateIdlModel({}).hasOwnProperty(name)) {
        // @ts-ignore
        stateModel[name] = value;
      } else {
        console.warn(`State param ${name} not found in StateIdlModel`);
      }
    });

    // Build stateModel.rawOpenfunds from openfunds account
    const fundOpenfundsFields = {};
    openfundsMetadataAccount?.fund.forEach((param) => {
      const name = Object.keys(param.name)[0];
      const value = param.value;
      // @ts-ignore
      fundOpenfundsFields[name] = value;
    });
    stateModel.rawOpenfunds = new FundOpenfundsModel(fundOpenfundsFields);

    // Build the array of ShareClassModel
    stateAccount.mints.forEach((_, i) => {
      const mintIdlModel = {} as any;
      mintIdlModel["statePubkey"] = statePda;

      stateAccount.params[i + 1].forEach((param) => {
        const name = Object.keys(param.name)[0];
        // @ts-ignore
        const value = Object.values(param.value)[0].val;
        if (name == "lockUp") {
          mintIdlModel["lockUpPeriodInSeconds"] = Number(value);
        } else {
          mintIdlModel[name] = value;
        }
      });

      if (openfundsMetadataAccount) {
        const mintOpenfundsFields = {};
        openfundsMetadataAccount.shareClasses[i].forEach((param) => {
          const name = Object.keys(param.name)[0];
          const value = param.value;
          // @ts-ignore
          mintOpenfundsFields[name] = value;
        });
        mintIdlModel["rawOpenfunds"] = new MintOpenfundsModel(
          mintOpenfundsFields,
        );
      }

      if (glamMint) {
        const extMetadata = getExtensionData(
          ExtensionType.TokenMetadata,
          glamMint.tlvData,
        );
        const tokenMetadata = extMetadata
          ? unpack(extMetadata)
          : ({} as TokenMetadata);
        mintIdlModel["symbol"] = tokenMetadata?.symbol;
        mintIdlModel["name"] = tokenMetadata?.name;
        mintIdlModel["uri"] = tokenMetadata?.uri;

        const extPermDelegate = getExtensionData(
          ExtensionType.PermanentDelegate,
          glamMint.tlvData,
        );
        if (extPermDelegate) {
          const permanentDelegate = new PublicKey(extPermDelegate);
          mintIdlModel["permanentDelegate"] = permanentDelegate;
        }
      }

      // stateModel.shareClasses should never be null
      // non-null assertion is safe and is needed to suppress type error
      stateModel.mints!.push(new MintModel(mintIdlModel));
    });

    stateModel.name =
      stateModel.name ||
      stateModel.rawOpenfunds?.legalFundNameIncludingUmbrella ||
      (stateModel.mints && stateModel.mints[0]?.name);

    return new StateModel(stateModel, glamProgramId);
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

export type MintModelType = IdlTypes<Glam>["mintModel"];
export class MintIdlModel implements MintModelType {
  symbol: string | null;
  name: string | null;
  uri: string | null;

  statePubkey: PublicKey | null;
  asset: PublicKey | null;
  imageUri: string | null;

  allowlist: PublicKey[] | null;
  blocklist: PublicKey[] | null;

  lockUpPeriodInSeconds: number | null;
  permanentDelegate: PublicKey | null;
  defaultAccountStateFrozen: boolean | null;

  isRawOpenfunds: boolean | null;
  rawOpenfunds: MintOpenfundsModel | null;

  constructor(data: Partial<MintModelType>) {
    this.symbol = data.symbol ?? null;
    this.name = data.name ?? null;
    this.uri = data.uri ?? null;
    this.statePubkey = data.statePubkey ?? null;
    this.asset = data.asset ?? null;
    this.imageUri = data.imageUri ?? null;
    this.isRawOpenfunds = data.isRawOpenfunds ?? null;
    this.rawOpenfunds = data.rawOpenfunds ?? null;
    this.allowlist = data.allowlist ?? null;
    this.blocklist = data.blocklist ?? null;
    this.lockUpPeriodInSeconds = data.lockUpPeriodInSeconds ?? null;
    this.permanentDelegate = data.permanentDelegate ?? null;
    this.defaultAccountStateFrozen = data.defaultAccountStateFrozen ?? null;
  }
}
export class MintModel extends MintIdlModel {
  constructor(data: Partial<MintIdlModel>) {
    super(data);
  }

  static mintAddress(
    statePda: PublicKey,
    idx: number = 0,
    glamProgramId: PublicKey = GLAM_PROGRAM_ID_DEFAULT,
  ): PublicKey {
    const [pda, _] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SEED_MINT),
        Uint8Array.from([idx % 256]),
        statePda.toBuffer(),
      ],
      glamProgramId,
    );
    return pda;
  }
}

export type MintOpenfundsModelType = IdlTypes<Glam>["mintOpenfundsModel"];
export class MintOpenfundsModel implements MintOpenfundsModelType {
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

  constructor(obj: Partial<MintOpenfundsModelType>) {
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

export type MetadataType = IdlTypes<Glam>["metadata"];
export class Metadata implements MetadataType {
  template: IdlTypes<Glam>["metadataTemplate"];
  pubkey: PublicKey;
  uri: string;

  constructor(data: Partial<MetadataType>) {
    this.template = data.template!;
    this.pubkey = data.pubkey ?? new PublicKey(0);
    this.uri = data.uri ?? "";
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
  createdBy: PublicKey;
  createdAt: BN;

  constructor(obj: Partial<CreatedModelType>) {
    this.key = obj.key ?? [0, 0, 0, 0, 0, 0, 0, 0];
    this.createdBy = obj.createdBy ?? new PublicKey(0);
    this.createdAt = obj.createdAt ?? new BN(0);
  }
}

export type Permission = IdlTypes<Glam>["permission"];
export type DelegateAclType = IdlTypes<Glam>["delegateAcl"];
export class DelegateAcl implements DelegateAclType {
  pubkey: PublicKey;
  permissions: Permission[];
  expiresAt: BN;

  constructor(obj: Partial<DelegateAclType>) {
    this.pubkey = obj.pubkey!;
    this.permissions = obj.permissions ?? [];
    this.expiresAt = obj.expiresAt ?? new BN(0);
  }
}

export type Integration = IdlTypes<Glam>["integration"];
