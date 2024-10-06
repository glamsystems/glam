import { IdlTypes } from "@coral-xyz/anchor";
import { Glam } from "./glamExports";

// @ts-ignore
export type FundModel = IdlTypes<Glam>["fundModel"];
export const FundModel = class<FundModel> {
  constructor(obj: any) {
    let partial: any = {
      id: null,
      name: null,
      uri: null,
      openfundsUri: null,
      isEnabled: null,
      created: null,
      isRawOpenfunds: false,
    };
    for (const key in partial) {
      if (obj[key]) {
        partial[key] = obj[key];
      }
    }
    let result: IdlTypes<Glam>["fundModel"] = {
      ...partial,
      assets: obj.assets || [],
      assetsWeights: obj.assetsWeights || [],
      delegateAcls: obj.delegateAcls || [],
      integrationAcls: obj.integrationAcls || [],
      driftMarketIndexesPerp: obj.driftMarketIndexesPerp || [],
      driftMarketIndexesSpot: obj.driftMarketIndexesSpot || [],
      driftOrderTypes: obj.driftOrderTypes || [],
      shareClasses: obj.shareClasses
        ? obj.shareClasses.map(
            (shareClass: any) =>
              new ShareClassModel(shareClass) as ShareClassModel
          )
        : [],
      company: obj.company
        ? (new CompanyModel(obj.company) as CompanyModel)
        : null,
      manager: obj.fundManagers
        ? (new ManagerModel(obj.fundManagers[0]) as ManagerModel)
        : obj?.manager || null,
      rawOpenfunds: new FundOpenfundsModel(obj) as FundOpenfundsModel,
    };
    Object.keys(result).forEach((key) => {
      //@ts-ignore
      this[key] = result[key];
    });
    return this;
  }
};

export type FundOpenfundsModel = IdlTypes<Glam>["fundOpenfundsModel"];
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
      if (obj[key]) {
        partial[key] = obj[key];
      }
    }
    let result: IdlTypes<Glam>["fundOpenfundsModel"] = {
      ...partial,
    };
    Object.keys(result).forEach((key) => {
      //@ts-ignore
      this[key] = result[key];
    });
    return this;
  }
};

export type ShareClassModel = IdlTypes<Glam>["shareClassModel"];
export const ShareClassModel = class<ShareClassModel> {
  constructor(obj: any) {
    let partial: any = {
      id: null,
      symbol: null,
      name: null,
      uri: null,
      fundId: null,
      asset: null,
      imageUri: null,
      isRawOpenfunds: false,
      allowlist: [],
      blocklist: [],
      lockUpPeriodInSeconds: 0,
      permanentDelegate: null,
      defaultAccountStateFrozen: false,
    };
    for (const key in partial) {
      if (obj[key]) {
        partial[key] = obj[key];
      }
    }
    let result: IdlTypes<Glam>["shareClassModel"] = {
      ...partial,
      rawOpenfunds: new ShareClassOpenfundsModel(
        obj
      ) as ShareClassOpenfundsModel,
    };
    Object.keys(result).forEach((key) => {
      //@ts-ignore
      this[key] = result[key];
    });
    return this;
  }
};

export type ShareClassOpenfundsModel =
  IdlTypes<Glam>["shareClassOpenfundsModel"];
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
      if (obj[key]) {
        partial[key] = obj[key];
      }
    }
    let result: IdlTypes<Glam>["shareClassOpenfundsModel"] = {
      ...partial,
    };
    Object.keys(result).forEach((key) => {
      //@ts-ignore
      this[key] = result[key];
    });
    return this;
  }
};

export type CompanyModel = IdlTypes<Glam>["companyModel"];
export const CompanyModel = class<CompanyModel> {
  constructor(obj: any) {
    let result: IdlTypes<Glam>["companyModel"] = {
      // alias name = fundGroupName
      fundGroupName: obj.fundGroupName || obj.name || null,
      // alias email = emailAddressOfManCo
      emailAddressOfManCo: obj.emailAddressOfManCo || obj.email || null,
      // alias website = fundWebsiteOfManCo
      fundWebsiteOfManCo: obj.fundWebsiteOfManCo || obj.website || null,
      manCo: obj.manCo || null,
      domicileOfManCo: obj.domicileOfManCo || null,
    };
    Object.keys(result).forEach((key) => {
      //@ts-ignore
      this[key] = result[key];
    });
    return this;
  }
};

export type ManagerModel = IdlTypes<Glam>["managerModel"];
export const ManagerModel = class<ManagerModel> {
  constructor(obj: any) {
    let result: IdlTypes<Glam>["managerModel"] = {
      // alias name = portfolioManagerName
      portfolioManagerName: obj.portfolioManagerName || obj.name || null,
      pubkey: obj.pubkey || null,
      kind: (obj.kind as IdlTypes<Glam>["managerKind"]) || null,
    };
    Object.keys(result).forEach((key) => {
      //@ts-ignore
      this[key] = result[key];
    });
    return this;
  }
};
