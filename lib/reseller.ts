export type ResellerLevelName =
  | "New Reseller"
  | "Active Reseller"
  | "Pro Reseller"
  | "Master Reseller"
  | "Elite Partner"
  | "Ascend Partner";

export type ResellerLevel = {
  name: ResellerLevelName;
  minUsdSpent: number;
  discountPercent: number;
  pointConversionUsdPer100Points: number;
  childPanelEligible: boolean;
};

export const RESELLER_LEVELS: ResellerLevel[] = [
  {
    name: "New Reseller",
    minUsdSpent: 0,
    discountPercent: 0,
    pointConversionUsdPer100Points: 1,
    childPanelEligible: false,
  },
  {
    name: "Active Reseller",
    minUsdSpent: 500,
    discountPercent: 1,
    pointConversionUsdPer100Points: 1,
    childPanelEligible: false,
  },
  {
    name: "Pro Reseller",
    minUsdSpent: 5000,
    discountPercent: 2,
    pointConversionUsdPer100Points: 1.25,
    childPanelEligible: true,
  },
  {
    name: "Master Reseller",
    minUsdSpent: 15000,
    discountPercent: 3,
    pointConversionUsdPer100Points: 1.5,
    childPanelEligible: true,
  },
  {
    name: "Elite Partner",
    minUsdSpent: 30000,
    discountPercent: 4,
    pointConversionUsdPer100Points: 1.75,
    childPanelEligible: true,
  },
  {
    name: "Ascend Partner",
    minUsdSpent: 50000,
    discountPercent: 5,
    pointConversionUsdPer100Points: 2,
    childPanelEligible: true,
  },
];

export function getResellerLevel(totalUsdSpent: number): ResellerLevel {
  const sorted = [...RESELLER_LEVELS].sort(
    (a, b) => b.minUsdSpent - a.minUsdSpent
  );

  return (
    sorted.find((level) => totalUsdSpent >= level.minUsdSpent) ||
    RESELLER_LEVELS[0]
  );
}

export function calculatePointsFromUsd(usdSpent: number) {
  return Math.floor(usdSpent / 4);
}

export function calculateWalletCreditFromPoints(
  points: number,
  levelName: string,
  usdToPhpRate: number
) {
  const level =
    RESELLER_LEVELS.find((item) => item.name === levelName) ||
    RESELLER_LEVELS[0];

  const usdCredit =
    (points / 100) * level.pointConversionUsdPer100Points;

  return usdCredit * usdToPhpRate;
}