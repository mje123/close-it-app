import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Save, Printer, Home, RefreshCw, ChevronRight } from 'lucide-react';
import type { BuyerInputs, SellerInputs } from '../utils/calculations';
import {
  calculateBuyer, calculateSeller,
  DEFAULT_BUYER_INPUTS, DEFAULT_SELLER_INPUTS, fmt
} from '../utils/calculations';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

// ═══════════════════════════════════════════════════════════════
// Data
// ═══════════════════════════════════════════════════════════════

type Mode = 'buy' | 'sell';

type StepId =
  | 'mode' | 'state' | 'county' | 'price'
  | 'loan-type' | 'down-payment' | 'rate-term'
  | 'property-type' | 'property-use' | 'seller-type'
  | 'commission' | 'mortgages' | 'payoffs' | 'firpta'
  | 'dc-homestead' | 'dc-first-time' | 'md-buyer'
  | 'va-disability' | 'va-coe'
  | 'fine-tune' | 'results';

const ALL_STEPS: StepId[] = [
  'mode','state','county','price','loan-type','down-payment','rate-term',
  'property-type','property-use','seller-type',
  'commission','mortgages','payoffs','firpta',
  'dc-homestead','dc-first-time','md-buyer','va-disability','va-coe',
  'fine-tune','results',
];

const STATES = [
  { code:'DC', name:'Washington, D.C.', color:'from-blue-900/50 to-blue-800/20', flag:'🏛️' },
  { code:'MD', name:'Maryland',          color:'from-red-900/40 to-red-800/20',   flag:'🦀' },
  { code:'VA', name:'Virginia',          color:'from-indigo-900/40 to-indigo-800/20', flag:'🌿' },
];

const COUNTIES: Record<string, string[]> = {
  DC: ['Washington DC'],
  MD: ['Montgomery','Prince Georges','Howard','Anne Arundel','Baltimore City','Frederick'],
  VA: ['Arlington','Alexandria City','Fairfax','Loudoun','Prince William','Fauquier'],
};

const PROPERTY_TYPES = [
  { value:'Single Family Home', icon:'🏠', label:'Single Family', sub:'Stand-alone home' },
  { value:'Condo',              icon:'🏢', label:'Condo',         sub:'Shared building'  },
  { value:'Townhouse',          icon:'🏘️', label:'Townhouse',     sub:'Multi-floor unit' },
  { value:'Multi-Family',       icon:'🏗️', label:'Multi-Family',  sub:'2–4 unit property' },
  { value:'Co-op',              icon:'🤝', label:'Co-op',         sub:'Ownership shares'  },
];

const PROPERTY_USE = [
  { value:'Primary Residence', icon:'🏡', label:'Primary Home',    sub:'Where you\'ll live full-time' },
  { value:'Investment Property',icon:'💰', label:'Investment',      sub:'Rental or income property' },
  { value:'Second Home',        icon:'🌊', label:'Second Home',     sub:'Vacation or part-time home' },
];

const SELLER_TYPES = [
  { value:'Individual Owner(s)/Non/Short Sale', icon:'👤', label:'Individual Owner', sub:'Standard private sale' },
  { value:'Bank/REO/Foreclosure',               icon:'🏦', label:'Bank / REO',       sub:'Foreclosure or REO property' },
  { value:'New Construction/Builder',           icon:'🔨', label:'New Construction', sub:'Builder or developer' },
  { value:'Estate Sale',                        icon:'📋', label:'Estate Sale',       sub:'Probate or estate property' },
];

// ═══════════════════════════════════════════════════════════════
// Step Logic
// ═══════════════════════════════════════════════════════════════

function applicable(id: StepId, mode: Mode | null, b: BuyerInputs, s: SellerInputs): boolean {
  if (id === 'mode') return true;
  if (!mode) return false;
  const buy = mode === 'buy', sell = mode === 'sell';
  const bState = b.locationState, sState = s.locationState;
  switch (id) {
    case 'state':       return true;
    case 'county':      return (buy ? COUNTIES[bState] : COUNTIES[sState] || []).length > 1;
    case 'price':       return true;
    case 'loan-type':   return buy;
    case 'down-payment':return buy && b.loanType !== 'cash';
    case 'rate-term':   return buy && b.loanType !== 'cash';
    case 'property-type': return true;
    case 'property-use':  return buy;
    case 'seller-type':   return buy;
    case 'commission':    return sell;
    case 'mortgages':     return sell;
    case 'payoffs':       return sell && s.numMortgages > 0;
    case 'firpta':        return sell;
    case 'dc-homestead':  return buy && bState === 'DC' && b.propertyUse === 'Primary Residence';
    case 'dc-first-time': return buy && bState === 'DC' && b.dcHomesteadDeduction;
    case 'md-buyer':      return buy && bState === 'MD' && b.propertyUse === 'Primary Residence';
    case 'va-disability': return buy && b.loanType === 'va';
    case 'va-coe':        return buy && b.loanType === 'va' && !b.vaDisabilityRating;
    case 'fine-tune':   return true;
    case 'results':     return true;
    default: return false;
  }
}

