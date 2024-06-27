import { IdlTypes } from "@coral-xyz/anchor";
import { Glam } from "./glamExports";

export type FundModel = IdlTypes<Glam>["FundModel"];
export const FundModel = class<FundModel> {
  constructor(obj: any) {
    let partial: any = {
      id: null,
      name: null,
      uri: null,
      openfundsUri: null,
      isEnabled: null,
      created: null,
      isRawOpenfunds: null,
    };
    for (const key in partial) {
      partial[key] = obj[key] || null;
    }
    let result: IdlTypes<Glam>["FundModel"] = {
      ...partial,
      assets: obj.assets || [],
      assetsWeights: obj.assetsWeights || [],
      acls: obj.acls || [],
      shareClasses: obj.shareClasses
        ? obj.shareClasses.map(
            (shareClass: any) =>
              new ShareClassModel(shareClass) as ShareClassModel
          )
        : [],
      company: obj.company
        ? (new CompanyModel(obj.company) as CompanyModel)
        : null,
      manager: obj.manager
        ? (new ManagerModel(obj.manager) as ManagerModel)
        : null,
      rawOpenfunds: new FundOpenfundsModel(obj) as FundOpenfundsModel,
    };
    return result;
  }
};

export type FundOpenfundsModel = IdlTypes<Glam>["FundOpenfundsModel"];
export const FundOpenfundsModel = class<FundOpenfundsModel> {
  constructor(obj: any) {
    let partial: any = {
      fundDomicileAlpha2: null,
      legalFundNameIncludingUmbrella: null,
      fiscalYearEnd: null,
      fundCurrency: null,
      fundLaunchDate: null,
      investmentObjective: null,
      isEtc: null,
      isEuDirectiveRelevant: null,
      isFundOfFunds: null,
      isPassiveFund: null,
      isReit: null,
      legalForm: null,
      legalFundNameOnly: null,
      openEndedOrClosedEndedFundStructure: null,
      typeOfEuDirective: null,
      ucitsVersion: null,
    };
    for (const key in partial) {
      partial[key] = obj[key] || null;
    }
    let result: IdlTypes<Glam>["FundOpenfundsModel"] = {
      ...partial,
    };
    return result;
  }
};

export type ShareClassModel = IdlTypes<Glam>["ShareClassModel"];
export const ShareClassModel = class<ShareClassModel> {
  constructor(obj: any) {
    let partial: any = {
      symbol: null,
      name: null,
      uri: null,
      fundId: null,
      asset: null,
      imageUri: null,
      isRawOpenfunds: null,
      allowlist: [],
      blocklist: [],
    };
    for (const key in partial) {
      partial[key] = obj[key] || null;
    }
    let result: IdlTypes<Glam>["ShareClassModel"] = {
      symbol: null,
      name: null,
      uri: null,
      fundId: null,
      asset: null,
      imageUri: null,
      isRawOpenfunds: null,
      ...partial,
      rawOpenfunds: new ShareClassOpenfundsModel(
        obj
      ) as ShareClassOpenfundsModel,
    };
    return result;
  }
};

export type ShareClassOpenfundsModel =
  IdlTypes<Glam>["ShareClassOpenfundsModel"];
export const ShareClassOpenfundsModel = class<ShareClassOpenfundsModel> {
  constructor(obj: any) {
    let partial: any = {
      isin: null,
      shareClassCurrency: null,
      currencyOfMinimalSubscription: null,
      fullShareClassName: null,
      investmentStatus: null,
      minimalInitialSubscriptionCategory: null,
      minimalInitialSubscriptionInAmount: null,
      minimalInitialSubscriptionInShares: null,
      shareClassDistributionPolicy: null,
      shareClassExtension: null,
      shareClassLaunchDate: null,
      shareClassLifecycle: null,
      launchPrice: null,
      launchPriceCurrency: null,
      launchPriceDate: null,
      currencyOfMinimalOrMaximumRedemption: null,
      hasLockUpForRedemption: null,
      isValidIsin: null,
      lockUpComment: null,
      lockUpPeriodInDays: null,
      maximumInitialRedemptionInAmount: null,
      maximumInitialRedemptionInShares: null,
      minimalInitialRedemptionInAmount: null,
      minimalInitialRedemptionInShares: null,
      minimalRedemptionCategory: null,
      shareClassDividendType: null,
      cusip: null,
      valor: null,
    };
    for (const key in partial) {
      partial[key] = obj[key] || null;
    }
    let result: IdlTypes<Glam>["ShareClassOpenfundsModel"] = {
      ...partial,
    };
    return result;
  }
};

export type CompanyModel = IdlTypes<Glam>["CompanyModel"];
export const CompanyModel = class<CompanyModel> {
  constructor(obj: any) {
    let result: IdlTypes<Glam>["CompanyModel"] = {
      // alias name = fundGroupName
      fundGroupName: obj.fundGroupName || obj.name || null,
      // alias email = emailAddressOfManCo
      emailAddressOfManCo: obj.emailAddressOfManCo || obj.email || null,
      // alias website = fundWebsiteOfManCo
      fundWebsiteOfManCo: obj.fundWebsiteOfManCo || obj.website || null,
      manCo: obj.manCo || null,
      domicileOfManCo: obj.domicileOfManCo || null,
    };
    return result;
  }
};

export type ManagerModel = IdlTypes<Glam>["ManagerModel"];
export const ManagerModel = class<ManagerModel> {
  constructor(obj: any) {
    let result: IdlTypes<Glam>["ManagerModel"] = {
      // alias name = portfolioManagerName
      portfolioManagerName: obj.portfolioManagerName || obj.name || null,
      pubkey: obj.pubkey || null,
      kind: (obj.kind as IdlTypes<Glam>["ManagerKind"]) || null,
    };
    return result;
  }
};
