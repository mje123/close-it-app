import React from 'react';
import type { BuyerInputs, BuyerResults, SellerInputs, SellerResults } from '../../utils/calculations';
import { fmt } from '../../utils/calculations';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';

type Props =
  | { type: 'buyer'; inputs: BuyerInputs; results: BuyerResults; onBack: () => void }
  | { type: 'seller'; inputs: SellerInputs; results: SellerResults; onBack: () => void };

export function ClosingDisclosure(props: Props) {
  if (props.type === 'buyer') {
    return <BuyerCD inputs={props.inputs} results={props.results} onBack={props.onBack} />;
  }
  return <SellerCD inputs={props.inputs} results={props.results} onBack={props.onBack} />;
}

// ── Shared layout primitives ──────────────────────────────────────────────────

function TopBar({ onBack, onPrint, onDownload }: { onBack: () => void; onPrint: () => void; onDownload: () => void }) {
  return (
    <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between no-print">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[#3EABA2] hover:text-teal-300 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <div className="flex gap-2">
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded tracking-wide uppercase transition-colors"
        >
          <Printer size={13} /> Print It!
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3EABA2] hover:bg-teal-500 text-white text-xs font-bold rounded tracking-wide uppercase transition-colors"
        >
          <Download size={13} /> Save It!
        </button>
      </div>
    </div>
  );
}

