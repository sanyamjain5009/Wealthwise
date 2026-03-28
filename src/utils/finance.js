// Format Indian number system
export const formatINR = (amount, compact = false) => {
  if (compact) {
    if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)}Cr`;
    if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2)}L`;
    if (amount >= 1e3) return `₹${(amount / 1e3).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercent = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

// SIP future value: FV = P * [((1+r)^n - 1) / r] * (1+r)
export const calcSIPFV = (monthlyAmount, annualReturn, years) => {
  const r = annualReturn / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthlyAmount * n;
  return monthlyAmount * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
};

// Lump sum future value
export const calcLumpFV = (principal, annualReturn, years) => {
  return principal * Math.pow(1 + annualReturn / 100, years);
};

// Total invested in SIP
export const calcSIPInvested = (monthlyAmount, years) => monthlyAmount * 12 * years;

// Inflation adjusted value
export const inflationAdjust = (amount, inflationRate, years) => {
  return amount / Math.pow(1 + inflationRate / 100, years);
};

// Required SIP to reach corpus
export const requiredSIP = (targetCorpus, annualReturn, years) => {
  const r = annualReturn / 100 / 12;
  const n = years * 12;
  if (r === 0) return targetCorpus / n;
  return targetCorpus * r / (((Math.pow(1 + r, n) - 1)) * (1 + r));
};

// Withdrawal sustainability (Safe Withdrawal Rate)
export const calcSWR = (corpus, annualExpenses) => {
  return (annualExpenses / corpus) * 100;
};

// Years to retirement
export const yearsToRetirement = (currentAge, retirementAge) => retirementAge - currentAge;

// Build SIP projection data for chart
export const buildSIPProjection = (monthlyAmount, annualReturn, years, startingCorpus = 0) => {
  const data = [];
  let corpus = startingCorpus;
  const monthlyRate = annualReturn / 100 / 12;
  
  for (let year = 0; year <= years; year++) {
    const invested = startingCorpus + monthlyAmount * 12 * year;
    const gains = corpus - invested;
    data.push({
      year: year,
      label: `Y${year}`,
      corpus: Math.round(corpus),
      invested: Math.round(invested),
      gains: Math.round(Math.max(0, gains)),
    });
    // Grow for next year
    for (let m = 0; m < 12; m++) {
      corpus = corpus * (1 + monthlyRate) + monthlyAmount;
    }
  }
  return data;
};

// Index benchmark returns (historical averages)
export const BENCHMARKS = {
  'Nifty 50': { cagr: 13.5, color: '#2d6a4f' },
  'Sensex': { cagr: 13.2, color: '#52b788' },
  'Nifty Midcap 150': { cagr: 16.8, color: '#c8873a' },
  'Nifty Smallcap 250': { cagr: 15.2, color: '#e8a85a' },
  'Fixed Deposit': { cagr: 7.0, color: '#7a7060' },
  'PPF': { cagr: 7.1, color: '#9a8a70' },
};

// MF categories with typical return ranges
export const MF_CATEGORIES = [
  { name: 'Large Cap', minReturn: 11, maxReturn: 14, risk: 'Moderate', typical: 12.5 },
  { name: 'Flexi Cap', minReturn: 12, maxReturn: 16, risk: 'Moderate-High', typical: 14 },
  { name: 'Mid Cap', minReturn: 14, maxReturn: 20, risk: 'High', typical: 16 },
  { name: 'Small Cap', minReturn: 14, maxReturn: 22, risk: 'Very High', typical: 17 },
  { name: 'ELSS', minReturn: 11, maxReturn: 15, risk: 'Moderate', typical: 13, taxBenefit: true },
  { name: 'Index Fund', minReturn: 11, maxReturn: 14, risk: 'Moderate', typical: 13, isIndex: true },
  { name: 'Debt Fund', minReturn: 6, maxReturn: 8, risk: 'Low', typical: 7 },
  { name: 'Hybrid', minReturn: 9, maxReturn: 13, risk: 'Moderate', typical: 11 },
];