function getApplicable(mode: Mode | null, b: BuyerInputs, s: SellerInputs): StepId[] {
  return ALL_STEPS.filter(id => applicable(id, mode, b, s));
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export function QuizPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [mode, setMode]       = useState<Mode | null>(null);
  const [stepId, setStepId]   = useState<StepId>('mode');
  const [dir, setDir]         = useState<'fwd' | 'bck'>('fwd');
  const [animKey, setAnimKey] = useState(0);
  const [b, setB_]            = useState<BuyerInputs>({ ...DEFAULT_BUYER_INPUTS });
  const [s, setS_]            = useState<SellerInputs>({ ...DEFAULT_SELLER_INPUTS });
  const [saveMsg, setSaveMsg] = useState('');

  const setB = useCallback((p: Partial<BuyerInputs>) => setB_(prev => ({ ...prev, ...p })), []);
  const setS = useCallback((p: Partial<SellerInputs>) => setS_(prev => ({ ...prev, ...p })), []);

  const steps = useMemo(() => getApplicable(mode, b, s), [mode, b, s]);
  const idx   = steps.indexOf(stepId);
  const progress = steps.filter(id => id !== 'mode' && id !== 'results');
  const progressIdx = progress.indexOf(stepId);

  const go = useCallback((toId: StepId, direction: 'fwd' | 'bck' = 'fwd') => {
    setDir(direction);
    setAnimKey(k => k + 1);
    setStepId(toId);
  }, []);

  const goNext = useCallback(() => {
    const next = steps[idx + 1];
    if (next) go(next, 'fwd');
  }, [steps, idx, go]);

  const goPrev = useCallback(() => {
    const prev = steps[idx - 1];
    if (prev) go(prev, 'bck');
  }, [steps, idx, go]);

  // Auto-handle single-county states
  const handleStateSelect = useCallback((code: string, forMode: Mode) => {
    const counties = COUNTIES[code] || [];
    if (forMode === 'buy') {
      setB({ locationState: code, locationCounty: counties[0] || '' });
    } else {
      setS({ locationState: code, locationCounty: counties[0] || '' });
    }
  }, [setB, setS]);

  const buyerResults  = useMemo(() => calculateBuyer(b),  [b]);
  const sellerResults = useMemo(() => calculateSeller(s), [s]);

  const liveLabel  = mode === 'buy' ? 'Est. Cash to Close' : 'Est. Cash to Seller';
  const liveAmount = mode === 'buy'
    ? (b.purchasePrice > 0 ? fmt(buyerResults.cashToClose) : '—')
    : (s.salesPrice > 0    ? fmt(sellerResults.cashToSeller) : '—');

  const handleSave = async () => {
    if (!user) { setSaveMsg('Login to save'); setTimeout(() => setSaveMsg(''), 3000); return; }
    try {
      if (mode === 'buy') {
        await axios.post('/api/calculations/save', { calcType:'buyer', inputs:b, results:buyerResults });
      } else {
        await axios.post('/api/calculations/save', { calcType:'seller', inputs:s, results:sellerResults });
      }
      setSaveMsg('Saved! ✓');
    } catch { setSaveMsg('Error saving'); }
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const slideClass = dir === 'fwd' ? 'quiz-slide-fwd' : 'quiz-slide-bck';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#070B14', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(62,171,162,0.08) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* Progress bar */}
      {stepId !== 'mode' && stepId !== 'results' && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-[3px] bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#3EABA2] to-[#5DD3CA] transition-all duration-500 ease-out"
              style={{ width: `${progress.length > 0 ? ((progressIdx + 1) / progress.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Header nav */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          {idx > 0 && (
            <button
              onClick={goPrev}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {idx === 0 && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-sm"
            >
              <Home size={15} />
            </button>
          )}
        </div>

        {stepId !== 'mode' && stepId !== 'results' && progress.length > 0 && (
          <div className="flex items-center gap-2">
            {progress.map((id, i) => (
              <div
                key={id}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  i === progressIdx ? 20 : 6,
                  height: 6,
                  background: i < progressIdx ? '#3EABA2' : i === progressIdx ? '#3EABA2' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
        )}

        {stepId !== 'mode' && (
          <span className="text-white/20 text-xs font-medium">
            {progressIdx >= 0 ? `${progressIdx + 1} / ${progress.length}` : ''}
          </span>
        )}
      </div>

      {/* Step content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <div key={animKey} className={`flex-1 flex flex-col ${slideClass}`}>
          <StepContent
            stepId={stepId} mode={mode} b={b} s={s}
            setB={setB} setS={setS} setMode={setMode}
            goNext={goNext} goPrev={goPrev} handleStateSelect={handleStateSelect}
            buyerResults={buyerResults} sellerResults={sellerResults}
            user={user} handleSave={handleSave} saveMsg={saveMsg}
            navigate={navigate}
          />
        </div>
      </div>

      {/* Live preview bar */}
      {mode && stepId !== 'mode' && stepId !== 'results' && (
        <div className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-md px-6 py-3 flex items-center justify-between no-print">
          <span className="text-white/30 text-xs uppercase tracking-widest font-medium">{liveLabel}</span>
          <span className="font-bold text-[#3EABA2] text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            {liveAmount}
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step Content Router
// ═══════════════════════════════════════════════════════════════

interface StepProps {
  stepId: StepId; mode: Mode | null;
  b: BuyerInputs; s: SellerInputs;
  setB: (p: Partial<BuyerInputs>) => void;
  setS: (p: Partial<SellerInputs>) => void;
  setMode: (m: Mode) => void;
  goNext: () => void; goPrev: () => void;
  handleStateSelect: (code: string, mode: Mode) => void;
  buyerResults: ReturnType<typeof calculateBuyer>;
  sellerResults: ReturnType<typeof calculateSeller>;
  user: unknown; handleSave: () => void; saveMsg: string;
  navigate: (path: string) => void;
}

function StepContent(p: StepProps) {
  const { stepId, mode, b, s, setB, setS, setMode, goNext, handleStateSelect, buyerResults, sellerResults, user, handleSave, saveMsg, navigate } = p;

  // ── Mode ────────────────────────────────────────────────────
  if (stepId === 'mode') return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-12 quiz-fade-up">
        <div className="inline-flex items-center gap-2 bg-[#3EABA2]/10 border border-[#3EABA2]/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-[#3EABA2] text-xs font-semibold tracking-widest uppercase">Federal Title & Escrow</span>
        </div>
        <h1 className="text-white text-4xl md:text-6xl font-bold mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          What are you doing?
        </h1>
        <p className="text-white/40 text-lg">We'll calculate your exact closing costs in 2 minutes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl quiz-fade-up-1">
        {/* BUY */}
        <button
          onClick={() => { setMode('buy'); goNext(); }}
          className="quiz-card group relative overflow-hidden rounded-2xl border border-white/8 text-left p-8 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, rgba(62,171,162,0.12), rgba(62,171,162,0.04))' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#3EABA2]/0 to-[#3EABA2]/0 group-hover:from-[#3EABA2]/8 group-hover:to-transparent transition-all duration-300 rounded-2xl" />
          <div className="relative">
            <div className="text-6xl mb-5">🏠</div>
            <div className="text-[#3EABA2] text-xs font-bold tracking-widest uppercase mb-2">Buying</div>
            <h2 className="text-white text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>BUY IT</h2>
            <p className="text-white/40 text-sm leading-relaxed">Calculate your cash to close, monthly payment & full closing cost breakdown.</p>
            <div className="mt-6 flex items-center gap-2 text-[#3EABA2] text-sm font-semibold">
              Let's go <ChevronRight size={16} />
            </div>
          </div>
        </button>

        {/* SELL */}
        <button
          onClick={() => { setMode('sell'); goNext(); }}
          className="quiz-card group relative overflow-hidden rounded-2xl border border-white/8 text-left p-8 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 to-transparent group-hover:from-amber-400/8 transition-all duration-300 rounded-2xl" />
          <div className="relative">
            <div className="text-6xl mb-5">💰</div>
            <div className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Selling</div>
            <h2 className="text-white text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>SELL IT</h2>
            <p className="text-white/40 text-sm leading-relaxed">See your net proceeds after commission, taxes, payoffs & closing costs.</p>
            <div className="mt-6 flex items-center gap-2 text-amber-400 text-sm font-semibold">
              Let's go <ChevronRight size={16} />
            </div>
          </div>
        </button>
      </div>

      <p className="text-white/20 text-xs mt-10 quiz-fade-up-2">
        🔒 Used by thousands of DC Metro clients · Federal Title & Escrow
      </p>
    </div>
  );

  // ── State ───────────────────────────────────────────────────
  if (stepId === 'state') return (
    <QuizFrame q="Where is the property?" sub="We'll apply the correct state taxes & recording fees.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto w-full">
        {STATES.map((st, i) => {
          const sel = mode === 'buy' ? b.locationState === st.code : s.locationState === st.code;
          return (
            <button
              key={st.code}
              className={`quiz-card rounded-2xl border border-white/8 p-6 text-center cursor-pointer quiz-fade-up-${i+1} relative overflow-hidden ${sel ? 'selected' : ''}`}
              style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`, animationDelay: `${i * 0.08}s` }}
              onClick={() => {
                handleStateSelect(st.code, mode!);
                setTimeout(goNext, 200);
              }}
            >
              <div className="text-5xl mb-3">{st.flag}</div>
              <div className="text-5xl font-black text-white/10 absolute -bottom-3 -right-2 select-none leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>{st.code}</div>
              <div className="relative">
                <div className="text-white font-bold text-lg">{st.code}</div>
                <div className="text-white/40 text-xs mt-1">{st.name}</div>
              </div>
              {sel && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#3EABA2] flex items-center justify-center"><Check size={11} strokeWidth={3} /></div>}
            </button>
          );
        })}
      </div>
    </QuizFrame>
  );

  // ── County ──────────────────────────────────────────────────
  if (stepId === 'county') {
    const state = mode === 'buy' ? b.locationState : s.locationState;
    const counties = COUNTIES[state] || [];
    const selected = mode === 'buy' ? b.locationCounty : s.locationCounty;
    return (
      <QuizFrame q={`Which county in ${state}?`} sub="This affects transfer taxes and recording fees.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto w-full">
          {counties.map((c, i) => (
            <button
              key={c}
              className={`quiz-card rounded-xl border border-white/8 py-4 px-3 text-center cursor-pointer text-sm font-medium transition-colors ${selected === c ? 'selected' : 'text-white/70 hover:text-white'}`}
              style={{ background: 'rgba(255,255,255,0.03)', animationDelay: `${i * 0.05}s` }}
              onClick={() => {
                if (mode === 'buy') setB({ locationCounty: c });
                else setS({ locationCounty: c });
                setTimeout(goNext, 180);
              }}
            >
              {selected === c && <Check size={12} className="inline mr-1 text-[#3EABA2]" />}
              {c}
            </button>
          ))}
        </div>
      </QuizFrame>
    );
  }

  // ── Price ───────────────────────────────────────────────────
  if (stepId === 'price') {
    const label = mode === 'buy' ? 'purchase price' : 'sale price';
    const val   = mode === 'buy' ? b.purchasePrice : s.salesPrice;
    return (
      <QuizFrame
        q={`What's your ${label}?`}
        sub="Type the amount — we'll format it automatically."
      >
        <div className="max-w-xl mx-auto w-full text-center">
          <div className="relative flex items-center justify-center gap-3 mb-6">
            <span className="text-[#3EABA2]/50 font-bold select-none" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem,7vw,5rem)' }}>$</span>
            <input
              className="price-input flex-1"
              placeholder="0"
              autoFocus
              value={val > 0 ? val.toLocaleString() : ''}
              onChange={e => {
                const v = Number(e.target.value.replace(/[^0-9]/g,''));
                if (!isNaN(v)) {
                  if (mode === 'buy') setB({ purchasePrice: v, downPayment: Math.round(v * (b.downPaymentPct / 100)) });
                  else setS({ salesPrice: v });
                }
              }}
              onKeyDown={e => { if (e.key === 'Enter' && val > 0) goNext(); }}
            />
          </div>

          {val > 0 && (
            <div className="text-white/30 text-sm mb-8 quiz-fade-in">
              {val.toLocaleString('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 })}
            </div>
          )}

          <button
            onClick={goNext}
            disabled={val === 0}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: val > 0 ? 'linear-gradient(135deg, #3EABA2, #2d9991)' : 'rgba(255,255,255,0.06)', color: 'white' }}
          >
            Continue <ChevronRight size={18} />
          </button>
        </div>
      </QuizFrame>
    );
  }

  // ── Loan Type ────────────────────────────────────────────────
  if (stepId === 'loan-type') {
    const LOANS = [
      { value:'conventional', icon:'🏛️', label:'Conventional', sub:'Best for good-credit buyers',    color:'rgba(62,171,162,0.08)' },
      { value:'fha',          icon:'🏠', label:'FHA Loan',      sub:'Low down payment (3.5%)',        color:'rgba(99,102,241,0.08)' },
      { value:'va',           icon:'⭐', label:'VA Loan',        sub:'No down payment for veterans',   color:'rgba(245,158,11,0.08)' },
      { value:'cash',         icon:'💵', label:'Cash / No Loan', sub:'Fastest closing, no financing',  color:'rgba(34,197,94,0.08)' },
    ] as const;
    return (
      <QuizFrame q="How are you financing?" sub="This determines your lender fees and what questions come next.">
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
          {LOANS.map((l, i) => (
            <button
              key={l.value}
              className={`quiz-card rounded-2xl border border-white/8 p-6 text-left cursor-pointer quiz-fade-up-${i+1} ${b.loanType === l.value ? 'selected' : ''}`}
              style={{ background: b.loanType === l.value ? undefined : l.color }}
              onClick={() => {
                setB({ loanType: l.value as BuyerInputs['loanType'] });
                setTimeout(goNext, 220);
              }}
            >
              <div className="text-4xl mb-3">{l.icon}</div>
              <div className="text-white font-bold text-base mb-1">{l.label}</div>
              <div className="text-white/40 text-xs leading-relaxed">{l.sub}</div>
              {b.loanType === l.value && (
                <div className="mt-3 w-5 h-5 rounded-full bg-[#3EABA2] flex items-center justify-center">
                  <Check size={11} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </QuizFrame>
    );
  }

  // ── Down Payment ─────────────────────────────────────────────
  if (stepId === 'down-payment') {
    const pct = b.purchasePrice > 0 ? (b.downPayment / b.purchasePrice) * 100 : 0;
    const PRESETS = [3.5, 5, 10, 20];
    const loanAmt = Math.max(0, b.purchasePrice - b.downPayment);
    return (
      <QuizFrame q="How much are you putting down?" sub="Your down payment affects your loan amount and monthly payment.">
        <div className="max-w-xl mx-auto w-full space-y-8">
          {/* Percentage ring + amount */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-full border-4 border-[#3EABA2]/30 w-36 h-36 mx-auto mb-4 relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(62,171,162,0.1)" strokeWidth="8" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#3EABA2" strokeWidth="8"
                  strokeDasharray={`${Math.min(pct, 100) * 2.76} 276`}
                  strokeLinecap="round" className="transition-all duration-500" />
              </svg>
              <div className="text-center relative z-10">
                <div className="text-white text-2xl font-black">{pct.toFixed(0)}%</div>
                <div className="text-white/30 text-xs">down</div>
              </div>
            </div>
            <div className="text-[#3EABA2] text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
              {fmt(b.downPayment)}
            </div>
            <div className="text-white/30 text-sm mt-1">Loan: {fmt(loanAmt)}</div>
          </div>

          {/* Presets */}
          <div className="flex gap-2 justify-center flex-wrap">
            {PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => setB({ downPayment: Math.round(b.purchasePrice * (preset / 100)), downPaymentPct: preset })}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${Math.abs(pct - preset) < 0.5 ? 'bg-[#3EABA2] text-white' : 'border border-white/15 text-white/50 hover:border-[#3EABA2]/50 hover:text-white/80'}`}
              >
                {preset}%
              </button>
            ))}
          </div>

          {/* Slider */}
          <div>
            <input type="range" min={0} max={b.purchasePrice} step={1000}
              value={b.downPayment}
              onChange={e => {
                const v = Number(e.target.value);
                setB({ downPayment: v, downPaymentPct: b.purchasePrice > 0 ? Math.round((v/b.purchasePrice)*1000)/10 : 0 });
              }}
              style={{ background: `linear-gradient(to right, #3EABA2 ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
            />
          </div>

          <button onClick={goNext}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #3EABA2, #2d9991)' }}>
            Continue <ChevronRight size={18} />
          </button>
        </div>
      </QuizFrame>
    );
  }

  // ── Rate & Term ──────────────────────────────────────────────
  if (stepId === 'rate-term') {
    const ratePct = b.interestRate;
    const TERMS = [10, 15, 20, 30];
    return (
      <QuizFrame q="Interest rate & loan term?" sub="Adjust to match your lender's current offer.">
        <div className="max-w-xl mx-auto w-full space-y-8">
          <div className="text-center">
            <div className="text-7xl font-black text-[#3EABA2] transition-all" style={{ fontFamily: "'Playfair Display', serif" }}>
              {ratePct.toFixed(3)}
              <span className="text-4xl text-[#3EABA2]/60">%</span>
            </div>
            <div className="text-white/30 text-sm mt-1">Interest Rate (APR)</div>
          </div>

          <div>
            <input type="range" min={1} max={15} step={0.125}
              value={b.interestRate}
              onChange={e => setB({ interestRate: Number(e.target.value) })}
              style={{ background: `linear-gradient(to right, #3EABA2 ${((b.interestRate-1)/14)*100}%, rgba(255,255,255,0.1) ${((b.interestRate-1)/14)*100}%)` }}
            />
            <div className="flex justify-between text-white/25 text-xs mt-1"><span>1%</span><span>15%</span></div>
          </div>

          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3 text-center">Loan Term</div>
            <div className="flex gap-2 justify-center">
              {TERMS.map(t => (
                <button key={t}
                  onClick={() => setB({ loanTerm: t })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${b.loanTerm === t ? 'bg-[#3EABA2] text-white' : 'border border-white/10 text-white/40 hover:border-[#3EABA2]/40 hover:text-white/70'}`}
                >{t} yr</button>
              ))}
            </div>
          </div>

          <button onClick={goNext}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base text-white"
            style={{ background: 'linear-gradient(135deg, #3EABA2, #2d9991)' }}>
            Continue <ChevronRight size={18} />
          </button>
        </div>
      </QuizFrame>
    );
  }

  // ── Property Type ────────────────────────────────────────────
  if (stepId === 'property-type') {
    const state = mode === 'buy' ? b : s;
    const sel   = state.propertyType;
    return (
      <QuizFrame q="What type of property?" sub="Property type can affect title insurance and recording fees.">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto w-full">
          {PROPERTY_TYPES.map((pt, i) => (
            <button key={pt.value}
              className={`quiz-card rounded-2xl border border-white/8 p-4 text-center cursor-pointer quiz-fade-up ${sel === pt.value ? 'selected' : ''}`}
              style={{ background: 'rgba(255,255,255,0.03)', animationDelay: `${i * 0.07}s` }}
              onClick={() => {
                if (mode === 'buy') setB({ propertyType: pt.value });
                else setS({ propertyType: pt.value });
                setTimeout(goNext, 200);
              }}
            >
              <div className="text-3xl mb-2">{pt.icon}</div>
              <div className="text-white text-xs font-semibold">{pt.label}</div>
              <div className="text-white/30 text-[10px] mt-0.5 leading-tight">{pt.sub}</div>
              {sel === pt.value && <div className="mt-2 w-4 h-4 rounded-full bg-[#3EABA2] flex items-center justify-center mx-auto"><Check size={9} strokeWidth={3}/></div>}
            </button>
          ))}
        </div>
      </QuizFrame>
    );
  }

  // ── Property Use ─────────────────────────────────────────────
  if (stepId === 'property-use') return (
    <QuizFrame q="How will you use it?" sub="Primary residence buyers may qualify for special tax exemptions.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto w-full">
        {PROPERTY_USE.map((pu, i) => (
          <button key={pu.value}
            className={`quiz-card rounded-2xl border border-white/8 p-6 text-center cursor-pointer quiz-fade-up-${i+1} ${b.propertyUse === pu.value ? 'selected' : ''}`}
            style={{ background: 'rgba(255,255,255,0.03)' }}
            onClick={() => { setB({ propertyUse: pu.value }); setTimeout(goNext, 200); }}
          >
            <div className="text-5xl mb-3">{pu.icon}</div>
            <div className="text-white font-bold text-base">{pu.label}</div>
            <div className="text-white/35 text-xs mt-1 leading-relaxed">{pu.sub}</div>
            {b.propertyUse === pu.value && <div className="mt-3 w-5 h-5 rounded-full bg-[#3EABA2] flex items-center justify-center mx-auto"><Check size={11} strokeWidth={3}/></div>}
          </button>
        ))}
      </div>
    </QuizFrame>
  );

  // ── Seller Type ──────────────────────────────────────────────
  if (stepId === 'seller-type') return (
    <QuizFrame q="Who is the seller?" sub="This can affect the transaction structure and certain fees.">
      <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
        {SELLER_TYPES.map((st, i) => (
          <button key={st.value}
            className={`quiz-card rounded-2xl border border-white/8 p-5 text-left cursor-pointer quiz-fade-up-${i+1} ${b.sellerType === st.value ? 'selected' : ''}`}
            style={{ background: 'rgba(255,255,255,0.03)' }}
            onClick={() => { setB({ sellerType: st.value }); setTimeout(goNext, 200); }}
          >
            <div className="text-3xl mb-2">{st.icon}</div>
            <div className="text-white text-sm font-bold">{st.label}</div>
            <div className="text-white/35 text-xs mt-1 leading-snug">{st.sub}</div>
            {b.sellerType === st.value && <Check size={14} className="text-[#3EABA2] mt-2" />}
          </button>
        ))}
      </div>
    </QuizFrame>
  );

  // ── Commission (Seller) ──────────────────────────────────────
  if (stepId === 'commission') return (
    <QuizFrame q="What's the commission?" sub="Total agent commission as a percentage of the sale price.">
      <div className="max-w-sm mx-auto w-full space-y-6">
        <div className="text-center">
          <div className="text-7xl font-black text-[#3EABA2]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {s.commission.toFixed(1)}<span className="text-4xl opacity-60">%</span>
          </div>
          <div className="text-white/30 text-sm mt-1">{fmt(s.salesPrice * s.commission / 100)}</div>
        </div>
        <input type="range" min={0} max={10} step={0.5} value={s.commission}
          onChange={e => setS({ commission: Number(e.target.value) })}
          style={{ background: `linear-gradient(to right, #3EABA2 ${(s.commission/10)*100}%, rgba(255,255,255,0.1) ${(s.commission/10)*100}%)` }}
        />
        <div className="flex justify-between text-white/25 text-xs"><span>0%</span><span>10%</span></div>
        <div className="flex gap-2">
          {[3, 4, 5, 6].map(p => (
            <button key={p} onClick={() => setS({ commission: p })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${s.commission === p ? 'bg-[#3EABA2] text-white' : 'border border-white/10 text-white/40 hover:border-[#3EABA2]/40'}`}
            >{p}%</button>
          ))}
        </div>
        <button onClick={goNext}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3EABA2, #2d9991)' }}>
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </QuizFrame>
  );

  // ── Mortgages ────────────────────────────────────────────────
  if (stepId === 'mortgages') return (
    <QuizFrame q="How many mortgages?" sub="Include all HELOCs and liens on the property.">
      <div className="flex gap-3 max-w-sm mx-auto w-full">
        {[0,1,2,3,4].map(n => (
          <button key={n}
            className={`quiz-card flex-1 rounded-2xl border border-white/8 py-6 text-center cursor-pointer ${s.numMortgages === n ? 'selected' : ''}`}
            style={{ background: 'rgba(255,255,255,0.03)' }}
            onClick={() => { setS({ numMortgages: n }); setTimeout(goNext, 200); }}
          >
            <div className="text-3xl font-black text-white">{n}</div>
            <div className="text-white/30 text-xs mt-1">{n === 0 ? 'Free & clear' : n === 1 ? 'mortgage' : 'mortgages'}</div>
          </button>
        ))}
      </div>
    </QuizFrame>
  );

  // ── Payoffs ──────────────────────────────────────────────────
  if (stepId === 'payoffs') {
    const fields = [
      { label:'1st Mortgage', key:'mortgagePayoff' as keyof SellerInputs },
      { label:'2nd Mortgage', key:'mortgagePayoff2' as keyof SellerInputs },
      { label:'3rd Mortgage', key:'mortgagePayoff3' as keyof SellerInputs },
      { label:'HELOC / 4th',  key:'mortgagePayoff4' as keyof SellerInputs },
    ].slice(0, s.numMortgages);
    return (
      <QuizFrame q="What are the payoff amounts?" sub="Estimated balances on each mortgage at closing.">
        <div className="max-w-sm mx-auto w-full space-y-3">
          {fields.map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="text-white/40 text-sm w-28 shrink-0">{f.label}</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                <input
                  type="text"
                  value={(s[f.key] as number) > 0 ? (s[f.key] as number).toLocaleString() : ''}
                  placeholder="0"
                  onChange={e => {
                    const v = Number(e.target.value.replace(/[^0-9]/g,''));
                    setS({ [f.key]: v });
                  }}
                  className="w-full bg-white/5 border border-white/10 focus:border-[#3EABA2] rounded-xl pl-7 pr-3 py-3 text-white text-sm outline-none transition-colors"
                />
              </div>
            </div>
          ))}
          <button onClick={goNext}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white mt-4"
            style={{ background: 'linear-gradient(135deg, #3EABA2, #2d9991)' }}>
            Continue <ChevronRight size={18} />
          </button>
        </div>
      </QuizFrame>
    );
  }

  // ── FIRPTA ───────────────────────────────────────────────────
  if (stepId === 'firpta') return (
    <YesNoStep
      q="FIRPTA Withholding?"
      sub="Is the seller a foreign national? FIRPTA applies a federal withholding tax."
      link={{ label:'Learn about FIRPTA', href:'https://www.federaltitle.com' }}
      value={s.firpta}
      onChange={v => { setS({ firpta: v }); setTimeout(goNext, 220); }}
    />
  );

  // ── DC Homestead ─────────────────────────────────────────────
  if (stepId === 'dc-homestead') return (
    <YesNoStep
      q="DC Homestead Deduction?"
      sub="DC primary residence buyers may qualify for a recordation tax reduction up to $647,000."
      link={{ label:'See qualification requirements', href:'https://www.federaltitle.com/how-to-qualify-for-dc-homestead-deduction/' }}
      value={b.dcHomesteadDeduction}
      onChange={v => { setB({ dcHomesteadDeduction: v, dcFirstTimeBuyer: v ? b.dcFirstTimeBuyer : false }); setTimeout(goNext, 220); }}
    />
  );

  if (stepId === 'dc-first-time') return (
    <YesNoStep
      q="DC First-Time Homebuyer?"
      sub="First-time buyers with the Homestead Deduction may qualify for a recordation tax reduction."
      link={{ label:'See qualification requirements', href:'https://www.federaltitle.com/dc-first-time-homebuyers-recordation-tax-reduction/' }}
      value={b.dcFirstTimeBuyer}
      onChange={v => { setB({ dcFirstTimeBuyer: v }); setTimeout(goNext, 220); }}
    />
  );

  if (stepId === 'md-buyer') return (
    <YesNoStep
      q="Maryland First-Time Homebuyer?"
      sub="Maryland first-time buyers may qualify for a transfer & recordation tax reduction."
      link={{ label:'See qualification requirements', href:'https://www.federaltitle.com/what-s-the-benefit-of-the-maryland-first-time-homebuyer-tax-credit/' }}
      value={b.marylandFirstTimeBuyer}
      onChange={v => { setB({ marylandFirstTimeBuyer: v }); setTimeout(goNext, 220); }}
    />
  );

  if (stepId === 'va-disability') return (
    <YesNoStep
      q="VA Disability Rating?"
      sub="Veterans with a service-connected disability are exempt from the VA funding fee."
      value={b.vaDisabilityRating}
      onChange={v => { setB({ vaDisabilityRating: v, vaFirstTimeCOE: false }); setTimeout(goNext, 220); }}
    />
  );

  if (stepId === 'va-coe') return (
    <YesNoStep
      q="First-time use of VA Certificate of Eligibility?"
      sub="First-time COE users pay a lower VA funding fee (2.15% vs 3.3%)."
      value={b.vaFirstTimeCOE}
      onChange={v => { setB({ vaFirstTimeCOE: v }); setTimeout(goNext, 220); }}
    />
  );

  // ── Fine Tune ────────────────────────────────────────────────
  if (stepId === 'fine-tune') {
    const isBuy = mode === 'buy';
    return (
      <QuizFrame q="Almost there — any extras?" sub="Leave everything at zero to use our best estimates. All fields are optional.">
        <div className="max-w-md mx-auto w-full space-y-3">
          {isBuy ? (
            <>
              <FineTuneRow label="HOA / Month" icon="🏘️"       value={b.hoa}         onChange={v => setB({ hoa: v })} />
              <FineTuneRow label="Broker Flat Fee" icon="📋"   value={b.brokerFee}   onChange={v => setB({ brokerFee: v })} />
              <FineTuneRow label="Seller Credit" icon="🤝"     value={b.sellerCredit as number} onChange={v => setB({ sellerCredit: v })} />
              <div className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3 border border-white/5">
                <span className="text-lg">📅</span>
                <span className="text-white/50 text-sm flex-1">Closing Date</span>
                <input type="date" value={b.closingDate}
                  onChange={e => setB({ closingDate: e.target.value })}
                  className="bg-transparent border border-white/15 text-white text-sm rounded-lg px-2 py-1.5 outline-none focus:border-[#3EABA2]"
                />
              </div>
            </>
          ) : (
            <>
              <FineTuneRow label="Seller Credit" icon="🤝"       value={s.sellerCredit as number} onChange={v => setS({ sellerCredit: v })} />
              <FineTuneRow label="Admin / Flat Fee" icon="📋"    value={s.adminFee}    onChange={v => setS({ adminFee: v })} />
              <FineTuneRow label="Water Escrow" icon="💧"         value={s.waterEscrow} onChange={v => setS({ waterEscrow: v })} />
              <FineTuneRow label="Termite Treatment" icon="🪲"   value={s.termiteTreatment} onChange={v => setS({ termiteTreatment: v })} />
              <FineTuneRow label="Home Warranty" icon="🛡️"       value={s.homeWarranty}    onChange={v => setS({ homeWarranty: v })} />
              <div className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3 border border-white/5">
                <span className="text-lg">📅</span>
                <span className="text-white/50 text-sm flex-1">Settlement Date</span>
                <input type="date" value={s.settlementDate}
                  onChange={e => setS({ settlementDate: e.target.value })}
                  className="bg-transparent border border-white/15 text-white text-sm rounded-lg px-2 py-1.5 outline-none focus:border-[#3EABA2]"
                />
              </div>
            </>
          )}

          <button onClick={goNext}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white mt-2"
            style={{ background: 'linear-gradient(135deg, #3EABA2, #2d9991)' }}>
            See My Results <ChevronRight size={18} />
          </button>
        </div>
      </QuizFrame>
    );
  }

  // ── Results ──────────────────────────────────────────────────
  if (stepId === 'results') {
    const isBuy = mode === 'buy';
    const mainLabel  = isBuy ? 'Cash to Close'   : 'Cash to Seller';
    const mainValue  = isBuy ? buyerResults.cashToClose : sellerResults.cashToSeller;
    const mainColor  = isBuy ? '#3EABA2' : (mainValue >= 0 ? '#3EABA2' : '#EF4444');
    const isNegative = mainValue < 0;

    const buyBreakdown = [
      { label: 'Purchase Price',       value: b.purchasePrice,                    color: 'white',   emoji:'🏠' },
      { label: 'Down Payment',         value: b.loanType!=='cash' ? b.downPayment : b.purchasePrice, color:'#3EABA2', emoji:'💳' },
      { label: 'Lender Fees',          value: buyerResults.totalLenderFees,       color: '#F97316', emoji:'🏦' },
      { label: 'Title & Settlement',   value: buyerResults.totalTitleFees,        color: '#F97316', emoji:'📋' },
      { label: 'Transfer & Recording', value: buyerResults.totalTaxes,            color: '#F97316', emoji:'🏛️' },
      { label: 'Prepaids & Escrows',   value: buyerResults.totalPrepaids,         color: '#F97316', emoji:'📅' },
      ...(Number(b.sellerCredit) > 0 ? [{ label:'Seller Credit', value: -Number(b.sellerCredit), color:'#22C55E', emoji:'🤝' }] : []),
    ];

    const sellBreakdown = [
      { label: 'Sale Price',           value: s.salesPrice,                           color:'white',   emoji:'🏠' },
      { label: 'Commission',           value: -sellerResults.commission,               color:'#EF4444', emoji:'🤝' },
      { label: 'Transfer & Recording', value: -(sellerResults.recordationTax + sellerResults.transferTax), color:'#EF4444', emoji:'🏛️' },
      { label: 'Settlement Fees',      value: -sellerResults.settlementFee,            color:'#EF4444', emoji:'📋' },
      { label: 'Mortgage Payoff(s)',   value: -(sellerResults.mortgagePayoff + sellerResults.helocPayoff), color:'#EF4444', emoji:'🏦' },
      { label: 'Prorated Taxes',       value: -sellerResults.proratedTaxes,            color:'#F97316', emoji:'📅' },
    ];

    const breakdown = isBuy ? buyBreakdown : sellBreakdown;

    return (
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 overflow-y-auto">
        {/* Hero */}
        <div className="text-center mb-8 result-slam">
          <div className="text-white/30 text-xs font-bold tracking-widest uppercase mb-3">{mainLabel}</div>
          <div
            className="font-black leading-none mb-2"
            style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(3rem,10vw,5.5rem)', color: mainColor }}
          >
            {fmt(Math.abs(mainValue))}
          </div>
          {isNegative && <div className="text-red-400/70 text-sm">⚠️ Negative — payoffs exceed proceeds</div>}
          {isBuy && (
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-white/25 text-xs uppercase tracking-wide mb-1">Monthly PITI</div>
                <div className="text-white font-bold text-2xl">{fmt(buyerResults.totalMonthlyPayment)}</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <div className="text-white/25 text-xs uppercase tracking-wide mb-1">Loan Amount</div>
                <div className="text-white font-bold text-2xl">{fmt(Math.max(0, b.purchasePrice - b.downPayment))}</div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="result-line h-px max-w-md w-full mx-auto mb-6" style={{ background: 'linear-gradient(to right, transparent, rgba(62,171,162,0.4), transparent)' }} />

        {/* Breakdown */}
        <div className="w-full max-w-md mx-auto space-y-2 mb-8">
          {breakdown.map((item, i) => (
            item.value !== 0 && (
              <div
                key={item.label}
                className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  animation: `fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${0.3 + i*0.06}s both`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-white/60 text-sm">{item.label}</span>
                </div>
                <span className="font-semibold text-sm" style={{ color: item.color }}>
                  {item.value < 0 ? `-${fmt(Math.abs(item.value))}` : fmt(item.value)}
                </span>
              </div>
            )
          ))}
        </div>

        {/* Actions */}
        <div className="w-full max-w-md mx-auto flex flex-col gap-3"
          style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.8s both' }}>

          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#3EABA2]/30 text-[#3EABA2] text-sm font-semibold hover:bg-[#3EABA2]/10 transition-colors">
              <Save size={15} /> {saveMsg || 'Save Results'}
            </button>
            <button onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/10 text-white/40 text-sm font-semibold hover:border-white/20 hover:text-white/60 transition-colors">
              <Printer size={15} /> Print
            </button>
          </div>

          <button onClick={() => { window.scrollTo(0,0); window.location.reload(); }}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/8 text-white/30 text-sm hover:text-white/50 transition-colors">
            <RefreshCw size={14} /> Start Over
          </button>

          <button onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 py-3 text-white/20 text-xs hover:text-white/40 transition-colors">
            <Home size={12} /> Back to Home
          </button>
        </div>

        <p className="text-white/15 text-xs mt-8 text-center max-w-sm">
          Estimates provided by Federal Title & Escrow. Actual costs may vary. Contact us for a precise closing cost sheet.
        </p>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// Reusable Step Frames
// ═══════════════════════════════════════════════════════════════

function QuizFrame({ q, sub, children }: { q: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 min-h-0">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-10 quiz-fade-up">
          <h2 className="text-white font-bold leading-tight mb-3"
            style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.8rem)' }}>
            {q}
          </h2>
          {sub && <p className="text-white/35 text-sm max-w-sm mx-auto leading-relaxed">{sub}</p>}
        </div>
        <div className="quiz-fade-up-1">{children}</div>
      </div>
    </div>
  );
}

function YesNoStep({ q, sub, value, onChange, link }: {
  q: string; sub?: string; value: boolean;
  onChange: (v: boolean) => void;
  link?: { label: string; href: string };
}) {
  return (
    <QuizFrame q={q} sub={sub}>
      <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto w-full">
        {[true, false].map(v => (
          <button key={String(v)}
            className={`quiz-card flex-1 rounded-2xl border border-white/8 py-7 text-center cursor-pointer text-lg font-bold ${value === v ? 'selected' : 'text-white/60 hover:text-white'}`}
            style={{ background: value === v ? undefined : 'rgba(255,255,255,0.03)' }}
            onClick={() => onChange(v)}
          >
            <div className="text-4xl mb-2">{v ? '✅' : '❌'}</div>
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
      {link && (
        <div className="text-center mt-5">
          <a href={link.href} target="_blank" rel="noopener noreferrer"
            className="text-[#E74C3C] hover:underline text-xs">
            {link.label} →
          </a>
        </div>
      )}
    </QuizFrame>
  );
}

function FineTuneRow({ label, icon, value, onChange }: {
  label: string; icon: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3 border border-white/5">
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className="text-white/50 text-sm flex-1">{label}</span>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
        <input
          type="text"
          value={value > 0 ? value.toLocaleString() : ''}
          placeholder="0"
          onChange={e => {
            const v = Number(e.target.value.replace(/[^0-9]/g,''));
            if (!isNaN(v)) onChange(v);
          }}
          className="w-28 bg-transparent border border-white/10 focus:border-[#3EABA2] rounded-lg pl-7 pr-3 py-1.5 text-white text-sm outline-none transition-colors text-right"
        />
      </div>
    </div>
  );
}
