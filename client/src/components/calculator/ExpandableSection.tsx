import { useState, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ExpandableSectionProps {
  label: string;
  value: string;
  children?: ReactNode;
  defaultExpanded?: boolean;
  editable?: boolean;
  valueColor?: string;
}

export function ExpandableSection({
  label, value, children, defaultExpanded = false, editable = true, valueColor = '#E86742'
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            size={14}
            className="transition-transform duration-200 text-orange-400"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
          <span className={`text-sm ${editable ? 'text-[#E74C3C]' : 'text-gray-700'}`}>{label}</span>
        </div>
        <span className="text-sm font-medium" style={{ color: valueColor }}>{value}</span>
      </button>
      {open && children && (
        <div className="pl-6 pr-2 pb-3 bg-gray-50 rounded-b">
          {children}
        </div>
      )}
    </div>
  );
}
