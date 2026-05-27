export interface BuyerInputs {
  purchasePrice: number;
  downPayment: number;
  downPaymentPct: number;
  interestRate: number;
  loanType: 'conventional' | 'fha' | 'va' | 'cash';
  loanTerm: number;
  locationState: string;
  locationCounty: string;
  propertyType: string;
  propertyUse: string;
  sellerType: string;
  closingDate: string;
  hoa: number;
  brokerFee: number;
  sellerCredit: number;
  otherCredits: string;
  otherCharges: string;
  // DC-specific (Primary Residence + price ≤ $647k)
  dcHomesteadDeduction: boolean;
  dcFirstTimeBuyer: boolean;
  // MD-specific (Primary Residence only)
  marylandFirstTimeBuyer: boolean;
  // VA loan-specific
  vaDisabilityRating: boolean;
  vaFirstTimeCOE: boolean;
}

export interface SellerInputs {
  salesPrice: number;
  locationState: string;
  locationCounty: string;
  propertyType: string;
  commission: number;
  numMortgages: number;
  mortgagePayoff: number;
  mortgagePayoff2: number;
  mortgagePayoff3: number;
  mortgagePayoff4: number;
  mortgagePayoff5: number;
  settlementDate: string;
  sellerCredit: number;
  otherCharges: string;
  otherCredits: string;
  waterEscrow: number;
  adminFee: number;
  termiteTreatment: number;
  homeWarranty: number;
  monthlyHoa: number;
  firpta: boolean;
  // Maryland-specific seller questions
  mdSellerResident: boolean;
  mdSellerOccupied: boolean;
  mdPropertyOwnership: 'individual' | 'business';
}

export interface BuyerResults {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPI: number;
  originationFee: number;
  appraisalFee: number;
  creditReport: number;
  floodCert: number;
  taxService: number;
  fhaMip: number;
  vaFundingFee: number;
  titleInsuranceLender: number;
  titleInsuranceOwner: number;
  settlementFee: number;
  deedRecording: number;
  deedOfTrustRecording: number;
  recordationTax: number;
  transferTax: number;
  prepaidInterest: number;
  homeownersInsurance: number;
  totalLenderFees: number;
  totalTitleFees: number;
  totalTaxes: number;
  totalPrepaids: number;
  totalClosingCosts: number;
  sellerCredit: number;
  otherCredits: number;
  otherCharges: number;
  cashToClose: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthlyPayment: number;
}

