import CustomerCopy from './CustomerCopy';
import { useEffect, useMemo, useRef, useState } from 'react';
import { suggestProducts } from '../services/productSuggestions';
import { ShoppingBag, Search, ShieldCheck, User as UserIcon, Menu, X, Instagram, Mail, LogOut, Package } from 'lucide-react';
import Logo from './Logo';
import WhatsAppIcon from './WhatsAppIcon';
import { UserAccount, StoreSettings, RibbonBouquet } from '../types';
import type { ThemeId, ThemeExtras, NavigationLabels } from '../../shared/siteEditor';

interface NavbarProps {
  theme?: ThemeId;
  themeExtras?: ThemeExtras;
  navigationLabels?: NavigationLabels;
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
  products?: RibbonBouquet[];
  cartIconUrl?: string;
  onSelectProduct?: (product: RibbonBouquet) => void;
  onSearchSubmit?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({
  theme = 'default',
  themeExtras,
  navigationLabels,
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
  products = [], cartIconUrl = '', onSelectProduct, onSearchSubmit,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [activeSuggestion,setActiveSuggestion]=useState(-1);
  const searchRef=useRef<HTMLDivElement>(null),searchToggle=useRef<HTMLButtonElement>(null),searchInput=useRef<HTMLInputElement>(null);
  const suggestions=useMemo(()=>suggestProducts(products,searchQuery),[products,searchQuery]);
  const closeSearch=(clear=false)=>{setShowSearchBar(false);setActiveSuggestion(-1);if(clear)setSearchQuery('');};
  const selectProduct=(product:RibbonBouquet)=>{closeSearch(true);onSelectProduct?.(product);};
  useEffect(()=>{setActiveSuggestion(-1);},[searchQuery]);
  useEffect(()=>{if(!showSearchBar)return;searchInput.current?.focus();const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!searchRef.current?.contains(e.target)&&!searchToggle.current?.contains(e.target)){setShowSearchBar(false);setSearchQuery('');}};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[showSearchBar,setSearchQuery]);

  return (
    <header className="jb-nav-surface sticky top-0 z-40 border-b border-stone-200/80 backdrop-blur-md transition-all" data-nav-theme={theme}>
      {themeExtras?.navImageUrl && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <picture>
            {themeExtras.navMobileImageUrl && <source media="(max-width: 680px)" srcSet={themeExtras.navMobileImageUrl}/>}
            <img src={themeExtras.navImageUrl} alt="" loading="eager"
              className="jb-nav-photo h-full w-full object-cover"
              style={{
                '--jb-nav-desktop-crop': `${themeExtras.navImageCrop.x}% ${themeExtras.navImageCrop.y}%`,
                '--jb-nav-mobile-crop': `${themeExtras.navMobileCrop.x}% ${themeExtras.navMobileCrop.y}%`,
                opacity: themeExtras.navImageOpacity,
              } as import('react').CSSProperties}
              onError={event => { event.currentTarget.style.display = 'none'; }}/>
          </picture>
          <div className="jb-nav-photo-scrim absolute inset-0"/>
        </div>
      )}
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
            <Logo editableBrand size="md" logoUrl={storeSettings.logoUrl} brandName={storeSettings.storeName || "Jame Bouquets"} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-stone-600">
            <button
              id="nav-shop-btn"
              onClick={onNavigateToShop}
              className="hover:text-rose-600 transition-colors py-2"
            >
              <CustomerCopy id="navButton.0" fallback=<CustomerCopy id="navButton.0" fallback={navigationLabels?.shop || 'Shop Products'}/>/>
            </button>
            <button
              onClick={onNavigateToBuilder}
              className="hover:text-rose-700 transition-colors py-2"
            >
              <CustomerCopy id="navButton.1" fallback={navigationLabels?.custom || 'Custom Orders'}/>
            </button>
            <button
              id="nav-track-btn"
              onClick={onOpenTracking}
              className="hover:text-rose-600 transition-colors py-2 flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-stone-400" />
              <span><CustomerCopy id="navButton.2" fallback={navigationLabels?.track || 'Track Order'}/></span>
            </button>
            <button
              id="nav-story-btn"
              onClick={onNavigateToStory}
              className="hover:text-rose-600 transition-colors py-2"
            >
              <CustomerCopy id="navButton.3" fallback=<CustomerCopy id="navButton.3" fallback={navigationLabels?.story || 'Our Craft'}/>/>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="jb-nav-actions flex shrink-0 items-center gap-1 sm:gap-4">
            <button ref={searchToggle} id="search-toggle-btn" type="button" onClick={()=>{if(showSearchBar)closeSearch(true);else{setShowSearchBar(true);setMobileMenuOpen(false);setUserDropdownOpen(false);}}} aria-label="Search products" aria-expanded={showSearchBar} aria-controls="jb-search-panel" className="p-2 text-stone-600 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"><Search className="w-5 h-5"/></button>
            {/* Cart Button with Count Badge */}
            <button
              id="cart-btn"
              onClick={onOpenCart}
              aria-label="View shopping cart"
              className="relative p-2.5 text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
            >
              {cartIconUrl?<img key={cartIconUrl} src={cartIconUrl} alt="" className="w-6 h-6 object-contain" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextElementSibling?.classList.remove('hidden');}}/>:null}<ShoppingBag key={'default-'+cartIconUrl} className={'w-5 h-5'+(cartIconUrl?' hidden':'')}/>
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
                  type="button"
                  aria-expanded={userDropdownOpen}
                  aria-label="Account options"
                  onClick={() => { setUserDropdownOpen(current => !current); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center text-[11px]">
                    {activeUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline max-w-[90px] truncate">{activeUser.name}</span>
                </button>

                {userDropdownOpen && (
                  <div className="jb-customer-dropdown absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-2 text-stone-800 shadow-xl z-50">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs text-stone-400 font-medium"><CustomerCopy id={"nav.0"} fallback={"Signed in as"}/></p>
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
                      <CustomerCopy id="nav.myOrders" fallback="My Orders & Status"/>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogoutUser();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-stone-100 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <CustomerCopy id="nav.signOut" fallback="Sign Out"/>
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
                <span><CustomerCopy id="navButton.4" fallback={navigationLabels?.signIn || 'Sign In'}/></span>
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
                <span className="hidden sm:inline"><CustomerCopy id={"nav.1"} fallback={"Dashboard"}/></span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle"
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-controls="jb-mobile-menu"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => { setMobileMenuOpen(current => !current); setUserDropdownOpen(false); }}
              className="lg:hidden p-2 text-stone-700 hover:text-rose-600 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {showSearchBar&&<div id="jb-search-panel" ref={searchRef} className="absolute left-0 right-0 top-full z-50 mx-auto w-full max-w-xl bg-white text-stone-900 shadow-xl border border-stone-200 rounded-b-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2">
          <Search className="w-4 h-4 shrink-0 text-stone-500"/>
          <input ref={searchInput} type="search" role="combobox" aria-label="Search products" aria-autocomplete="list" aria-expanded={!!searchQuery.trim()} aria-controls="jb-search-results" aria-activedescendant={activeSuggestion>=0&&suggestions[activeSuggestion]?'jb-search-option-'+activeSuggestion:undefined} placeholder="Search products..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" onKeyDown={e=>{
            if(e.key==='Escape'){e.preventDefault();closeSearch(true);searchToggle.current?.focus();}
            else if(e.key==='ArrowDown'&&suggestions.length){e.preventDefault();setActiveSuggestion(i=>(i+1)%suggestions.length);}
            else if(e.key==='ArrowUp'&&suggestions.length){e.preventDefault();setActiveSuggestion(i=>i<=0?suggestions.length-1:i-1);}
            else if(e.key==='Enter'){e.preventDefault();if(activeSuggestion>=0&&suggestions[activeSuggestion])selectProduct(suggestions[activeSuggestion]);else if(searchQuery.trim()){closeSearch();onSearchSubmit?.();}}
          }}/>
          <button type="button" aria-label="Close search" onClick={()=>{closeSearch(true);searchToggle.current?.focus();}} className="p-1 text-stone-500"><X size={18}/></button>
        </div>
        {searchQuery.trim()&&<><div role="listbox" id="jb-search-results" aria-label="Suggested products" className="mt-2 max-h-[50vh] overflow-y-auto">
          {suggestions.map((p,i)=><button key={p.id} id={'jb-search-option-'+i} role="option" aria-selected={i===activeSuggestion} type="button" onPointerEnter={()=>setActiveSuggestion(i)} onClick={()=>selectProduct(p)} className={'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left '+(i===activeSuggestion?'bg-rose-50':'hover:bg-stone-50')}>
            {p.imageUrl&&<img src={p.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded object-cover bg-stone-100"/>}
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.title}</span><span className="block truncate text-xs text-stone-500">{p.category}{!p.inStock?' · Out of stock':''}</span></span><span className="text-xs font-semibold">₹{p.price}</span>
          </button>)}
          {!suggestions.length&&<p role="status" className="px-2 py-3 text-sm text-stone-500">No matching products.</p>}
        </div><button type="button" onClick={()=>{closeSearch();onSearchSubmit?.();}} className="mt-2 w-full border-t border-stone-100 pt-3 text-left text-sm font-medium text-rose-700">See all results for “{searchQuery.trim()}”</button></>}
      </div>}
      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="jb-mobile-menu" className="jb-mobile-menu lg:hidden border-b border-stone-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <button
            onClick={() => {
              onNavigateToShop();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            {navigationLabels?.shop || 'Shop Products'}
          </button>
          <button
            onClick={() => {
              onNavigateToBuilder();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            <CustomerCopy id="navButton.1" fallback={navigationLabels?.custom || 'Custom Event Bouquets'}/>
          </button>
          <button
            onClick={() => {
              onOpenTracking();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            <CustomerCopy id="navButton.2" fallback={navigationLabels?.track || 'Track My Order'}/>
          </button>
          <button
            onClick={() => {
              onNavigateToStory();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-stone-800 hover:text-rose-600 border-b border-stone-100"
          >
            {navigationLabels?.story || 'Our Craft'}
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
              <CustomerCopy id="navButton.4" fallback={navigationLabels?.signIn || 'Sign In'}/> / Join
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
