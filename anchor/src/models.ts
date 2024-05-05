import { IdlTypes } from "@coral-xyz/anchor";
import { Glam } from "./glamExports";

export type FundModel = IdlTypes<Glam>["FundModel"];
export const FundModel = class<FundModel> {
  constructor(obj: any) {
    let result: IdlTypes<Glam>["FundModel"] = {
      id: null,
      name: null,
      uri: null,
      openfundUri: null,
      isEnabled: null,
      created: null,
      isRawOpenfund: null,
      ...obj,
      assets: obj.assets || [],
      assetsWeights: obj.assetsWeights || [],
      shareClasses: obj.shareClasses
        ? obj.shareClasses.map(
            (shareClass) => new ShareClassModel(shareClass) as ShareClassModel
          )
        : [],
      company: obj.company
        ? (new CompanyModel(obj.company) as CompanyModel)
        : null,
      manager: obj.manager
        ? (new ManagerModel(obj.manager) as ManagerModel)
        : null,
      rawOpenfund: obj.fundDomicileAlpha2
        ? (new FundOpenfundModel(obj) as FundOpenfundModel)
        : null
    };
    return result;
  }
};

export type FundOpenfundModel = IdlTypes<Glam>["FundOpenfundModel"];
export const FundOpenfundModel = class<FundOpenfundModel> {
  constructor(obj: any) {
    const result: IdlTypes<Glam>["FundOpenfundModel"] = {
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
      ...obj
    };
    return result;
  }
};

export type ShareClassModel = IdlTypes<Glam>["ShareClassModel"];
export const ShareClassModel = class<ShareClassModel> {
  constructor(obj: any) {
    const result: IdlTypes<Glam>["ShareClassModel"] = {
      symbol: null,
      name: null,
      uri: null,
      fundId: null,
      asset: null,
      imageUri: null,
      isRawOpenfund: null,
      ...obj,
      rawOpenfund: obj.shareClassCurrency
        ? (new ShareClassOpenfundModel(obj) as ShareClassOpenfundModel)
        : null
    };
    return result;
  }
};

export type ShareClassOpenfundModel = IdlTypes<Glam>["ShareClassOpenfundModel"];
export const ShareClassOpenfundModel = class<ShareClassOpenfundModel> {
  constructor(obj: any) {
    const result: IdlTypes<Glam>["ShareClassOpenfundModel"] = {
      isin: null,
      shareClassCurrency: null,
      appliedSubscriptionFeeInFavourOfDistributor: null,
      appliedSubscriptionFeeInFavourOfDistributorReferenceDate: null,
      currencyOfMinimalSubscription: null,
      fullShareClassName: null,
      hasPerformanceFee: null,
      hasSubscriptionFeeInFavourOfDistributor: null,
      investmentStatus: null,
      managementFeeApplied: null,
      managementFeeAppliedReferenceDate: null,
      managementFeeMaximum: null,
      maximumSubscriptionFeeInFavourOfDistributor: null,
      minimalInitialSubscriptionCategory: null,
      minimalInitialSubscriptionInAmount: null,
      minimalInitialSubscriptionInShares: null,
      minimalSubsequentSubscriptionCategory: null,
      minimalSubsequentSubscriptionInAmount: null,
      minimalSubsequentSubscriptionInShares: null,
      minimumSubscriptionFeeInFavourOfDistributor: null,
      shareClassDistributionPolicy: null,
      shareClassExtension: null,
      shareClassLaunchDate: null,
      shareClassLifecycle: null,
      launchPrice: null,
      launchPriceCurrency: null,
      launchPriceDate: null,
      hasAppliedSubscriptionFeeInFavourOfFund: null,
      appliedSubscriptionFeeInFavourOfFund: null,
      appliedSubscriptionFeeInFavourOfFundReferenceDate: null,
      maximumSubscriptionFeeInFavourOfFund: null,
      hasAppliedRedemptionFeeInFavourOfFund: null,
      appliedRedemptionFeeInFavourOfFund: null,
      appliedRedemptionFeeInFavourOfFundReferenceDate: null,
      maximumRedemptionFeeInFavourOfFund: null,
      ...obj
    };
    return result;
  }
};

export type CompanyModel = IdlTypes<Glam>["CompanyModel"];
export const CompanyModel = class<CompanyModel> {
  constructor(obj: any) {
    const result: IdlTypes<Glam>["CompanyModel"] = {
      // alias name = fundGroupName
      fundGroupName: obj.fundGroupName || obj.name || null,
      // alias email = emailAddressOfManCo
      emailAddressOfManCo: obj.emailAddressOfManCo || obj.email || null,
      // alias website = fundWebsiteOfManCo
      fundWebsiteOfManCo: obj.fundWebsiteOfManCo || obj.website || null,
      manCo: obj.manCo || null,
      domicileOfManCo: obj.domicileOfManCo || null
    };
    return result;
  }
};

export type ManagerModel = IdlTypes<Glam>["ManagerModel"];
export const ManagerModel = class<ManagerModel> {
  constructor(obj: any) {
    const result: IdlTypes<Glam>["ManagerModel"] = {
      // alias name = portfolioManagerName
      portfolioManagerName: obj.name || obj.portfolioManagerName || null,
      pubkey: obj.pubkey || null,
      kind: (obj.kind as IdlTypes<Glam>["ManagerKind"]) || null
    };
    return result;
  }
};
