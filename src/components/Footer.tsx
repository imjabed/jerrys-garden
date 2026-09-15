import { Heart, MapPin, Phone, MessageCircle, ShieldCheck, Sparkles, QrCode } from 'lucide-react';
import Logo from './Logo';
import { StoreSettings } from '../types';

interface FooterProps {
  storeSettings: StoreSettings;
  isOwner?: boolean;
  onOpenOwnerLogin: () => void;
  onOpenTracking: () => void;
  onNavigateToBuilder?: () => void;
  onNavigateToShop: () => void;
}

export default function Footer({
  storeSettings,
  isOwner = false,
  onOpenOwnerLogin,
  onOpenTracking,
  onNavigateToShop,
}: FooterProps) {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand Col (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="brightness-125 invert-0">
              <Logo size="md" showSubtitle={true} />
            </div>
            
            <p className="text-xs text-stone-400 leading-relaxed">
              Jerry's Garden is a premier handcrafted ribbon flower boutique. We hand-fold everlasting roses, tulips, and custom bouquets from luxurious satin and silk ribbons for local celebrations.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-[11px] font-medium border border-stone-700">
                <QrCode className="w-3.5 h-3.5 text-rose-400" />
                <span>UPI & QR Payments</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-[11px] font-medium border border-stone-700">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Cash on Delivery (₹7 Fee)</span>
              </span>
            </div>
          </div>

          {/* Quick Nav (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Boutique
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onNavigateToShop}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  All Ribbon Bouquets
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Track Your Order
                </button>
              </li>
              <li>
                <span className="text-stone-500">Same-Day Local Delivery</span>
              </li>
            </ul>
          </div>

          {/* Care & Assurance (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Ribbon Flower Care
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>• Keep in room temperature away from direct rain</li>
              <li>• No water needed — everlasting beauty for 5+ years</li>
              <li>• Gentle dusting with dry soft brush if required</li>
              <li>• Hypoallergenic & safe around pets and children</li>
            </ul>
          </div>

          {/* Studio Contact (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Local Studio
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Berhampore, Murshidabad, West Bengal</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="italic">Phone: Hidden</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Order Support: Active Tracking Portal</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright & Owner Portal trigger (Invisible unless logged in as Owner) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© 2026 Jerry's Garden. Berhampore, Murshidabad. Handcrafted with precision.</p>

          {isOwner && (
            <div className="flex items-center gap-4">
              <button
                onClick={onOpenOwnerLogin}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Switch to Owner View"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Switch to Owner View</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </footer>
  );
}
