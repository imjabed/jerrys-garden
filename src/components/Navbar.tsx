import { useState } from 'react';
import { ShoppingBag, Search, Compass, ShieldCheck, User as UserIcon, Menu, X, Sparkles, LogOut, Package } from 'lucide-react';
import Logo from './Logo';
import { UserAccount } from '../types';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onOpenAuth: () => void;
  onOpenOwnerModal: () => void;
  onNavigateToBuilder: () => void;
  onNavigateToShop: () => void;
  onNavigateToStory: () => void;
  activeUser: UserAccount | null;
  onLogoutUser: () => void;
  isOwner: boolean;
  onOpenOwnerDashboard: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenTracking,
  onOpenAuth,
  onOpenOwnerModal,
  onNavigateToBuilder,
  onNavigateToShop,
  onNavigateToStory,
  activeUser,
  onLogoutUser,
  isOwner,
  onOpenOwnerDashboard,
  searchQuery,
  setSearchQuery,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
      {/* Top micro-announcement banner */}
      <div className="bg-gradient-to-r from-rose-50 via-rose-100/70 to-amber-50 text-stone-700 text-xs py-1.5 px-4 text-center border-b border-rose-100/60 font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
        <span>Handcrafted in Berhampore, Murshidabad Bro • 100% Everlasting Satin Ribbon Bouquets</span>
        <span className="hidden md:inline text-rose-400">•</span>
        <span className="hidden md:inline text-stone-600">Instant UPI & QR Payments Accepted</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div onClick={onNavigateToShop}>
            <Logo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-stone-600">
            <button
              id="nav-shop-btn"
              onClick={onNavigateToShop}
              className="hover:text-rose-600 transition-colors py-2"
            >
              Shop Bouquets
            </button>
            <button
              id="nav-track-btn"
              onClick={onOpenTracking}
              className="hover:text-rose-600 transition-colors py-2 flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-stone-400" />
              <span>Track Order</span>
            </button>
            <button
              id="nav-story-btn"
              onClick={onNavigateToStory}
              className="hover:text-rose-600 transition-colors py-2"
            >
              The Ribbon Craft
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Toggle */}
            <div className="relative">
              {showSearchBar ? (
                <div className="flex items-center bg-stone-100 rounded-full px-3 py-1.5 border border-stone-300 w-44 sm:w-64 transition-all">
                  <Search className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search ribbon bouquets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-full text-stone-800 placeholder-stone-400"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearchBar(false);
                      setSearchQuery('');
                    }}
                    className="text-stone-400 hover:text-stone-600 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="search-toggle-btn"
                  onClick={() => setShowSearchBar(true)}
                  aria-label="Search bouquets"
                  className="p-2 text-stone-600 hover:text-rose-600 hover:bg-rose-50/60 rounded-full transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Quick Track Order (Icon button for mobile/compact) */}
            <button
              id="quick-track-btn"
              onClick={onOpenTracking}
              title="Track Order"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors border border-stone-200"
            >
              <Compass className="w-4 h-4 text-rose-500" />
              <span>Track Order</span>
            </button>

            {/* Cart Button with Count Badge */}
            <button
              id="cart-btn"
              onClick={onOpenCart}
              aria-label="View shopping cart"
              className="relative p-2.5 text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-rose-600 rounded-full px-1 shadow-sm animate-scale">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Customer Account Button / Dropdown */}
            {activeUser ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center text-[11px]">
                    {activeUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline max-w-[90px] truncate">{activeUser.name}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs text-stone-400 font-medium">Signed in as</p>
                      <p className="text-xs font-semibold text-stone-800 truncate">{activeUser.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{activeUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenTracking();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Package className="w-3.5 h-3.5 text-rose-500" />
                      My Orders & Status
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogoutUser();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-stone-100 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="sign-in-btn"
                onClick={onOpenAuth}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 px-3 py-2 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-stone-500" />
                <span>Customer Login</span>
              </button>
            )}

            {/* Owner Mode Indicator (Only visible when logged in as Owner) */}
            {isOwner && (
              <button
                id="owner-dashboard-active-btn"
                onClick={onOpenOwnerDashboard}
                className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Owner Dashboard</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-700 hover:text-rose-600 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <button
            onClick={() => {
              onNavigateToShop();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            🌸 Shop Ribbon Bouquets
          </button>
          <button
            onClick={() => {
              onOpenTracking();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            📦 Track My Order
          </button>
          <button
            onClick={() => {
              onNavigateToStory();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            🎀 The Ribbon Craft Story
          </button>

          {!activeUser && (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-center py-2.5 text-xs font-medium bg-rose-50 text-rose-800 rounded-lg"
            >
              Customer Signup / Login
            </button>
          )}

          {isOwner && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onOpenOwnerDashboard();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg shadow-sm"
              >
                Open Owner Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
