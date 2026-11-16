import { useState } from 'react';
import { ShoppingBag, Search, Compass, ShieldCheck, User as UserIcon, Menu, X, Instagram, Mail, LogOut, Package } from 'lucide-react';
import Logo from './Logo';
import WhatsAppIcon from './WhatsAppIcon';
import { UserAccount, StoreSettings } from '../types';
import type { ThemeId } from '../../shared/siteEditor';

interface NavbarProps {
  theme?: ThemeId;
  storeSettings: StoreSettings;
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
  theme = 'default',
  storeSettings,
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
    <header className="jb-nav-surface sticky top-0 z-40 border-b border-stone-200/80 backdrop-blur-md transition-all" data-nav-theme={theme}>
      {theme !== 'default' && (
        <div className="jb-navbar-festive-details pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {theme === 'valentines' && (
            <svg className="jb-valentine-nav-ribbon" viewBox="0 0 240 80" fill="none"
              xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="val-ribbon" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#FFD1CE"/><stop offset=".42" stopColor="#AD354F"/>
                  <stop offset=".68" stopColor="#71162E"/><stop offset="1" stopColor="#F5A8AD"/>
                </linearGradient>
              </defs>
              <path d="M37 26 C19 -3 2 4 8 32 C14 57 39 43 54 36 C31 66 12 83 0 80 C36 58 58 43 72 39
                C94 54 119 65 162 67 C125 49 92 29 73 31 C95 12 112 -6 121 2 C126 16 113 28 92 38
                C114 22 143 25 178 23" stroke="url(#val-ribbon)" strokeWidth="9" strokeLinecap="round"
                strokeLinejoin="round" opacity=".75"/>
              <path d="M59 24 Q76 33 65 44 Q47 40 59 24Z" fill="#EBA9A8" opacity=".85"/>
            </svg>
          )}
          {theme === 'puja' && <><span className="jb-nav-ornament jb-nav-ornament-a">✳</span><span className="jb-nav-ornament jb-nav-ornament-b">✦</span></>}
          {theme === 'eid' && <><span className="jb-nav-ornament jb-nav-ornament-a">☾</span><span className="jb-nav-ornament jb-nav-ornament-b">✦</span></>}
          {theme === 'winter' && <><span className="jb-nav-ornament jb-nav-ornament-a">❄</span><span className="jb-nav-ornament jb-nav-ornament-b">✧</span></>}
        </div>
      )}
      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="jb-nav-inner flex h-[68px] items-center justify-between gap-2 sm:h-20">
          {/* Brand Logo */}
          <div onClick={onNavigateToShop} className="jb-nav-brand min-w-0 shrink cursor-pointer">
            <Logo size="md" logoUrl={storeSettings.logoUrl} brandName={storeSettings.storeName || "Jame Bouquets"} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-stone-600">
            <button
              id="nav-shop-btn"
              onClick={onNavigateToShop}
              className="hover:text-rose-600 transition-colors py-2"
            >
              Shop Products
            </button>
            <button
              onClick={onNavigateToBuilder}
              className="hover:text-rose-700 transition-colors py-2"
            >
              Custom Orders
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
              Our Craft
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="jb-nav-actions flex shrink-0 items-center gap-1 sm:gap-4">
            {/* Search Toggle */}
            <div className="relative">
              {showSearchBar ? (
                <div className="flex items-center bg-[#F5F1EC] rounded-lg px-3 py-1.5 border border-stone-300 w-44 sm:w-64 transition-all">
                  <Search className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products..."
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
                  aria-label="Search products"
                  className="p-2 text-stone-600 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"
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
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-stone-800 rounded-full px-1 shadow-sm animate-scale">
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
                <span>Sign In</span>
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
                <span className="hidden sm:inline">Dashboard</span>
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
        <div className="jb-mobile-menu lg:hidden border-b border-stone-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <button
            onClick={() => {
              onNavigateToShop();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            Shop Products
          </button>
          <button
            onClick={() => {
              onNavigateToBuilder();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            Custom Event Bouquets
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
            Our Craft
          </button>

          <div className="flex items-center gap-3 border-t border-stone-100 pt-4" aria-label="Jame Bouquets social media">
            <a href="https://www.instagram.com/jamebouquets" target="_blank" rel="noopener noreferrer"
              aria-label="Instagram: Jame Bouquets" className="inline-flex h-11 w-11 items-center justify-center border border-stone-200 text-stone-800 hover:border-stone-400">
              <Instagram className="h-5 w-5" strokeWidth={1.8}/>
            </a>
            <a href="https://whatsapp.com/channel/0029Vb8zmzh5kg70106NvN1i" target="_blank" rel="noopener noreferrer"
              aria-label="Jame Bouquets WhatsApp channel" className="inline-flex h-11 w-11 items-center justify-center border border-stone-200 text-stone-800 hover:border-stone-400">
              <WhatsAppIcon className="h-5 w-5"/>
            </a>
            <a href="mailto:jamebouquets@gmail.com" aria-label="Email Jame Bouquets"
              className="inline-flex h-11 w-11 items-center justify-center border border-stone-200 text-stone-800 hover:border-stone-400">
              <Mail className="h-5 w-5" strokeWidth={1.8}/>
            </a>
          </div>

          {!activeUser && (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-center py-2.5 text-xs font-medium bg-rose-50 text-rose-800 rounded-lg"
            >
              Sign In / Join
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
