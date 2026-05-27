import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BuyerCalculator } from '../components/calculator/BuyerCalculator';
import { SellerCalculator } from '../components/calculator/SellerCalculator';

export function CalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'sell' ? 'sell' : 'buy';
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: 'buy' | 'sell') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Teal accent bar */}
      <div className="h-1 bg-[#3EABA2]" />

      <main className="pb-12">
        {activeTab === 'buy' ? <BuyerCalculator /> : <SellerCalculator />}
      </main>
    </div>
  );
}
