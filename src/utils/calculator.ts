import { BudgetState, CityBenchmark, InflationScenario } from '../types';

export interface StressCalculationResult {
  stressScore: number; // 0 - 100
  stressRating: 'Safe' | 'Moderate' | 'Stressed' | 'Severe Crisis';
  housingRatio: number; // percentage (e.g., 42%)
  totalExpenses: number;
  netMonthlySurplus: number;
  savingsRatio: number;
  needsRatio: number;
  wantsRatio: number;
  cityRentVariance: number; // dollar diff from city median
  recommendedEmergencyFund: number;
  runwayMonths: number;
}

export function calculateStressIndex(
  budget: BudgetState,
  city: CityBenchmark
): StressCalculationResult {
  const { income, housing, groceries, utilities, transport, insurance, discretionary, currentSavings } = budget;

  // Needs = housing + groceries + utilities + transport + insurance
  const needsTotal = housing + groceries + utilities + transport + insurance;
  const wantsTotal = discretionary;
  const totalExpenses = needsTotal + wantsTotal;
  const netMonthlySurplus = income - totalExpenses;

  const housingRatio = income > 0 ? (housing / income) * 100 : 100;
  const needsRatio = income > 0 ? (needsTotal / income) * 100 : 100;
  const wantsRatio = income > 0 ? (wantsTotal / income) * 100 : 0;
  const savingsRatio = income > 0 ? (netMonthlySurplus / income) * 100 : 0;

  // Base score driven by housing burden
  // <28% = low stress; 28-35% = moderate; 36-48% = high; >48% = critical
  let rawScore = 0;
  if (housingRatio <= 28) {
    rawScore += (housingRatio / 28) * 25;
  } else if (housingRatio <= 40) {
    rawScore += 25 + ((housingRatio - 28) / 12) * 30; // 25 to 55
  } else if (housingRatio <= 50) {
    rawScore += 55 + ((housingRatio - 40) / 10) * 25; // 55 to 80
  } else {
    rawScore += 80 + Math.min(20, ((housingRatio - 50) / 15) * 20); // 80 to 100
  }

  // Deficit or low surplus penalty
  if (netMonthlySurplus < 0) {
    rawScore += 18;
  } else if (netMonthlySurplus < income * 0.1) {
    rawScore += 10;
  } else if (netMonthlySurplus > income * 0.25) {
    rawScore -= 12;
  }

  // City cost index weight
  if (city.costIndex > 150) {
    rawScore += 6;
  } else if (city.costIndex < 120) {
    rawScore -= 4;
  }

  // Emergency runway factor
  const monthlyBurn = totalExpenses > 0 ? totalExpenses : 1;
  const runwayMonths = currentSavings / monthlyBurn;
  if (runwayMonths < 1) {
    rawScore += 12;
  } else if (runwayMonths < 3) {
    rawScore += 6;
  } else if (runwayMonths >= 6) {
    rawScore -= 8;
  }

  // Bound between 5 and 98
  const stressScore = Math.max(8, Math.min(96, Math.round(rawScore)));

  let stressRating: 'Safe' | 'Moderate' | 'Stressed' | 'Severe Crisis' = 'Moderate';
  if (stressScore < 40) {
    stressRating = 'Safe';
  } else if (stressScore <= 65) {
    stressRating = 'Moderate';
  } else if (stressScore <= 80) {
    stressRating = 'Stressed';
  } else {
    stressRating = 'Severe Crisis';
  }

  const cityRentVariance = housing - city.avgRent1Bed;
  const recommendedEmergencyFund = monthlyBurn * 6;

  return {
    stressScore,
    stressRating,
    housingRatio: Math.round(housingRatio),
    totalExpenses,
    netMonthlySurplus,
    savingsRatio: Math.round(savingsRatio),
    needsRatio: Math.round(needsRatio),
    wantsRatio: Math.round(wantsRatio),
    cityRentVariance,
    recommendedEmergencyFund,
    runwayMonths: Number(runwayMonths.toFixed(1)),
  };
}

export interface InflationImpactResult {
  monthlyIncrease: number;
  rentIncrease: number;
  groceryIncrease: number;
  utilityIncrease: number;
  transportIncrease: number;
  newTotalExpenses: number;
  newMonthlySurplus: number;
  cumulativeLoss1Year: number;
  cumulativeLossHorizon: number;
  purchasingPowerLossPercent: number;
  newRunwayMonths: number;
  runwayMonthsLost: number;
}

export function calculateInflationImpact(
  budget: BudgetState,
  scenario: InflationScenario
): InflationImpactResult {
  const rentIncrease = Math.round(budget.housing * (scenario.rentHike / 100));
  const groceryIncrease = Math.round(budget.groceries * (scenario.groceryHike / 100));
  const utilityIncrease = Math.round(budget.utilities * (scenario.utilityHike / 100));
  const transportIncrease = Math.round(budget.transport * (scenario.transportHike / 100));

  const monthlyIncrease = rentIncrease + groceryIncrease + utilityIncrease + transportIncrease;
  const baselineExpenses =
    budget.housing +
    budget.groceries +
    budget.utilities +
    budget.transport +
    budget.insurance +
    budget.discretionary;

  const newTotalExpenses = baselineExpenses + monthlyIncrease;
  const newMonthlySurplus = budget.income - newTotalExpenses;

  const cumulativeLoss1Year = monthlyIncrease * 12;
  const cumulativeLossHorizon = monthlyIncrease * 12 * scenario.timeHorizonYears;

  const purchasingPowerLossPercent =
    baselineExpenses > 0 ? Number(((monthlyIncrease / baselineExpenses) * 100).toFixed(1)) : 0;

  const baselineRunway = budget.currentSavings / (baselineExpenses || 1);
  const newRunwayMonths = Number((budget.currentSavings / (newTotalExpenses || 1)).toFixed(1));
  const runwayMonthsLost = Number(Math.max(0, baselineRunway - newRunwayMonths).toFixed(1));

  return {
    monthlyIncrease,
    rentIncrease,
    groceryIncrease,
    utilityIncrease,
    transportIncrease,
    newTotalExpenses,
    newMonthlySurplus,
    cumulativeLoss1Year,
    cumulativeLossHorizon,
    purchasingPowerLossPercent,
    newRunwayMonths,
    runwayMonthsLost,
  };
}
