type LoanType = 'conventional' | 'fha' | 'va' | 'cash';

interface LoanTypeSelectorProps {
  value: LoanType;
  onChange: (v: LoanType) => void;
}

const TYPES: { id: LoanType; label: string }[] = [
  { id: 'conventional', label: 'Conventional' },
  { id: 'fha', label: 'FHA' },
  { id: 'va', label: 'VA' },
  { id: 'cash', label: 'Cash/No Loan' },
];

export function LoanTypeSelector({ value, onChange }: LoanTypeSelectorProps) {
  return (
    <div className="py-3 border-b border-gray-100">
      <span className="text-sm text-gray-600 block mb-2">Loan Type</span>
      <div className="flex gap-2 flex-wrap">
        {TYPES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
              value === t.id
                ? 'bg-[#3EABA2] text-white border-[#3EABA2]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-[#3EABA2] hover:text-[#3EABA2]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