function PageTitle({ sub }: { sub: string }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-black text-[#3EABA2] tracking-widest">CLOSE IT!™</h1>
      <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
      <p className="text-xs text-gray-500 mt-1">Federal Title &amp; Escrow Company &nbsp;·&nbsp; 202.362.1500</p>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-3 py-1.5 text-[11px] font-bold text-[#3EABA2] uppercase tracking-widest border-b border-gray-700">
        {title}
      </div>
      <div className="p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-3 text-xs">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className={`text-right font-semibold ${accent ? 'text-[#E05C5C]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function SecHeader({ label }: { label: string }) {
  return (
    <div className="bg-gray-800 px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700 border-t border-gray-700">
      {label}
    </div>
  );
}

function LineRow({
  label, value, sub, indent, teal, muted,
}: {
  label: string; value: string | number; sub?: string;
  indent?: boolean; teal?: boolean; muted?: boolean;
}) {
  const display = typeof value === 'number' ? fmt(value) : value;
  return (
    <div className={`flex justify-between items-start gap-4 px-4 py-2 text-sm border-b border-gray-800 ${indent ? 'pl-8' : ''}`}>
      <div>
        <span className={muted ? 'text-gray-500' : 'text-gray-300'}>{label}</span>
        {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
      </div>
      <span className={`text-right font-medium tabular-nums ${teal ? 'text-[#3EABA2]' : muted ? 'text-gray-500' : 'text-white'}`}>
        {display}
      </span>
    </div>
  );
}

function SubTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 border-b border-gray-700">
      <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-bold text-[#3EABA2] tabular-nums">{fmt(value)}</span>
    </div>
  );
}

function BigTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-gray-750 bg-gray-700 border-b border-gray-600">
      <span className="text-sm font-bold text-white">{label}</span>
      <span className="text-base font-bold text-[#3EABA2] tabular-nums">{fmt(value)}</span>
    </div>
  );
}

// ── Buyer Closing Disclosure ──────────────────────────────────────────────────

function BuyerCD({ inputs: i, results: r, onBack }: { inputs: BuyerInputs; results: BuyerResults; onBack: () => void }) {
  const isFinanced = i.loanType !== 'cash';
  const closingDate = new Date(i.closingDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const loanTypeLabel = i.loanType === 'cash' ? 'Cash' : i.loanType.toUpperCase();

  // Section totals
  const sectionA = r.originationFee + r.fhaMip + r.vaFundingFee;
  const sectionB = r.appraisalFee + r.creditReport + r.floodCert + r.taxService;
  const sectionC = r.titleInsuranceLender + (isFinanced ? r.settlementFee : 0);
  const sectionD = sectionA + sectionB + sectionC; // total loan costs
  const sectionE = r.deedRecording + r.deedOfTrustRecording + r.recordationTax + r.transferTax;
  const sectionF = r.totalPrepaids; // prepaidInterest + homeownersInsurance*12
  const sectionH = r.titleInsuranceOwner + (i.brokerFee || 0) + (!isFinanced ? r.settlementFee : 0) + (Number(i.otherCharges) || 0);
  const sectionI = sectionE + sectionF + sectionH;
  const sectionJ = sectionD + sectionI; // = grossCosts
  const totalCredits = r.sellerCredit + (Number(i.otherCredits) || 0);

  const mdFTB = i.locationState === 'MD' && i.marylandFirstTimeBuyer;
  const dcFTB = i.locationState === 'DC' && i.dcFirstTimeBuyer;

  const handleDownload = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const W = 190;
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('CLOSE IT!™ — Buyer Closing Disclosure', 10, 18);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Federal Title & Escrow Company  |  202.362.1500  |  services@federaltitle.com', 10, 25);
    doc.setLineWidth(0.4); doc.line(10, 28, 200, 28);

    let y = 35;
    const row = (lbl: string, val: string, bold = false) => {
      if (bold) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal');
      doc.text(lbl, 12, y); doc.text(val, 200, y, { align: 'right' });
      y += 5.5; if (y > 265) { doc.addPage(); y = 15; }
    };
    const sec = (title: string) => {
      doc.setFillColor(50, 50, 50); doc.rect(10, y - 4, W, 7, 'F');
      doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(title.toUpperCase(), 12, y); doc.setTextColor(0);
      doc.setFont('helvetica', 'normal'); y += 7;
    };

    sec('Closing Information');
    row('State / County', `${i.locationState} — ${i.locationCounty}`);
    row('Property Type', i.propertyType); row('Property Use', i.propertyUse);
    row('Closing Date', closingDate);
    if (isFinanced) {
      sec('Loan Information');
      row('Loan Amount', fmt(r.loanAmount));
      row('Loan Type / Term', `${loanTypeLabel} / ${i.loanTerm}yr`);
      row('Interest Rate', `${i.interestRate.toFixed(3)}%`);
    }
    sec('A. Origination Charges');
    if (r.originationFee) row('Loan Origination Fee (1%)', fmt(r.originationFee));
    if (r.fhaMip) row('FHA Upfront MIP (1.75%)', fmt(r.fhaMip));
    if (r.vaFundingFee) row(`VA Funding Fee (${i.vaFirstTimeCOE ? '2.15' : '3.3'}%)`, fmt(r.vaFundingFee));
    row('Total A', fmt(sectionA), true);
    sec('B. Services You Cannot Shop For');
    if (isFinanced) {
      row('Appraisal Fee', fmt(r.appraisalFee));
      row('Credit Report', fmt(r.creditReport));
      row('Flood Certificate', fmt(r.floodCert));
      row('Tax Service Fee', fmt(r.taxService));
    }
    row('Total B', fmt(sectionB), true);
    sec('C. Services You Can Shop For');
    if (isFinanced && r.titleInsuranceLender) row("Lender's Title Insurance", fmt(r.titleInsuranceLender));
    if (isFinanced) row('Settlement / Closing Fee', fmt(r.settlementFee));
    row('Total C', fmt(sectionC), true);
    row('D. Total Loan Costs (A+B+C)', fmt(sectionD), true);
    sec('E. Taxes & Government Fees');
    row('Deed Recording Fee', fmt(r.deedRecording));
    if (r.deedOfTrustRecording) row('Deed of Trust Recording Fee', fmt(r.deedOfTrustRecording));
    row(`State Recordation Tax${dcFTB ? ' (1st Time Buyer Rate)' : ''}`, fmt(r.recordationTax));
    row(`State/County Transfer Tax${mdFTB ? ' — Exempt (MD 1st Time Buyer)' : ''}`, mdFTB ? '$0.00' : fmt(r.transferTax));
    row('Total E', fmt(sectionE), true);
    sec('F. Prepaids');
    row('Prepaid Interest (15 days)', fmt(r.prepaidInterest));
    row("Homeowner's Insurance (12 months)", fmt(r.homeownersInsurance * 12));
    row('Total F', fmt(sectionF), true);
    sec('H. Other');
    row("Owner's Title Insurance", fmt(r.titleInsuranceOwner));
    if (!isFinanced) row('Settlement / Closing Fee', fmt(r.settlementFee));
    if (i.brokerFee) row('Broker / Admin Fee', fmt(i.brokerFee));
    if (Number(i.otherCharges)) row('Other Charges', fmt(Number(i.otherCharges)));
    row('Total H', fmt(sectionH), true);
    row('I. Total Other Costs (E+F+H)', fmt(sectionI), true);
    row('J. Total Closing Costs (D+I)', fmt(sectionJ), true);
    if (totalCredits) { sec('Credits'); row('Total Credits', `-${fmt(totalCredits)}`); }
    sec('Cash to Close');
    row('Sale Price of Property', fmt(r.purchasePrice));
    row('Total Closing Costs (J)', fmt(sectionJ));
    if (totalCredits) row('Total Credits', `-${fmt(totalCredits)}`);
    row('Loan Amount', isFinanced ? `-${fmt(r.loanAmount)}` : '$0.00');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    y += 2;
    doc.text('ESTIMATED CASH TO CLOSE', 12, y);
    doc.text(fmt(r.cashToClose), 200, y, { align: 'right' });
    y += 10;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(120);
    doc.text('This estimate is provided for informational purposes only. Actual costs may vary. Not a commitment to lend. © Federal Title & Escrow Company', 10, y);
    doc.save('closeit-buyer-disclosure.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <TopBar onBack={onBack} onPrint={() => window.print()} onDownload={handleDownload} />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <PageTitle sub="Buyer Closing Disclosure Estimate" />

        {/* 3-column header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoCard title="Closing Information">
            <InfoRow label="Date Issued" value={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
            <InfoRow label="Closing Date" value={closingDate} accent />
            <InfoRow label="State" value={i.locationState} />
            <InfoRow label="County" value={i.locationCounty} />
            <InfoRow label="Property Type" value={i.propertyType} />
            <InfoRow label="Property Use" value={i.propertyUse} />
          </InfoCard>
          <InfoCard title="Transaction Information">
            <InfoRow label="Sale Price" value={fmt(i.purchasePrice)} accent />
            <InfoRow label="Seller Type" value={i.sellerType} />
            {isFinanced && <InfoRow label="Down Payment" value={`${fmt(r.downPayment)} (${i.downPaymentPct.toFixed(0)}%)`} />}
          </InfoCard>
          <InfoCard title="Loan Information">
            <InfoRow label="Loan Amount" value={fmt(r.loanAmount)} accent />
            <InfoRow label="Loan Type" value={loanTypeLabel} />
            {isFinanced && (
              <>
                <InfoRow label="Interest Rate" value={`${i.interestRate.toFixed(3)}%`} />
                <InfoRow label="Loan Term" value={`${i.loanTerm}-year fixed`} />
              </>
            )}
          </InfoCard>
        </div>

        {/* Projected Payments (financed only) */}
        {isFinanced && (
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <span className="text-xs font-bold text-[#3EABA2] uppercase tracking-widest">Projected Monthly Payments</span>
            </div>
            <LineRow label="Principal &amp; Interest" value={r.monthlyPI} teal />
            <LineRow label="Est. Monthly Property Taxes" value={r.monthlyTaxes} />
            <LineRow label="Homeowner's Insurance" value={r.monthlyInsurance} />
            {r.monthlyHOA > 0 && <LineRow label="HOA Dues" value={r.monthlyHOA} />}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-800 border-t border-gray-700">
              <span className="text-sm font-bold text-white">Estimated Total Monthly Payment (PITI)</span>
              <span className="text-base font-bold text-[#3EABA2] tabular-nums">{fmt(r.totalMonthlyPayment)}</span>
            </div>
          </div>
        )}

        {/* Closing Costs Sections A–J */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5 border-b border-gray-700 flex items-center justify-between">
            <span className="text-sm font-bold text-white uppercase tracking-wide">Closing Cost Details</span>
          </div>

          {/* A — Origination (financed only) */}
          {isFinanced && (
            <>
              <SecHeader label="A. Origination Charges" />
              <LineRow label="Loan Origination Fee (1%)" value={r.originationFee} />
              {r.fhaMip > 0 && <LineRow label="FHA Upfront Mortgage Insurance Premium (1.75%)" value={r.fhaMip} />}
              {r.vaFundingFee > 0 && (
                <LineRow
                  label={`VA Funding Fee (${i.vaFirstTimeCOE ? '2.15' : '3.3'}% — ${i.vaFirstTimeCOE ? 'First Use' : 'Subsequent Use'})`}
                  value={r.vaFundingFee}
                />
              )}
              <SubTotal label="A. Total Origination Charges" value={sectionA} />

              {/* B — Cannot Shop For */}
              <SecHeader label="B. Services You Cannot Shop For" />
              <LineRow label="Appraisal Fee" value={r.appraisalFee} />
              <LineRow label="Credit Report" value={r.creditReport} />
              <LineRow label="Flood Certificate" value={r.floodCert} />
              <LineRow label="Tax Service Fee" value={r.taxService} />
              <SubTotal label="B. Total" value={sectionB} />

              {/* C — Can Shop For */}
              <SecHeader label="C. Services You Can Shop For" />
              <LineRow label="Lender's Title Insurance" value={r.titleInsuranceLender} />
              <LineRow label="Settlement / Closing Fee" value={r.settlementFee} />
              <SubTotal label="C. Total" value={sectionC} />

              <BigTotal label="D. Total Loan Costs  (A + B + C)" value={sectionD} />
            </>
          )}

          {/* Cash settlement fee (cash purchase) */}
          {!isFinanced && (
            <>
              <SecHeader label="Settlement Charges" />
              <LineRow label="Settlement / Closing Fee" value={r.settlementFee} />
              <SubTotal label="Total Settlement" value={r.settlementFee} />
            </>
          )}

          {/* E — Taxes & Government Fees */}
          <SecHeader label="E. Taxes and Other Government Fees" />
          <LineRow label="Deed Recording Fee" value={r.deedRecording} />
          {isFinanced && <LineRow label="Deed of Trust Recording Fee" value={r.deedOfTrustRecording} />}
          <LineRow
            label={`State Recordation Tax${dcFTB ? ' (First-Time Homebuyer Rate — 0.725%)' : ''}`}
            value={r.recordationTax}
          />
          <LineRow
            label={mdFTB ? 'State Transfer Tax — Exempt (Maryland First-Time Homebuyer)' : 'State / County Transfer Tax'}
            value={mdFTB ? '$0.00' : fmt(r.transferTax)}
          />
          <SubTotal label="E. Total Taxes and Government Fees" value={sectionE} />

          {/* F — Prepaids */}
          <SecHeader label="F. Prepaids" />
          {isFinanced && (
            <LineRow
              label="Prepaid Interest"
              value={r.prepaidInterest}
              sub={`15 days @ ${(i.interestRate / 100 / 365 * r.loanAmount).toFixed(2)}/day`}
            />
          )}
          <LineRow
            label="Homeowner's Insurance Premium (12 months)"
            value={r.homeownersInsurance * 12}
            sub={`${fmt(r.homeownersInsurance)}/month`}
          />
          <SubTotal label="F. Total Prepaids" value={sectionF} />

          {/* H — Other */}
          <SecHeader label="H. Other" />
          <LineRow label="Owner's Title Insurance" value={r.titleInsuranceOwner} />
          {!isFinanced && <LineRow label="Settlement / Closing Fee" value={r.settlementFee} muted />}
          {i.brokerFee > 0 && <LineRow label="Broker / Admin Fee" value={i.brokerFee} />}
          {Number(i.otherCharges) > 0 && <LineRow label="Other Charges" value={Number(i.otherCharges)} />}
          <SubTotal label="H. Total Other" value={sectionH} />

          <BigTotal label="I. Total Other Costs  (E + F + H)" value={sectionI} />

          {/* J — Grand total */}
          <div className="flex justify-between items-center px-4 py-3.5 bg-gray-600 border-b border-gray-500">
            <span className="text-sm font-black text-white uppercase tracking-wide">
              {isFinanced ? 'J. Total Closing Costs  (D + I)' : 'J. Total Closing Costs'}
            </span>
            <span className="text-base font-black text-[#3EABA2] tabular-nums">{fmt(sectionJ)}</span>
          </div>
        </div>

        {/* Credits */}
        {totalCredits > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <SecHeader label="Credits" />
            {r.sellerCredit > 0 && <LineRow label="Seller Closing Cost Credit" value={`-${fmt(r.sellerCredit)}`} teal />}
            {Number(i.otherCredits) > 0 && <LineRow label="Other Credits" value={`-${fmt(Number(i.otherCredits))}`} teal />}
            <SubTotal label="Total Credits" value={totalCredits} />
          </div>
        )}

        {/* K / L Cash to Close Summary */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5 border-b border-gray-700">
            <span className="text-xs font-bold text-[#3EABA2] uppercase tracking-widest">Cash to Close Calculation</span>
          </div>

          <SecHeader label="K. Due from Borrower at Closing" />
          <LineRow label="Sale Price of Property" value={r.purchasePrice} />
          <LineRow label="Closing Costs (J)" value={sectionJ} />
          {totalCredits > 0 && <LineRow label="Credits" value={`-${fmt(totalCredits)}`} teal />}
          <SubTotal label="K. Total Due from Borrower" value={r.purchasePrice + sectionJ - totalCredits} />

          <SecHeader label="L. Paid Already by / for Borrower" />
          {isFinanced && <LineRow label="Loan Amount" value={fmt(r.loanAmount)} teal />}
          <SubTotal label="L. Total Paid by/for Borrower" value={isFinanced ? r.loanAmount : 0} />
        </div>

        {/* Cash to Close callout */}
        <div className="rounded-xl border-2 border-[#3EABA2] bg-[#3EABA2]/10 px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">Estimated</div>
              <div className="text-2xl font-black text-white mt-0.5">Cash to Close</div>
              <div className="text-xs text-gray-400 mt-1">
                {isFinanced ? 'Down payment + closing costs − credits' : 'Purchase price + closing costs − credits'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-[#3EABA2] tabular-nums">{fmt(r.cashToClose)}</div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 text-center pb-6">
          This estimate is provided for informational purposes only and does not constitute a commitment to lend.
          Actual closing costs may vary based on lender, property, and final transaction terms.
          &copy; Federal Title &amp; Escrow Company
        </p>
      </div>
    </div>
  );
}

// ── Seller Net Proceeds Disclosure ───────────────────────────────────────────

function SellerCD({ inputs: i, results: r, onBack }: { inputs: SellerInputs; results: SellerResults; onBack: () => void }) {
  const settlementDate = new Date(i.settlementDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const mortgageItems: { label: string; value: number }[] = [];
  if (i.numMortgages >= 1 && i.mortgagePayoff > 0) mortgageItems.push({ label: '1st Mortgage Payoff', value: i.mortgagePayoff });
  if (i.numMortgages >= 2 && i.mortgagePayoff2 > 0) mortgageItems.push({ label: '2nd Mortgage Payoff', value: i.mortgagePayoff2 });
  if (i.numMortgages >= 3 && i.mortgagePayoff3 > 0) mortgageItems.push({ label: '3rd Mortgage Payoff', value: i.mortgagePayoff3 });
  if (i.numMortgages >= 4 && i.mortgagePayoff4 > 0) mortgageItems.push({ label: '4th Mortgage Payoff', value: i.mortgagePayoff4 });
  if (i.numMortgages >= 5 && i.mortgagePayoff5 > 0) mortgageItems.push({ label: '5th Mortgage Payoff', value: i.mortgagePayoff5 });
  const totalMortgagePayoff = mortgageItems.reduce((s, m) => s + m.value, 0);

  const termiteTreatment = i.termiteTreatment || 0;
  const homeWarranty = i.homeWarranty || 0;

  const handleDownload = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('CLOSE IT!™ — Seller Net Proceeds Estimate', 10, 18);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Federal Title & Escrow Company  |  202.362.1500  |  services@federaltitle.com', 10, 25);
    doc.setLineWidth(0.4); doc.line(10, 28, 200, 28);

    let y = 35;
    const row = (lbl: string, val: string, bold = false) => {
      if (bold) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal');
      doc.text(lbl, 12, y); doc.text(val, 200, y, { align: 'right' });
      y += 5.5; if (y > 265) { doc.addPage(); y = 15; }
    };
    const sec = (title: string) => {
      doc.setFillColor(50, 50, 50); doc.rect(10, y - 4, 190, 7, 'F');
      doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(title.toUpperCase(), 12, y); doc.setTextColor(0);
      doc.setFont('helvetica', 'normal'); y += 7;
    };

    sec('Closing Information');
    row('Settlement Date', settlementDate); row('State / County', `${i.locationState} — ${i.locationCounty}`);
    row('Property Type', i.propertyType);
    row('Annual Property Tax (est.)', fmt(r.annualPropertyTax));
    sec('Transaction');
    row('Contract Sales Price', fmt(r.salesPrice));
    row(`Real Estate Commission (${i.commission}%)`, fmt(r.commission));
    if (r.adminFee) row('Admin / Flat Fee', fmt(r.adminFee));
    if (mortgageItems.length) {
      sec('Mortgage Payoffs');
      mortgageItems.forEach(m => row(m.label, fmt(m.value)));
      row('Total Mortgage Payoff', fmt(totalMortgagePayoff), true);
    }
    sec('Settlement Charges');
    row('Seller Settlement Fee', fmt(r.settlementFee));
    row('Water Escrow', fmt(r.waterEscrow));
    if (r.mortgageReleaseFee) row(`Mortgage Release Fee (${i.numMortgages} × $185)`, fmt(r.mortgageReleaseFee));
    sec('Transfer Taxes');
    row('State Recordation Tax (seller\'s 50%)', fmt(r.recordationTax));
    row('State / County Transfer Tax (seller\'s 50%)', fmt(r.transferTax));
    sec('Prorated Taxes');
    row(`Property Taxes Prorated to ${settlementDate}`, fmt(r.proratedTaxes));
    sec('Other Charges');
    if (r.sellerCredit) row('Closing Cost Credit to Buyer', fmt(r.sellerCredit));
    if (Number(r.otherCharges)) row('Other Charges', fmt(Number(r.otherCharges)));
    if (termiteTreatment) row('Termite Treatment', fmt(termiteTreatment));
    if (homeWarranty) row('Home Warranty', fmt(homeWarranty));
    row('Total Deductions', fmt(r.totalDeductions), true);
    y += 4;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('ESTIMATED NET PROCEEDS TO SELLER', 12, y);
    doc.text(fmt(r.cashToSeller), 200, y, { align: 'right' });
    y += 8;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(120);
    doc.text('This estimate is for informational purposes only. Actual amounts may vary. © Federal Title & Escrow Company', 10, y);
    doc.save('closeit-seller-disclosure.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <TopBar onBack={onBack} onPrint={() => window.print()} onDownload={handleDownload} />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <PageTitle sub="Seller Net Proceeds Estimate" />

        {/* 2-column info header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard title="Closing Information">
            <InfoRow label="Settlement Date" value={settlementDate} accent />
            <InfoRow label="State" value={i.locationState} />
            <InfoRow label="County" value={i.locationCounty} />
            <InfoRow label="Property Type" value={i.propertyType} />
            <InfoRow label="Annual Property Tax (est.)" value={fmt(r.annualPropertyTax)} />
          </InfoCard>
          <InfoCard title="Transaction Information">
            <InfoRow label="Contract Sales Price" value={fmt(r.salesPrice)} accent />
            <InfoRow label={`Commission (${i.commission}%)`} value={fmt(r.commission)} />
            <InfoRow label="Transfer/Recordation Taxes" value="Customary Split — 50/50" />
          </InfoCard>
        </div>

        {/* Charges & Deductions */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5 border-b border-gray-700">
            <span className="text-sm font-bold text-white uppercase tracking-wide">Charges &amp; Deductions</span>
          </div>

          {/* Mortgage Payoffs */}
          {mortgageItems.length > 0 && (
            <>
              <SecHeader label="Mortgage Payoffs" />
              {mortgageItems.map(m => <LineRow key={m.label} label={m.label} value={m.value} />)}
              <SubTotal label="Total Mortgage Payoff" value={totalMortgagePayoff} />
            </>
          )}

          {/* Commission */}
          <SecHeader label="Real Estate Commission" />
          <LineRow label={`Commission (${i.commission}%)`} value={r.commission} />
          {r.adminFee > 0 && <LineRow label="Admin / Flat Fee" value={r.adminFee} />}
          <SubTotal label="Total Commission" value={r.commission + r.adminFee} />

          {/* Settlement Charges */}
          <SecHeader label="Settlement Charges" />
          <LineRow label="Seller Settlement Fee" value={r.settlementFee} />
          <LineRow label="Water Escrow" value={r.waterEscrow} />
          {r.mortgageReleaseFee > 0 && (
            <LineRow label={`Mortgage Release Fee (${i.numMortgages} × $185)`} value={r.mortgageReleaseFee} />
          )}
          <SubTotal label="Total Settlement Charges" value={r.settlementFee + r.waterEscrow + r.mortgageReleaseFee} />

          {/* Transfer Taxes */}
          <SecHeader label="Transfer Taxes  (Seller's 50%)" />
          <LineRow label="State Recordation Tax" value={r.recordationTax} />
          <LineRow label="State / County Transfer Tax" value={r.transferTax} />
          <SubTotal label="Total Transfer Taxes" value={r.recordationTax + r.transferTax} />

          {/* Prorated Taxes */}
          <SecHeader label="Prorated Property Taxes" />
          <LineRow
            label={`Property Taxes Prorated to ${settlementDate}`}
            value={r.proratedTaxes}
            sub={`Based on estimated annual tax of ${fmt(r.annualPropertyTax)}`}
          />
          <SubTotal label="Total Prorated Taxes" value={r.proratedTaxes} />

          {/* Other Charges */}
          {(r.sellerCredit > 0 || Number(r.otherCharges) > 0 || termiteTreatment > 0 || homeWarranty > 0) && (
            <>
              <SecHeader label="Other Charges" />
              {r.sellerCredit > 0 && <LineRow label="Closing Cost Credit to Buyer" value={r.sellerCredit} />}
              {Number(r.otherCharges) > 0 && <LineRow label="Other Charges" value={Number(r.otherCharges)} />}
              {termiteTreatment > 0 && <LineRow label="Termite Treatment" value={termiteTreatment} />}
              {homeWarranty > 0 && <LineRow label="Home Warranty" value={homeWarranty} />}
              <SubTotal label="Total Other Charges" value={r.sellerCredit + Number(r.otherCharges) + termiteTreatment + homeWarranty} />
            </>
          )}

          {/* Grand Total */}
          <div className="flex justify-between items-center px-4 py-3.5 bg-gray-600 border-t border-gray-500">
            <span className="text-sm font-black text-white uppercase tracking-wide">Total Charges &amp; Deductions</span>
            <span className="text-base font-black text-[#E05C5C] tabular-nums">{fmt(r.totalDeductions)}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5 border-b border-gray-700">
            <span className="text-xs font-bold text-[#3EABA2] uppercase tracking-widest">Summary</span>
          </div>
          <LineRow label="Contract Sales Price" value={fmt(r.salesPrice)} teal />
          <LineRow label="Total Charges &amp; Deductions" value={`−${fmt(r.totalDeductions)}`} />
        </div>

        {/* Net Proceeds callout */}
        <div className={`rounded-xl border-2 px-6 py-5 ${r.cashToSeller >= 0 ? 'border-[#3EABA2] bg-[#3EABA2]/10' : 'border-red-500 bg-red-900/20'}`}>
          <div className="flex justify-between items-center">
            <div>
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${r.cashToSeller >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                Estimated
              </div>
              <div className="text-2xl font-black text-white mt-0.5">Net Proceeds to Seller</div>
              <div className="text-xs text-gray-400 mt-1">Sales price minus all charges</div>
            </div>
            <div className={`text-4xl font-black tabular-nums ${r.cashToSeller >= 0 ? 'text-[#3EABA2]' : 'text-red-400'}`}>
              {fmt(r.cashToSeller)}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 text-center pb-6">
          This estimate is provided for informational purposes only. Actual closing costs may vary.
          &copy; Federal Title &amp; Escrow Company
        </p>
      </div>
    </div>
  );
}
