import { fmt } from '../../utils/calculations';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (v: number) => string;
  suffix?: string;
  editable?: boolean;
  secondaryLabel?: string;
}

export function SliderInput({
  label, value, min, max, step = 1, onChange,
  formatValue, suffix = '', editable = true, secondaryLabel
}: SliderInputProps) {
  const display = formatValue ? formatValue(value) : fmt(value);
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className="py-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-medium ${editable ? 'text-[#E74C3C]' : 'text-gray-700'}`}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {secondaryLabel && (
            <span className="text-xs text-gray-500">{secondaryLabel}</span>
          )}
          <span className="text-sm font-semibold text-gray-800">
            {display}{suffix}
          </span>
        </div>
      </div>
      <div className="relative flex items-center">
        <span className="text-xs text-gray-400 mr-2 w-16 text-right shrink-0">
          {formatValue ? formatValue(min) : fmt(min)}
        </span>
        <div className="relative flex-1">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, #aaa ${pct}%, #ddd ${pct}%)`
            }}
          />
        </div>
        <span className="text-xs text-gray-400 ml-2 w-16 shrink-0">
          {formatValue ? formatValue(max) : fmt(max)}
        </span>
      </div>
    </div>
  );
}
