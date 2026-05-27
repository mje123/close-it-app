import { useState, useEffect, useCallback } from 'react';
import { MapPin, RefreshCw, Mail, HelpCircle, Save, Printer, PlusCircle } from 'lucide-react';
import { Tooltip } from '../shared/Tooltip';
import { ClosingDisclosure } from '../pdf/ClosingDisclosure';
import type { SellerInputs, SellerResults } from '../../utils/calculations';
import { calculateSeller, DEFAULT_SELLER_INPUTS, fmt } from '../../utils/calculations';
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

export function SellerCalculator() {
  const [inputs, setInputs] = useState<SellerInputs>({ ...DEFAULT_SELLER_INPUTS });
  const [results, setResults] = useState<SellerResults>(() => calculateSeller(inputs));
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const { user } = useAuthStore();
  const counties = COUNTIES[inputs.locationState] || [];

  useEffect(() => {
    setResults(calculateSeller(inputs));
  }, [inputs]);

  const set = useCallback((patch: Partial<SellerInputs>) => {
    setInputs(prev => ({ ...prev, ...patch }));
  }, []);

  const handleStateChange = (state: string) => {
    set({ locationState: state, locationCounty: COUNTIES[state]?.[0] || '' });
  };

  const handleReset = () => setInputs({ ...DEFAULT_SELLER_INPUTS });

  const handleSave = async () => {
    if (!user) { setSaveMsg('Please log in to save'); return; }
    if (!results) return;
    try {
      await axios.post('/api/calculations/save', { calcType: 'seller', inputs, results });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch { setSaveMsg('Save failed'); }
  };

  if (showDisclosure) {
    return <ClosingDisclosure type="seller" inputs={inputs} results={results} onBack={() => setShowDisclosure(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Summary bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">Cash to Seller</p>
            <p className={`text-5xl font-black mt-0.5 ${results && results.cashToSeller >= 0 ? 'text-[#3EABA2]' : 'text-[#E74C3C]'}`}>
              {results ? fmt(results.cashToSeller) : '$0.00'}
            </p>
          </div>
          {results && (
            <div className="text-right">
              <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">Total Deductions</p>
              <p className="text-[#E74C3C] text-3xl font-black mt-0.5">{fmt(results.totalDeductions)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Price + Location */}
      <div className="bg-gray-900 px-6 py-4 border-b border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Enter Sales Price"
            value={inputs.salesPrice > 0 ? inputs.salesPrice.toLocaleString() : ''}
            onChange={e => {
              const v = Number(e.target.value.replace(/[^0-9]/g, ''));
              if (!isNaN(v)) set({ salesPrice: v });
            }}
            className="flex-1 min-w-[200px] bg-transparent border border-[#3EABA2]/50 hover:border-[#3EABA2] focus:border-[#3EABA2] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-lg focus:outline-none focus:ring-1 focus:ring-[#3EABA2]/30 transition-colors"
            aria-label="Sales price"
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

      {/* Sales Price Slider */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Sales Price</p>
              <span className="text-sm font-bold text-white">{fmt(inputs.salesPrice)}</span>
            </div>
            <SellSlider
              value={inputs.salesPrice} min={0} max={5000000} step={5000}
              onChange={v => set({ salesPrice: v })}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>$0</span><span>$5,000,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable rows */}
      <div className="max-w-5xl mx-auto px-6 pb-6 mt-2 space-y-0.5">
        <ExpandRow
          label="Settlement Date"
          value={new Date(inputs.settlementDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          valueClass="text-white"
        >
          <input
            type="date" value={inputs.settlementDate}
            onChange={e => set({ settlementDate: e.target.value })}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#3EABA2]"
          />
        </ExpandRow>

        <ExpandRow label="Property Type" value={inputs.propertyType} valueClass="text-[#E74C3C]">
          <select value={inputs.propertyType} onChange={e => set({ propertyType: e.target.value })}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#3EABA2] w-64">
            <option>Single Family Home</option>
            <option>Condo</option>
            <option>Townhouse</option>
            <option>Multi-Family</option>
          </select>
        </ExpandRow>

        <ExpandRow
          label={<span className="flex items-center gap-1">Number of Mortgages/HELOCs being paid-off <Tooltip text="Enter the number of loans to be paid off including any Home Equity Lines of Credit." /></span>}
          value={inputs.numMortgages === 0 ? 'NONE / Free & Clear' : String(inputs.numMortgages)}
          valueClass="text-[#E74C3C]"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {['NONE', '1', '2', '3', '4', '5'].map((label, idx) => (
              <button key={idx} type="button" onClick={() => set({ numMortgages: idx })}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${inputs.numMortgages === idx ? 'bg-[#3EABA2] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >{label}</button>
            ))}
          </div>
        </ExpandRow>

        {inputs.numMortgages >= 1 && (
          <ExpandRow label={<span className="flex items-center gap-1">1st Mortgage Payoff Amount <Tooltip text="Total amount owed on your primary mortgage" /></span>} value={fmt(inputs.mortgagePayoff)}>
            <OrangeInput value={inputs.mortgagePayoff} onChange={v => set({ mortgagePayoff: v })} />
          </ExpandRow>
        )}
        {inputs.numMortgages >= 2 && (
          <ExpandRow label="2nd Mortgage Payoff Amount" value={fmt(inputs.mortgagePayoff2)}>
            <OrangeInput value={inputs.mortgagePayoff2} onChange={v => set({ mortgagePayoff2: v })} />
          </ExpandRow>
        )}
        {inputs.numMortgages >= 3 && (
          <ExpandRow label="3rd Mortgage Payoff Amount" value={fmt(inputs.mortgagePayoff3)}>
            <OrangeInput value={inputs.mortgagePayoff3} onChange={v => set({ mortgagePayoff3: v })} />
          </ExpandRow>
        )}
        {inputs.numMortgages >= 4 && (
          <ExpandRow label="4th Mortgage Payoff Amount" value={fmt(inputs.mortgagePayoff4)}>
            <OrangeInput value={inputs.mortgagePayoff4} onChange={v => set({ mortgagePayoff4: v })} />
          </ExpandRow>
        )}
        {inputs.numMortgages >= 5 && (
          <ExpandRow label="5th Mortgage Payoff Amount" value={fmt(inputs.mortgagePayoff5)}>
            <OrangeInput value={inputs.mortgagePayoff5} onChange={v => set({ mortgagePayoff5: v })} />
          </ExpandRow>
        )}

        <ExpandRow
          label={<span className="flex items-center gap-1">Seller Closing Cost Credit to Buyer / Seller Subsidy <Tooltip text="Amount you are agreeing to pay toward the buyer's closing costs" /></span>}
          value={fmt(inputs.sellerCredit)}
        >
          <OrangeInput value={inputs.sellerCredit} onChange={v => set({ sellerCredit: v })} />
        </ExpandRow>

        <ExpandRow
          label={<span className="flex items-center gap-1">Admin/Flat Fee / Additional Commission to Real Estate Company <Tooltip text="Any flat administrative or transaction fee charged by your agent's brokerage" /></span>}
          value={fmt(inputs.adminFee)}
        >
          <OrangeInput value={inputs.adminFee} onChange={v => set({ adminFee: v })} />
        </ExpandRow>

        <ExpandRow
          label={<span className="flex items-center gap-1">Commission to Real Estate Company (%) <Tooltip text="Total real estate commission percentage. Default is 6% split between buyer's and seller's agents." /></span>}
          value={`${inputs.commission}%`}
          valueClass="text-[#E74C3C]"
        >
          <div className="space-y-2">
            <SellSlider value={inputs.commission} min={0} max={10} step={0.25} onChange={v => set({ commission: v })} />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span className="text-gray-300">= {fmt(inputs.salesPrice * inputs.commission / 100)}</span>
              <span>10%</span>
            </div>
          </div>
        </ExpandRow>

        <ExpandRow
          label={<span className="flex items-center gap-1">Termite Treatment / Repair Costs <Tooltip text="Cost of required termite treatments or repairs agreed to in the contract" /></span>}
          value={fmt(inputs.termiteTreatment)}
        >
          <OrangeInput value={inputs.termiteTreatment} onChange={v => set({ termiteTreatment: v })} />
        </ExpandRow>

        <ExpandRow
          label={<span className="flex items-center gap-1">Home Warranty Provided to Buyer <Tooltip text="Cost of a home warranty policy you are providing to the buyer" /></span>}
          value={fmt(inputs.homeWarranty)}
        >
          <OrangeInput value={inputs.homeWarranty} onChange={v => set({ homeWarranty: v })} />
        </ExpandRow>

        <ExpandRow
          label={<span className="flex items-center gap-1">Monthly HOA / Condo Dues <Tooltip text="Any prorated homeowner or condo association dues owed at settlement" /></span>}
          value={fmt(inputs.monthlyHoa)}
        >
          <OrangeInput value={inputs.monthlyHoa} onChange={v => set({ monthlyHoa: v })} />
        </ExpandRow>

        {/* FIRPTA */}
        <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
          <span className="text-sm text-gray-300 flex items-center gap-1.5">
            Is the Seller Subject to FIRPTA Withholding?
            <Tooltip text="Foreign Investment in Real Property Tax Act — applies to non-US citizens/residents. Buyer must withhold 15% of sale price." />
          </span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="firpta" checked={inputs.firpta} onChange={() => set({ firpta: true })} className="accent-[#3EABA2]" />
              <span className="text-sm text-gray-300">Yes</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="firpta" checked={!inputs.firpta} onChange={() => set({ firpta: false })} className="accent-[#3EABA2]" />
              <span className="text-sm text-gray-300">No</span>
            </label>
          </div>
        </div>

        {/* Maryland seller questions */}
        {inputs.locationState === 'MD' && (
          <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
            <span className="text-sm text-gray-300 flex-1 pr-4">
              Seller(s) Is/Are Maryland Resident(s)?
              <span className="block text-xs text-[#E74C3C] mt-0.5">*If any one seller is NOT a Maryland resident, then answer "NO"</span>
            </span>
            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mdResident" checked={inputs.mdSellerResident} onChange={() => set({ mdSellerResident: true })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mdResident" checked={!inputs.mdSellerResident} onChange={() => set({ mdSellerResident: false, mdSellerOccupied: true })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">No</span>
              </label>
            </div>
          </div>
        )}
        {inputs.locationState === 'MD' && !inputs.mdSellerResident && (
          <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
            <span className="text-sm text-gray-300 flex-1 pr-4">Seller(s) Occupied Property as Principal Residence At Least 2 Of Previous 5 Years</span>
            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mdOccupied" checked={inputs.mdSellerOccupied} onChange={() => set({ mdSellerOccupied: true })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mdOccupied" checked={!inputs.mdSellerOccupied} onChange={() => set({ mdSellerOccupied: false })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">No</span>
              </label>
            </div>
          </div>
        )}
        {inputs.locationState === 'MD' && !inputs.mdSellerResident && !inputs.mdSellerOccupied && (
          <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800">
            <span className="text-sm text-gray-300 flex-1 pr-4">
              Property Owned By
              <Tooltip text="Properties owned and sold by entities may be subject to additional fees." />
            </span>
            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mdOwnership" checked={inputs.mdPropertyOwnership === 'individual'} onChange={() => set({ mdPropertyOwnership: 'individual' })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Individual/Estate/Trust</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mdOwnership" checked={inputs.mdPropertyOwnership === 'business'} onChange={() => set({ mdPropertyOwnership: 'business' })} className="accent-[#3EABA2]" />
                <span className="text-sm text-gray-300">Business Entity</span>
              </label>
            </div>
          </div>
        )}

        <ExpandRow label={<span className="flex items-center gap-1 text-gray-400 italic">Other Credits <Tooltip text="Any additional credits" /></span>} value={fmt(Number(inputs.otherCredits) || 0)}>
          <input placeholder="Other Credits" value={inputs.otherCredits}
            onChange={e => set({ otherCredits: e.target.value })}
            className="bg-transparent border border-[#E86742] text-white rounded px-2 py-1 text-sm w-28 focus:outline-none focus:border-[#3EABA2] placeholder-gray-600"
          />
        </ExpandRow>

        <ExpandRow label={<span className="flex items-center gap-1 text-gray-400 italic">Other Charges <Tooltip text="Any additional charges" /></span>} value={fmt(Number(inputs.otherCharges) || 0)}>
          <input placeholder="Other Charges" value={inputs.otherCharges}
            onChange={e => set({ otherCharges: e.target.value })}
            className="bg-transparent border border-[#E86742] text-white rounded px-2 py-1 text-sm w-28 focus:outline-none focus:border-[#3EABA2] placeholder-gray-600"
          />
        </ExpandRow>
      </div>

      {/* Action buttons */}
      <div className="max-w-5xl mx-auto px-6 pb-2 flex flex-wrap gap-2 no-print">
        <ActionBtn icon={<Mail size={13} />} label="E-mail it!" color="teal" onClick={() => {}} />
        <ActionBtn icon={<HelpCircle size={13} />} label="Ask it!" color="red" onClick={() => {}} />
        <ActionBtn icon={<Save size={13} />} label="Save it!" color="orange" onClick={handleSave} />
        <ActionBtn icon={<Printer size={13} />} label="Print it!" color="teal" onClick={() => window.print()} />
        {saveMsg && <span className="text-sm text-green-400 self-center ml-2">{saveMsg}</span>}
      </div>

      {/* View Summary */}
      <div className="max-w-5xl mx-auto px-6 pb-10 text-center">
        <button
          onClick={() => setShowDisclosure(true)}
          className="bg-[#3EABA2] hover:bg-[#349990] text-white font-bold px-10 py-3 rounded-lg text-sm tracking-wide uppercase transition-colors"
        >
          View Sell It! Summary
        </button>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SellSlider({ value, min, max, step, onChange }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{ background: `linear-gradient(to right, #3EABA2 ${pct}%, #374151 ${pct}%)` }}
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
