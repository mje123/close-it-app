import { useState, useEffect, useCallback } from 'react';
import { MapPin, RefreshCw, Mail, HelpCircle, Save, Printer, PlusCircle } from 'lucide-react';
import { Tooltip } from '../shared/Tooltip';
import { ClosingDisclosure } from '../pdf/ClosingDisclosure';
import type { BuyerInputs, BuyerResults } from '../../utils/calculations';
import { calculateBuyer, DEFAULT_BUYER_INPUTS, fmt } from '../../utils/calculations';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

const STATES = [
  { code: 'DC', name: 'District of Columbia' },
  { code: 'MD', name: 'Maryland' },
  { code: 'VA', name: 'Virginia' },
];

const COUNTIES: Record<string, string[]> = {
  DC: ['Washington DC'],
  MD: ['Montgomery', 'Prince Georges', 'Howard', 'Anne Arundel', 'Baltimore City', 'Frederick'],
  VA: ['Arlington', 'Alexandria City', 'Fairfax', 'Loudoun', 'Prince William', 'Fauquier'],
};

type LoanType = 'conventional' | 'fha' | 'va' | 'cash';

export function BuyerCalculator() {
  const [inputs, setInputs] = useState<BuyerInputs>({ ...DEFAULT_BUYER_INPUTS });
  const [results, setResults] = useState<BuyerResults>(() => calculateBuyer(inputs));
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const { user } = useAuthStore();
  const counties = COUNTIES[inputs.locationState] || [];

  useEffect(() => {
    setResults(calculateBuyer(inputs));
  }, [inputs]);

  const set = useCallback((patch: Partial<BuyerInputs>) => {
    setInputs(prev => ({ ...prev, ...patch }));
  }, []);

  const handlePriceChange = (v: number) => {
    const dp = Math.round(v * (inputs.downPaymentPct / 100));
    set({ purchasePrice: v, downPayment: dp });
  };

  const _handleDPPct = (pct: number) => {
    const dp = Math.round(inputs.purchasePrice * (pct / 100));
    set({ downPaymentPct: pct, downPayment: dp });
  };

  const handleDPAmt = (amt: number) => {
    const pct = inputs.purchasePrice > 0 ? (amt / inputs.purchasePrice) * 100 : 0;
    set({ downPayment: amt, downPaymentPct: Math.round(pct * 10) / 10 });
  };

  const handleStateChange = (state: string) => {
    set({ locationState: state, locationCounty: COUNTIES[state]?.[0] || '' });
  };

  const handleReset = () => setInputs({ ...DEFAULT_BUYER_INPUTS });

  const handleSave = async () => {
    if (!user) { setSaveMsg('Please log in to save'); return; }
    if (!results) return;
    try {
      await axios.post('/api/calculations/save', { calcType: 'buyer', inputs, results });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch { setSaveMsg('Save failed'); }
  };

  if (showDisclosure) {
    return <ClosingDisclosure type="buyer" inputs={inputs} results={results} onBack={() => setShowDisclosure(false)} />;
  }

  const loanAmount = inputs.loanType === 'cash' ? 0 : Math.max(0, inputs.purchasePrice - inputs.downPayment);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Summary bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">Cash to Close</p>
            <p className="text-[#3EABA2] text-5xl font-black mt-0.5">
              {results ? fmt(results.cashToClose) : '$0.00'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">Monthly Payments</p>
            <p className="text-[#3EABA2] text-4xl font-black mt-0.5">
              {results ? fmt(results.totalMonthlyPayment) : '$0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Price + Location inputs */}
      <div className="bg-gray-900 px-6 py-4 border-b border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Enter Purchase Price"
            value={inputs.purchasePrice > 0 ? inputs.purchasePrice.toLocaleString() : ''}
            onChange={e => {
              const v = Number(e.target.value.replace(/[^0-9]/g, ''));
              if (!isNaN(v)) handlePriceChange(v);
            }}
            className="flex-1 min-w-[200px] bg-transparent border border-[#3EABA2]/50 hover:border-[#3EABA2] focus:border-[#3EABA2] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-lg focus:outline-none focus:ring-1 focus:ring-[#3EABA2]/30 transition-colors"
            aria-label="Purchase price"
          />
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-500 shrink-0" />
            <div className="flex gap-0">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">State</span>
                <select
                  value={inputs.locationState}
                  onChange={e => handleStateChange(e.target.value)}
                  className="bg-gray-800 border border-gray-700 pl-12 pr-8 py-2.5 text-sm text-white rounded-l-lg focus:outline-none focus:border-[#3EABA2] cursor-pointer appearance-none"
                >
                  {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">County</span>
                <select
                  value={inputs.locationCounty}
                  onChange={e => set({ locationCounty: e.target.value })}
                  className="bg-gray-800 border border-l-0 border-gray-700 pl-16 pr-8 py-2.5 text-sm text-white rounded-r-lg focus:outline-none focus:border-[#3EABA2] cursor-pointer appearance-none"
                >
                  {counties.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fine tune header */}
      <div className="bg-gray-950 px-6 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div>
            <span className="text-[#3EABA2] font-bold text-base">Fine tune your results</span>
            <span className="ml-3 text-xs text-[#E74C3C] uppercase tracking-wide font-medium">RED</span>
            <span className="ml-1 text-xs text-gray-500">items below are editable</span>
          </div>
          <button
            onClick={handleReset}
            className="bg-[#E74C3C] hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded uppercase tracking-wide transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={11} /> RESET
          </button>
        </div>
      </div>

      {/* Sliders section */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Price + Down Payment */}
            <div className="space-y-5">
              <SliderBlock
                label="Purchase Price"
                value={inputs.purchasePrice}
                min={0}
                max={3000000}
                step={5000}
                display={fmt(inputs.purchasePrice)}
                onChange={handlePriceChange}
              />
              <SliderBlock
                label={`Down Payment  ${inputs.purchasePrice > 0 ? `${inputs.downPaymentPct.toFixed(1)}%` : ''}`}
                value={inputs.downPayment}
                min={0}
                max={inputs.purchasePrice || 1000000}
                step={1000}
                display={`${fmt(inputs.downPayment)} (${inputs.downPaymentPct.toFixed(1)}%)`}
                onChange={handleDPAmt}
                editable
              />
            </div>

            {/* Right: Loan Type + Interest Rate */}
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Loan Type</p>
                <div className="grid grid-cols-4 gap-1">
                  {(['conventional', 'fha', 'va', 'cash'] as LoanType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set({ loanType: t })}
                      className={`py-2 rounded text-xs font-bold uppercase tracking-wide transition-all ${
                        inputs.loanType === t
                          ? 'bg-[#3EABA2] text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {t === 'cash' ? 'Cash/No Loan' : t}
                    </button>
                  ))}
                </div>
              </div>

              {inputs.loanType !== 'cash' && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                        Loan Amount
                        <span className="text-xs text-gray-500 ml-2 normal-case">
                          ({inputs.purchasePrice > 0 ? ((loanAmount / inputs.purchasePrice) * 100).toFixed(1) : 0}%)
                        </span>
                      </p>
                      <span className="text-[#E74C3C] font-bold">{fmt(loanAmount)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1">
                        Interest Rate (%)
                        <Tooltip text="Annual percentage rate for your mortgage loan" />
                      </p>
                      <span className="text-[#E74C3C] font-bold text-sm">{inputs.interestRate.toFixed(3)}%</span>
                    </div>
                    <DarkSlider
                      value={inputs.interestRate}
                      min={1} max={15} step={0.125}
                      onChange={v => set({ interestRate: v })}
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>1%</span><span>15%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable rows */}
      <div className="max-w-5xl mx-auto px-6 pb-6 mt-2 space-y-0.5">
        <ExpandRow
          label="Estimated Date of Closing"
          value={new Date(inputs.closingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          valueClass="text-white"
        >
          <input
            type="date"
            value={inputs.closingDate}
            onChange={e => set({ closingDate: e.target.value })}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#3EABA2]"
          />
        </ExpandRow>

        <ExpandRow label="Loan Term" value={`${inputs.loanTerm}-year fixed`} valueClass="text-[#E74C3C]">
          <div className="flex gap-2">
            {[10, 15, 20, 30].map(t => (
              <button key={t} type="button" onClick={() => set({ loanTerm: t })}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${inputs.loanTerm === t ? 'bg-[#3EABA2] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >{t} yr</button>
            ))}
          </div>
        </ExpandRow>

        <ExpandRow label="Property Type" value={inputs.propertyType} valueClass="text-[#E74C3C]">
          <select value={inputs.propertyType} onChange={e => set({ propertyType: e.target.value })}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#3EABA2] w-64">
            <option>Single Family Home</option>
            <option>Condo</option>
            <option>Townhouse</option>
            <option>Multi-Family</option>
            <option>Co-op</option>
          </select>
        </ExpandRow>

        <ExpandRow label="Property Use" value={inputs.propertyUse} valueClass="text-[#E74C3C]">
          <select value={inputs.propertyUse} onChange={e => set({ propertyUse: e.target.value })}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#3EABA2] w-64">
            <option>Primary Residence</option>
            <option>Investment Property</option>
            <option>Second Home</option>
          </select>
        </ExpandRow>

        <ExpandRow label="Seller Type" value={inputs.sellerType} valueClass="text-[#E74C3C]">
          <select value={inputs.sellerType} onChange={e => set({ sellerType: e.target.value })}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#3EABA2] w-72">
            <option>Individual Owner(s)/Non/Short Sale</option>
            <option>Bank/REO/Foreclosure</option>
            <option>New Construction/Builder</option>
            <option>Estate Sale</option>
          </select>
        </ExpandRow>

        {/* Maryland 1st Time Homebuyer — shown before Broker Fee, Primary Residence only */}
        {inputs.locationState === 'MD' && inputs.propertyUse === 'Primary Residence' && (
          <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
            <span className="text-sm text-gray-300 flex items-center gap-1.5 flex-wrap">
              Maryland 1st Time Homebuyer
              <a href="https://www.federaltitle.com/what-s-the-benefit-of-the-maryland-first-time-homebuyer-tax-credit/" target="_blank" rel="noopener noreferrer" className="text-[#E74C3C] hover:underline text-xs">*See Qualification Requirements</a>
            </span>
            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mdFirstTime" checked={inputs.marylandFirstTimeBuyer} onChange={() => set({ marylandFirstTimeBuyer: true })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mdFirstTime" checked={!inputs.marylandFirstTimeBuyer} onChange={() => set({ marylandFirstTimeBuyer: false })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">No</span>
              </label>
            </div>
          </div>
        )}

        <ExpandRow
          label={<span className="flex items-center gap-1">Broker Flat Fee / Admin Fee <Tooltip text="Any flat fee or administrative fee charged by your real estate broker" /></span>}
          value={fmt(inputs.brokerFee)}
        >
          <OrangeInput value={inputs.brokerFee} onChange={v => set({ brokerFee: v })} />
        </ExpandRow>

        <ExpandRow
          label={<span className="flex items-center gap-1">Monthly Home Owner's Assoc. (HOA) Dues <Tooltip text="Monthly Homeowner Association dues if applicable" /></span>}
          value={fmt(inputs.hoa)}
        >
          <OrangeInput value={inputs.hoa} onChange={v => set({ hoa: v })} />
        </ExpandRow>

        <ExpandRow
          label={<span className="flex items-center gap-1">Seller Credit <Tooltip text="Amount the seller has agreed to contribute toward your closing costs" /></span>}
          value={fmt(Number(inputs.sellerCredit) || 0)}
        >
          <OrangeInput value={inputs.sellerCredit} onChange={v => set({ sellerCredit: v })} />
        </ExpandRow>

        <ExpandRow label={<span className="flex items-center gap-1 text-gray-400 italic">Other Credits <Tooltip text="Any additional credits applied to closing costs" /></span>} value={fmt(Number(inputs.otherCredits) || 0)}>
          <div className="flex items-center gap-2">
            <input placeholder="Other Credits" value={inputs.otherCredits}
              onChange={e => set({ otherCredits: e.target.value })}
              className="bg-transparent border border-[#E86742] text-white rounded px-2 py-1 text-sm w-28 focus:outline-none focus:border-[#3EABA2] placeholder-gray-600"
            />
            <Tooltip text="Other credits applied to your closing costs" />
          </div>
        </ExpandRow>

        <ExpandRow label={<span className="flex items-center gap-1 text-gray-400 italic">Other Charges <Tooltip text="Any additional charges" /></span>} value={fmt(Number(inputs.otherCharges) || 0)}>
          <div className="flex items-center gap-2">
            <input placeholder="Other Charges" value={inputs.otherCharges}
              onChange={e => set({ otherCharges: e.target.value })}
              className="bg-transparent border border-[#E86742] text-white rounded px-2 py-1 text-sm w-28 focus:outline-none focus:border-[#3EABA2] placeholder-gray-600"
            />
            <Tooltip text="Any additional charges" />
          </div>
        </ExpandRow>

        {/* DC Homestead Deduction — Primary Residence + price ≤ $647k */}
        {inputs.locationState === 'DC' && inputs.propertyUse === 'Primary Residence' && inputs.purchasePrice <= 647000 && (
          <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
            <span className="text-sm text-gray-300 flex items-center gap-1.5 flex-wrap">
              Do you qualify for the DC Homestead Deduction?
              <a href="https://www.federaltitle.com/how-to-qualify-for-dc-homestead-deduction/" target="_blank" rel="noopener noreferrer" className="text-[#E74C3C] hover:underline text-xs">See qualification requirements*</a>
            </span>
            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="homestead" checked={inputs.dcHomesteadDeduction} onChange={() => set({ dcHomesteadDeduction: true })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="homestead" checked={!inputs.dcHomesteadDeduction} onChange={() => set({ dcHomesteadDeduction: false, dcFirstTimeBuyer: false })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">No</span>
              </label>
            </div>
          </div>
        )}

        {/* DC First-Time Homebuyer Recordation Tax Reduction — only when Homestead = Yes */}
        {inputs.locationState === 'DC' && inputs.dcHomesteadDeduction && inputs.purchasePrice <= 647000 && (
          <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
            <span className="text-sm text-gray-300 flex items-center gap-1.5 flex-wrap">
              Do you qualify for the DC First-Time Homebuyer Recordation Tax Reduction?
              <a href="https://www.federaltitle.com/dc-first-time-homebuyers-recordation-tax-reduction/" target="_blank" rel="noopener noreferrer" className="text-[#E74C3C] hover:underline text-xs">See qualification requirements*</a>
            </span>
            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="dcFirstTime" checked={inputs.dcFirstTimeBuyer} onChange={() => set({ dcFirstTimeBuyer: true })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="dcFirstTime" checked={!inputs.dcFirstTimeBuyer} onChange={() => set({ dcFirstTimeBuyer: false })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">No</span>
              </label>
            </div>
          </div>
        )}

        {/* VA Disability Rating — shown when loan type is VA */}
        {inputs.loanType === 'va' && (
          <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
            <span className="text-sm text-gray-300">Does the borrower have a disability rating?</span>
            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="vaDisability" checked={inputs.vaDisabilityRating} onChange={() => set({ vaDisabilityRating: true, vaFirstTimeCOE: false })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="vaDisability" checked={!inputs.vaDisabilityRating} onChange={() => set({ vaDisabilityRating: false })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">No</span>
              </label>
            </div>
          </div>
        )}

        {/* VA First-Time COE — shown when VA + no disability rating */}
        {inputs.loanType === 'va' && !inputs.vaDisabilityRating && (
          <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
            <span className="text-sm text-gray-300">Are you a first-time user of your VA Certificate of Eligibility?</span>
            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="vaCOE" checked={inputs.vaFirstTimeCOE} onChange={() => set({ vaFirstTimeCOE: true })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="vaCOE" checked={!inputs.vaFirstTimeCOE} onChange={() => set({ vaFirstTimeCOE: false })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">No</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="max-w-5xl mx-auto px-6 pb-2 flex flex-wrap gap-2 no-print">
        <ActionBtn icon={<Mail size={13} />} label="E-mail it!" color="teal" onClick={() => {}} />
        <ActionBtn icon={<HelpCircle size={13} />} label="Ask it!" color="red" onClick={() => {}} />
        <ActionBtn icon={<Save size={13} />} label="Save it!" color="orange" onClick={handleSave} />
        <ActionBtn icon={<Printer size={13} />} label="Print it!" color="teal" onClick={() => window.print()} />
        {saveMsg && <span className="text-sm text-green-400 self-center ml-2">{saveMsg}</span>}
      </div>

      {/* View Closing Disclosure */}
      <div className="max-w-5xl mx-auto px-6 pb-10 text-center">
        <button
          onClick={() => setShowDisclosure(true)}
          className="bg-[#3EABA2] hover:bg-[#349990] text-white font-bold px-10 py-3 rounded-lg text-sm tracking-wide uppercase transition-colors"
        >
          View Closing Disclosure
        </button>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SliderBlock({ label, value, min, max, step, display, onChange, editable }: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void; editable?: boolean;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className={`text-xs uppercase tracking-wide font-medium ${editable ? 'text-[#E74C3C]' : 'text-gray-400'}`}>{label}</p>
        <span className="text-sm font-bold text-white">{display}</span>
      </div>
      <DarkSlider value={value} min={min} max={max} step={step} onChange={onChange} pctOverride={pct} />
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{fmt(min)}</span><span>{fmt(max)}</span>
      </div>
    </div>
  );
}

function DarkSlider({ value, min, max, step, onChange, pctOverride }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void; pctOverride?: number;
}) {
  const pct = pctOverride ?? (max > min ? ((value - min) / (max - min)) * 100 : 0);
  return (
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, #3EABA2 ${pct}%, #374151 ${pct}%)`
      }}
    />
  );
}

function ExpandRow({ label, value, valueClass, children }: {
  label: React.ReactNode; value?: string; valueClass?: string; children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden mb-0.5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <PlusCircle size={18} className={`shrink-0 transition-transform ${open ? 'text-[#3EABA2] rotate-45' : 'text-blue-400'}`} />
          <span className="text-sm text-gray-200 text-left">{label}</span>
        </div>
        {value !== undefined && (
          <span className={`text-sm font-medium ml-4 shrink-0 ${valueClass || 'text-[#E74C3C]'}`}>{value}</span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 bg-gray-800/40 border-t border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}

function OrangeInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value > 0 ? value.toLocaleString() : ''}
        placeholder="$0"
        onChange={e => {
          const v = Number(e.target.value.replace(/[^0-9]/g, ''));
          if (!isNaN(v)) onChange(v);
        }}
        className="bg-transparent border border-[#E86742] text-[#E86742] rounded px-2 py-1 text-sm w-28 focus:outline-none focus:border-[#3EABA2] focus:text-white placeholder-[#E86742]/50"
      />
      <button type="button" onClick={() => onChange(0)} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
    </div>
  );
}

function ActionBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: 'teal' | 'red' | 'orange'; onClick: () => void }) {
  const colors = { teal: 'bg-[#3EABA2] hover:bg-[#349990]', red: 'bg-[#E74C3C] hover:bg-red-600', orange: 'bg-[#E86742] hover:bg-orange-600' };
  return (
    <button onClick={onClick} className={`${colors[color]} text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 uppercase tracking-wide transition-colors`}>
      {icon} {label}
    </button>
  );
}
