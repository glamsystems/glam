import { IdlTypes } from "@coral-xyz/anchor";
import { Glam } from "./glamExports";
import { PublicKey } from "@solana/web3.js";

export type FundModelType = IdlTypes<Glam>["fundModel"];
export class FundModel implements FundModelType {
  id: PublicKey | null;
  name: string | null;
  uri: string | null;
  openfundsUri: string | null;
  isEnabled: boolean | null;
  assets: PublicKey[];
  assetsWeights: number[];
  shareClasses: ShareClassModel[];
  company: CompanyModel;
  manager: ManagerModel;
  created: CreatedModel;
  delegateAcls: any;
  integrationAcls: any;
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
export class ShareClassModel implements ShareClassModelType {
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

export type DelegateAclType = IdlTypes<Glam>["delegateAcl"];
export class DelegateAcl implements DelegateAclType {
  pubkey: PublicKey | null;
  permissions: (
    | { driftInitialize: {} }
    | { driftUpdateUser: {} }
    | { driftDeleteUser: {} }
    | { driftDeposit: {} }
    | { driftWithdraw: {} }
    | { driftPlaceOrders: {} }
    | { driftCancelOrders: {} }
    | { driftPerpMarket: {} }
    | { driftSpotMarket: {} }
    | { stake: {} }
    | { unstake: {} }
    | { liquidUnstake: {} }
    | { jupiterSwapFundAssets: {} }
    | { jupiterSwapAnyAsset: {} }
    | { wSolWrap: {} }
    | { wSolUnwrap: {} }
    | { mintShare: {} }
    | { burnShare: {} }
    | { forceTransferShare: {} }
    | { setTokenAccountsStates: {} }
    | { stakeJup: {} }
    | { voteOnProposal: {} }
  )[];

  constructor(obj: Partial<DelegateAclType>) {
    this.permissions = obj.permissions ?? [];
    this.pubkey = obj.pubkey ?? null;
  }
}
