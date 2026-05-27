export interface BuyerInputs {
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanType: 'conventional' | 'fha' | 'va' | 'cash';
  loanTerm: number;
  locationState: string;
  locationCounty: string;
  propertyType: string;
  propertyUse: string;
  closingDate: string;
  hoa: number;
  brokerFee: number;
  sellerCredit: number;
  otherCredits: number;
  otherCharges: number;
}

export interface SellerInputs {
  salesPrice: number;
  locationState: string;
  locationCounty: string;
  propertyType: string;
  commission: number;
  mortgagePayoff: number;
  helocPayoff: number;
  settlementDate: string;
  sellerCredit: number;
  otherCharges: number;
  waterEscrow: number;
  adminFee: number;
}

export interface BuyerResults {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPI: number;
  monthlyPayment: number;
  // Lender fees
  originationFee: number;
  appraisalFee: number;
  creditReport: number;
  floodCert: number;
  taxService: number;
  // Title fees
  titleInsuranceLender: number;
  titleInsuranceOwner: number;
  settlementFee: number;
  deedRecording: number;
  deedOfTrustRecording: number;
  // Taxes
  recordationTax: number;
  transferTax: number;
  // Prepaid/escrow
  prepaidInterest: number;
  homeownersInsurance: number;
  // Totals
  totalLenderFees: number;
  totalTitleFees: number;
  totalTaxes: number;
  totalPrepaids: number;
  totalClosingCosts: number;
  sellerCredit: number;
  otherCredits: number;
  otherCharges: number;
  cashToClose: number;
  // Monthly breakdown
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthlyPayment: number;
}

export interface SellerResults {
  salesPrice: number;
  // Deductions
  mortgagePayoff: number;
  helocPayoff: number;
  commission: number;
  adminFee: number;
  waterEscrow: number;
  settlementFee: number;
  deedPrep: number;
  wireFee: number;
  notaryFee: number;
  mortgageReleaseFee: number;
  recordationTax: number;
  transferTax: number;
  proratedTaxes: number;
  sellerCredit: number;
  otherCharges: number;
  totalDeductions: number;
  cashToSeller: number;
  annualPropertyTax: number;
}

export function getTitleInsurancePremium(price: number): number {
  if (price <= 100000) return 575;
  if (price <= 200000) return 575 + ((price - 100000) / 1000) * 4.5;
  if (price <= 500000) return 1025 + ((price - 200000) / 1000) * 3.75;
  return 2150 + ((price - 500000) / 1000) * 3.0;
}

export function getTransferRecordationTax(price: number, state: string): { recordation: number; transfer: number } {
  switch (state) {
    case 'DC':
      return { recordation: price * 0.0145, transfer: price * 0.011 };
    case 'MD':
      return { recordation: price * 0.01, transfer: price * 0.005 };
    case 'VA':
      return { recordation: price * 0.0025, transfer: price * 0.001 };
    default:
      return { recordation: price * 0.01, transfer: price * 0.005 };
  }
}

export function getMonthlyPI(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0) return 0;
  if (annualRate === 0) return principal / (termYears * 12);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function getAnnualPropertyTax(price: number, state: string): number {
  const rates: Record<string, number> = {
    DC: 0.0085, MD: 0.01, VA: 0.0087, FL: 0.009, CA: 0.0125, NY: 0.015,
    TX: 0.018, IL: 0.015, PA: 0.013, NJ: 0.021, OH: 0.014, GA: 0.009,
    NC: 0.0077, WA: 0.0093
  };
  return price * (rates[state] || 0.012);
}

export function getProratedTax(annualTax: number, closingDate: string): number {
  const date = new Date(closingDate);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const pctYear = dayOfYear / 365;
  return annualTax * pctYear;
}

