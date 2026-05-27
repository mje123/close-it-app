import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import { fmt } from '../utils/calculations';
import { Trash2, ExternalLink } from 'lucide-react';

interface Calculation {
  id: number;
  calc_type: string;
  name: string;
  location_state: string;
  location_county: string;
  purchase_price: number;
  created_at: string;
}

export function SavedCalculationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [calcs, setCalcs] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get('/api/calculations/saved')
      .then(r => setCalcs(r.data.calculations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this calculation?')) return;
    await axios.delete(`/api/calculations/saved/${id}`);
    setCalcs(c => c.filter(x => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-[#2C2C2C] px-6 py-3 flex items-center justify-between">
        <Link to="/">
          <img src="/assets/logos/close-it-logo-main.png" alt="Close It!" className="h-8 object-contain" />
        </Link>
        <Link to="/calculator" className="text-[#3EABA2] text-sm hover:underline">← Back to Calculator</Link>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Saved Calculations</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : calcs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-400 mb-4">No saved calculations yet.</p>
            <Link to="/calculator" className="bg-[#3EABA2] text-white px-6 py-2 rounded font-semibold hover:bg-[#349990]">
              Start Calculating
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {calcs.map(c => (
              <div key={c.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${c.calc_type === 'buyer' ? 'bg-[#3EABA2]' : 'bg-[#E86742]'}`}>
                  {c.calc_type === 'buyer' ? 'BUY' : 'SELL'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  <p className="text-sm text-gray-500">
                    {c.location_county}, {c.location_state} · {fmt(c.purchase_price)}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/calculator?tab=${c.calc_type === 'buyer' ? 'buy' : 'sell'}`}
                    className="p-2 text-[#3EABA2] hover:bg-teal-50 rounded"
                    title="Open in calculator"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