export interface SellerResults {
  salesPrice: number;
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

export function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function getTitleInsurancePremium(price: number): number {
  if (price <= 100000) return 575;
  if (price <= 200000) return 575 + ((price - 100000) / 1000) * 4.5;
  if (price <= 500000) return 1025 + ((price - 200000) / 1000) * 3.75;
  return 2150 + ((price - 500000) / 1000) * 3.0;
}

export function getTransferRecordationTax(price: number, state: string): { recordation: number; transfer: number } {
  switch (state) {
    case 'DC': return { recordation: price * 0.0145, transfer: price * 0.011 };
    case 'MD': return { recordation: price * 0.01, transfer: price * 0.005 };
    case 'VA': return { recordation: price * 0.0025, transfer: price * 0.001 };
    case 'FL': return { recordation: price * 0.006, transfer: price * 0.007 };
    case 'CA': return { recordation: price * 0.0011, transfer: price * 0.0011 };
    case 'NY': return { recordation: price * 0.004, transfer: price * 0.004 };
    case 'TX': return { recordation: 0, transfer: 0 };
    default: return { recordation: price * 0.01, transfer: price * 0.005 };
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
  const start = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return annualTax * (dayOfYear / 365);
}

export function calculateBuyer(inputs: BuyerInputs): BuyerResults {
  const { purchasePrice, downPayment, interestRate, loanType, loanTerm, locationState } = inputs;
  const loanAmount = loanType === 'cash' ? 0 : Math.max(0, purchasePrice - downPayment);
  const isFinanced = loanType !== 'cash' && loanAmount > 0;

  const originationFee = isFinanced ? loanAmount * 0.01 : 0;
  const appraisalFee = isFinanced ? 500 : 0;
  const creditReport = isFinanced ? 50 : 0;
  const floodCert = isFinanced ? 25 : 0;
  const taxService = isFinanced ? 85 : 0;
  const fhaMip = loanType === 'fha' ? loanAmount * 0.0175 : 0;
  // VA Funding Fee: 2.15% first use, 3.3% subsequent; waived if disability rating
  let vaFundingFee = 0;
  if (loanType === 'va' && !inputs.vaDisabilityRating) {
    vaFundingFee = loanAmount * (inputs.vaFirstTimeCOE ? 0.0215 : 0.033);
  }
  const totalLenderFees = originationFee + appraisalFee + creditReport + floodCert + taxService + fhaMip + vaFundingFee;

  const titleInsuranceLender = isFinanced ? getTitleInsurancePremium(loanAmount) * 0.6 : 0;
  const titleInsuranceOwner = getTitleInsurancePremium(purchasePrice);
  const settlementFee = 450;
  const deedRecording = 75;
  const deedOfTrustRecording = isFinanced ? 75 : 0;
  const totalTitleFees = titleInsuranceLender + titleInsuranceOwner + settlementFee + deedRecording + deedOfTrustRecording;

  const taxes = getTransferRecordationTax(purchasePrice, locationState);
  let recordationTax = taxes.recordation * 0.5;
  let transferTax = taxes.transfer * 0.5;

  // DC First-Time Homebuyer: reduced recordation rate on first $647k
  if (locationState === 'DC' && inputs.dcFirstTimeBuyer && purchasePrice <= 647000) {
    recordationTax = purchasePrice * 0.00725; // 0.725% vs 1.45%
  }
  // Maryland First-Time Homebuyer: exempt from buyer's portion of state transfer tax
  if (locationState === 'MD' && inputs.marylandFirstTimeBuyer) {
    transferTax = 0;
  }

  const totalTaxes = recordationTax + transferTax;

  const prepaidInterest = isFinanced ? (loanAmount * (interestRate / 100) / 365) * 15 : 0;
  const homeownersInsurance = (purchasePrice * 0.005) / 12;
  const totalPrepaids = prepaidInterest + homeownersInsurance * 12;

  const grossCosts = totalLenderFees + totalTitleFees + totalTaxes + totalPrepaids + inputs.brokerFee + (Number(inputs.otherCharges) || 0);
  const totalCredits = inputs.sellerCredit + (Number(inputs.otherCredits) || 0);
  const totalClosingCosts = Math.max(0, grossCosts - totalCredits);
  const cashToClose = downPayment + totalClosingCosts;

  const monthlyPI = getMonthlyPI(loanAmount, interestRate, loanTerm);
  const annualTax = getAnnualPropertyTax(purchasePrice, locationState);
  const monthlyTaxes = annualTax / 12;
  const monthlyInsurance = homeownersInsurance;
  const monthlyHOA = inputs.hoa;
  const totalMonthlyPayment = monthlyPI + monthlyTaxes + monthlyInsurance + monthlyHOA;

  return {
    purchasePrice, downPayment, loanAmount, monthlyPI,
    originationFee, appraisalFee, creditReport, floodCert, taxService, fhaMip, vaFundingFee,
    titleInsuranceLender, titleInsuranceOwner, settlementFee, deedRecording, deedOfTrustRecording,
    recordationTax, transferTax,
    prepaidInterest, homeownersInsurance,
    totalLenderFees, totalTitleFees, totalTaxes, totalPrepaids,
    totalClosingCosts, sellerCredit: inputs.sellerCredit,
    otherCredits: Number(inputs.otherCredits) || 0, otherCharges: Number(inputs.otherCharges) || 0,
    cashToClose, monthlyTaxes, monthlyInsurance, monthlyHOA, totalMonthlyPayment
  };
}

export function calculateSeller(inputs: SellerInputs): SellerResults {
  const { salesPrice, locationState, commission } = inputs;
  const commissionAmt = salesPrice * (commission / 100);
  const adminFee = inputs.adminFee || 0;
  const waterEscrow = inputs.waterEscrow ?? 250;
  const settlementFee = 425;

  const totalMortgagePayoff =
    (inputs.mortgagePayoff || 0) +
    (inputs.numMortgages >= 2 ? inputs.mortgagePayoff2 || 0 : 0) +
    (inputs.numMortgages >= 3 ? inputs.mortgagePayoff3 || 0 : 0) +
    (inputs.numMortgages >= 4 ? inputs.mortgagePayoff4 || 0 : 0) +
    (inputs.numMortgages >= 5 ? inputs.mortgagePayoff5 || 0 : 0);
  const mortgageReleaseFee = inputs.numMortgages > 0 ? 185 * inputs.numMortgages : 0;

  const taxes = getTransferRecordationTax(salesPrice, locationState);
  const recordationTax = taxes.recordation * 0.5;
  const transferTax = taxes.transfer * 0.5;

  const annualTax = getAnnualPropertyTax(salesPrice, locationState);
  const proratedTaxes = getProratedTax(annualTax, inputs.settlementDate || new Date().toISOString());

  const sellerCredit = inputs.sellerCredit || 0;
  const otherCharges = Number(inputs.otherCharges) || 0;
  const termiteTreatment = inputs.termiteTreatment || 0;
  const homeWarranty = inputs.homeWarranty || 0;

  // Maryland non-resident withholding (7.5% for individuals, 8.25% for business entities)
  let mdNonResidentWithholding = 0;
  if (locationState === 'MD' && !inputs.mdSellerResident) {
    if (!inputs.mdSellerOccupied) {
      const rate = inputs.mdPropertyOwnership === 'business' ? 0.0825 : 0.075;
      mdNonResidentWithholding = salesPrice * rate;
    }
  }

  const totalDeductions =
    totalMortgagePayoff + commissionAmt + adminFee +
    waterEscrow + settlementFee + mortgageReleaseFee + recordationTax + transferTax +
    proratedTaxes + sellerCredit + otherCharges + termiteTreatment + homeWarranty +
    mdNonResidentWithholding;

  return {
    salesPrice, mortgagePayoff: totalMortgagePayoff, helocPayoff: 0,
    commission: commissionAmt, adminFee, waterEscrow, settlementFee,
    deedPrep: 0, wireFee: 0, notaryFee: 0, mortgageReleaseFee,
    recordationTax, transferTax, proratedTaxes, sellerCredit, otherCharges,
    totalDeductions, cashToSeller: salesPrice - totalDeductions, annualPropertyTax: annualTax
  };
}

export const DEFAULT_BUYER_INPUTS: BuyerInputs = {
  purchasePrice: 0, downPayment: 0, downPaymentPct: 20,
  interestRate: 6.875, loanType: 'conventional', loanTerm: 30,
  locationState: 'DC', locationCounty: 'Washington DC',
  propertyType: 'Single Family Home', propertyUse: 'Primary Residence',
  sellerType: 'Individual Owner(s)/Non/Short Sale',
  closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  hoa: 0, brokerFee: 0, sellerCredit: 0, otherCredits: '', otherCharges: '',
  dcHomesteadDeduction: false, dcFirstTimeBuyer: false,
  marylandFirstTimeBuyer: false,
  vaDisabilityRating: false, vaFirstTimeCOE: false,
};

export const DEFAULT_SELLER_INPUTS: SellerInputs = {
  salesPrice: 0, locationState: 'DC', locationCounty: 'Washington DC',
  propertyType: 'Single Family Home', commission: 6,
  numMortgages: 1,
  mortgagePayoff: 0, mortgagePayoff2: 0, mortgagePayoff3: 0, mortgagePayoff4: 0, mortgagePayoff5: 0,
  settlementDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  sellerCredit: 0, otherCharges: '', otherCredits: '', waterEscrow: 250, adminFee: 0,
  termiteTreatment: 0, homeWarranty: 0, monthlyHoa: 0, firpta: false,
  mdSellerResident: true, mdSellerOccupied: true, mdPropertyOwnership: 'individual',
};
