import { Menu } from 'lucide-react';

interface HeaderProps {
  activeTab: 'buy' | 'sell';
  onTabChange: (tab: 'buy' | 'sell') => void;
  onMenuClick: () => void;
}

export function Header({ activeTab, onTabChange, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-[#2C2C2C] flex items-center px-3 py-2 no-print sticky top-0 z-40">
      <button
        onClick={onMenuClick}
        className="text-white p-1.5 hover:bg-white/10 rounded mr-3"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-2 mr-auto">
        <img
          src="/assets/logos/close-it-logo-main.png"
          alt="Close It!"
          className="h-8 object-contain"
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <img
          src="/assets/logos/federal-title-logo2.png"
          alt="Federal Title & Escrow"
          className="h-6 object-contain opacity-80"
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <div className="flex">
        <button
          onClick={() => onTabChange('buy')}
          className={`px-5 py-2 font-bold text-sm tracking-wide transition-colors ${
            activeTab === 'buy'
              ? 'bg-[#3EABA2] text-white'
              : 'bg-[#4A4A4A] text-gray-300 hover:bg-[#555]'
          }`}
        >
          BUY IT!
        </button>
        <button
          onClick={() => onTabChange('sell')}
          className={`px-5 py-2 font-bold text-sm tracking-wide transition-colors ${
            activeTab === 'sell'
              ? 'bg-[#3EABA2] text-white'
              : 'bg-[#4A4A4A] text-gray-300 hover:bg-[#555]'
          }`}
        >
          SELL IT!
        </button>
      </div>
    </header>
  );
}
