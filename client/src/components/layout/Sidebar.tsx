import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { icon: '🏛️', label: 'CLOSE IT! order settlement services', color: '#5FAD56', href: 'https://www.federaltitle.com/quote' },
  { icon: '💰', label: 'Buy it! calculate cash to close', color: '#F39C12', route: '/calculator?tab=buy' },
  { icon: '🔄', label: 'Ask it! answers from local closing expert', color: '#E84B72', href: 'mailto:attorneys@federaltitle.com' },
  { icon: '📦', label: 'Save it! for future use and editing', color: '#E86742', route: '/saved' },
  { icon: '📧', label: 'Email it! to others with your profile', color: '#3EABA2', action: 'email' },
  { icon: '📤', label: 'Share it! tell others about this', color: '#F5B041', action: 'share' },
  { icon: '📝', label: 'Visit our Blog', color: '#C0392B', href: 'https://closeitapp.com/blog' },
  { icon: 'ℹ️', label: 'About Close it!', color: '#3498DB', href: 'https://closeitapp.com/about' },
  { icon: '💎', label: 'Title Co. Partners', color: '#3EABA2', href: 'https://www.federaltitle.com' },
  { icon: '😊', label: 'Login! / Create Profile', color: '#F39C12', route: '/login' },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleItem = (item: typeof MENU_ITEMS[0]) => {
    if (item.href) {
      window.open(item.href, '_blank', 'noopener');
    } else if (item.route) {
      navigate(item.route);
    } else if (item.action === 'share') {
      if (navigator.share) {
        navigator.share({ title: 'Close It!', url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else if (item.action === 'email') {
      window.location.href = 'mailto:?subject=Close It! Calculation&body=' + encodeURIComponent(window.location.href);
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 no-print"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 no-print ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="bg-[#2C2C2C] flex items-center justify-between px-4 py-3">
          <img src="/assets/logos/close-it-logo-main.png" alt="Close It!" className="h-8 object-contain" />
          <button onClick={onClose} className="text-white hover:text-gray-300" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="bg-[#3EABA2] text-white px-4 py-2 text-sm">
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs opacity-80">{user.email}</p>
          </div>
        )}

        {/* Menu items */}
        <nav className="overflow-y-auto h-full pb-20">
          {MENU_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => handleItem(item)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <span
                className="w-9 h-9 flex items-center justify-center rounded-full text-lg shrink-0"
                style={{ backgroundColor: item.color + '22', border: `2px solid ${item.color}44` }}
              >
                {item.icon}
              </span>
              <span className="text-sm text-gray-700 font-medium leading-tight">{item.label}</span>
            </button>
          ))}

          {user && (
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 border-b border-gray-100 text-red-500"
            >
              <span className="w-9 h-9 flex items-center justify-center rounded-full text-lg bg-red-50">🚪</span>
              <span className="text-sm font-medium">Log Out</span>
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-4 py-3 text-xs text-gray-400 text-center">
          <p>©2025 Federal Title & Escrow Company</p>
          <p>202.362.1500 | services@federaltitle.com</p>
        </div>
      </aside>
    </>
  );
}