export function calculateBuyer(inputs: BuyerInputs): BuyerResults {
  const { purchasePrice, downPayment, interestRate, loanType, loanTerm, locationState } = inputs;
  const loanAmount = loanType === 'cash' ? 0 : Math.max(0, purchasePrice - downPayment);
  const isFinanced = loanType !== 'cash' && loanAmount > 0;

  // Lender fees
  const originationFee = isFinanced ? loanAmount * 0.01 : 0;
  const appraisalFee = isFinanced ? 500 : 0;
  const creditReport = isFinanced ? 50 : 0;
  const floodCert = isFinanced ? 25 : 0;
  const taxService = isFinanced ? 85 : 0;
  const fhaMip = loanType === 'fha' ? loanAmount * 0.0175 : 0;
  const totalLenderFees = originationFee + appraisalFee + creditReport + floodCert + taxService + fhaMip;

  // Title fees
  const titleInsuranceLender = isFinanced ? getTitleInsurancePremium(loanAmount) * 0.6 : 0;
  const titleInsuranceOwner = getTitleInsurancePremium(purchasePrice);
  const settlementFee = 450;
  const deedRecording = 75;
  const deedOfTrustRecording = isFinanced ? 75 : 0;
  const totalTitleFees = titleInsuranceLender + titleInsuranceOwner + settlementFee + deedRecording + deedOfTrustRecording;

  // Taxes (buyer pays 50% in DC customary split)
  const taxes = getTransferRecordationTax(purchasePrice, locationState);
  const recordationTax = taxes.recordation * 0.5;
  const transferTax = taxes.transfer * 0.5;
  const totalTaxes = recordationTax + transferTax;

  // Prepaids
  const prepaidInterest = isFinanced ? (loanAmount * (interestRate / 100) / 365) * 15 : 0;
  const homeownersInsurance = purchasePrice * 0.005;
  const totalPrepaids = prepaidInterest + homeownersInsurance;

  const grossClosingCosts = totalLenderFees + totalTitleFees + totalTaxes + totalPrepaids + inputs.brokerFee + inputs.otherCharges;
  const totalCredits = inputs.sellerCredit + inputs.otherCredits;
  const totalClosingCosts = Math.max(0, grossClosingCosts - totalCredits);
  const cashToClose = downPayment + totalClosingCosts;

  // Monthly
  const monthlyPI = getMonthlyPI(loanAmount, interestRate, loanTerm);
  const annualTax = getAnnualPropertyTax(purchasePrice, locationState);
  const monthlyTaxes = annualTax / 12;
  const monthlyInsurance = homeownersInsurance / 12;
  const monthlyHOA = inputs.hoa;
  const totalMonthlyPayment = monthlyPI + monthlyTaxes + monthlyInsurance + monthlyHOA;

  return {
    purchasePrice, downPayment, loanAmount, monthlyPI,
    monthlyPayment: monthlyPI,
    originationFee, appraisalFee, creditReport, floodCert, taxService,
    titleInsuranceLender, titleInsuranceOwner, settlementFee, deedRecording, deedOfTrustRecording,
    recordationTax, transferTax,
    prepaidInterest, homeownersInsurance,
    totalLenderFees, totalTitleFees, totalTaxes, totalPrepaids,
    totalClosingCosts,
    sellerCredit: inputs.sellerCredit,
    otherCredits: inputs.otherCredits,
    otherCharges: inputs.otherCharges,
    cashToClose,
    monthlyTaxes, monthlyInsurance, monthlyHOA,
    totalMonthlyPayment
  };
}

export function calculateSeller(inputs: SellerInputs): SellerResults {
  const { salesPrice, locationState, commission } = inputs;

  const commissionAmt = salesPrice * (commission / 100);
  const adminFee = inputs.adminFee || 0;
  const waterEscrow = inputs.waterEscrow || 250;
  const settlementFee = 425;
  const deedPrep = 0;
  const wireFee = 0;
  const notaryFee = 0;
  const mortgageReleaseFee = inputs.mortgagePayoff > 0 ? 185 : 0;

  // Seller pays full recordation+transfer in DC customary split (or 50/50)
  const taxes = getTransferRecordationTax(salesPrice, locationState);
  const recordationTax = taxes.recordation * 0.5;
  const transferTax = taxes.transfer * 0.5;

  const annualTax = getAnnualPropertyTax(salesPrice, locationState);
  const proratedTaxes = getProratedTax(annualTax, inputs.settlementDate || new Date().toISOString());

  const sellerCredit = inputs.sellerCredit || 0;
  const otherCharges = inputs.otherCharges || 0;

  const totalDeductions =
    inputs.mortgagePayoff + inputs.helocPayoff + commissionAmt + adminFee +
    waterEscrow + settlementFee + deedPrep + wireFee + notaryFee +
    mortgageReleaseFee + recordationTax + transferTax + proratedTaxes +
    sellerCredit + otherCharges;

  const cashToSeller = salesPrice - totalDeductions;

  return {
    salesPrice, mortgagePayoff: inputs.mortgagePayoff, helocPayoff: inputs.helocPayoff,
    commission: commissionAmt, adminFee, waterEscrow, settlementFee, deedPrep,
    wireFee, notaryFee, mortgageReleaseFee, recordationTax, transferTax, proratedTaxes,
    sellerCredit, otherCharges, totalDeductions, cashToSeller, annualPropertyTax: annualTax
  };
}
