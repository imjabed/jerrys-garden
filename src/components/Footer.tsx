import { Instagram, Mail, MapPin, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import WhatsAppIcon from './WhatsAppIcon';
import { StoreSettings } from '../types';
import type { PolicyType } from './StorePolicies';
import type { SiteContent, ThemeId, ValentinesDesign, ThemeExtras } from '../../shared/siteEditor';
import { DEFAULT_SITE_CONTENT } from '../../shared/siteEditor';

interface FooterProps {
  storeSettings: StoreSettings;
  isOwner?: boolean;
  onOpenOwnerLogin: () => void;
  onOpenTracking: () => void;
  onNavigateToBuilder?: () => void;
  onNavigateToShop: () => void;
  onOpenPolicy: (policy: PolicyType) => void;
  content?: SiteContent['footer'];
  theme?: ThemeId;
  valentines?: ValentinesDesign;
  themeExtras?: ThemeExtras;
}

export default function Footer({
  storeSettings,
  isOwner = false,
  onOpenOwnerLogin,
  onOpenTracking,
  onNavigateToShop,
  onOpenPolicy,
  content = DEFAULT_SITE_CONTENT.footer,
  theme = 'default', valentines, themeExtras,
}: FooterProps) {
  const valentineMode = theme === 'valentines' && Boolean(valentines);
  const skylineSource: Record<ThemeId, string> = {
    default: '', valentines: '/valentines/park-couple-silhouette.svg',
    winter: '/seasonal/winter-night-silhouette.svg',
    eid: '/seasonal/eid-moonlit-mosque.svg',
    puja: '/seasonal/puja-bengali-pandal.svg',
  };
  const sceneEnabled = themeExtras?.footerSceneEnabled && (!valentineMode || valentines?.footerSceneEnabled !== false);
  const sceneUrl = valentineMode
    ? (valentines?.footerSceneUrl || themeExtras?.footerSceneUrl || skylineSource.valentines)
    : (themeExtras?.footerSceneUrl || skylineSource[theme]);
  const footerTagline = valentineMode ? valentines?.footerTagline : themeExtras?.footerTagline;
  const footerContent = valentineMode && valentines
    ? { description: valentines.footerDescription, orderNote: valentines.footerOrderNote }
    : content;
  return (
    <footer className={`jb-footer-surface text-stone-300 border-t border-stone-800 pb-12 ${sceneEnabled ? 'jb-footer-with-scene' : 'pt-16'} ${valentineMode ? 'jb-valentine-footer' : ''}`}>
      {sceneEnabled && sceneUrl && (
        <div className={`jb-festival-scene relative isolate overflow-hidden jb-footer-scene-${theme}`}
          aria-hidden="true">
          <div className="jb-festival-sky absolute inset-0"/>
          <div className="jb-festival-silhouette absolute inset-0"
            style={{
              backgroundColor: valentineMode
                ? (valentines?.colors.silhouette || themeExtras?.footerSceneColor)
                : themeExtras?.footerSceneColor,
              maskImage: `url("${sceneUrl}")`,
              WebkitMaskImage: `url("${sceneUrl}")`,
            }}/>
        </div>
      )}
      {sceneEnabled && footerTagline && (
        <p className="jb-festival-footer-tagline mx-auto max-w-3xl px-6 pt-8 text-center font-serif text-lg italic tracking-wide sm:text-2xl">
          {footerTagline}
        </p>
      )}
      <div className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${sceneEnabled ? 'pt-10 sm:pt-14' : ''}`}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand Col (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="[&_.font-serif]:!text-[#FAF8F5] [&_p]:!text-stone-400 [&_.text-stone-900]:!text-[#FAF8F5]">
              <Logo size="md" showSubtitle={true} logoUrl={storeSettings.logoUrl} brandName={storeSettings.storeName || "Jame Bouquets"} />
            </div>
            
            <p className="text-xs text-stone-400 leading-relaxed">
              {footerContent.description}
            </p>

            <p className="text-[11px] tracking-wide text-stone-400">{footerContent.orderNote}</p>
            <nav aria-label="Connect with Jame Bouquets" className="flex items-center gap-3 pt-3">
              <a href="https://www.instagram.com/jamebouquets" target="_blank" rel="noopener noreferrer"
                aria-label="Follow Jame Bouquets on Instagram" title="Instagram"
                className="inline-flex h-11 w-11 items-center justify-center border border-stone-600 text-stone-200 transition-colors hover:border-stone-300 hover:bg-stone-800">
                <Instagram className="h-5 w-5" strokeWidth={1.7}/>
              </a>
              <a href="https://whatsapp.com/channel/0029Vb8zmzh5kg70106NvN1i" target="_blank" rel="noopener noreferrer"
                aria-label="Join Jame Bouquets WhatsApp channel" title="WhatsApp Channel"
                className="inline-flex h-11 w-11 items-center justify-center border border-stone-600 text-stone-200 transition-colors hover:border-stone-300 hover:bg-stone-800">
                <WhatsAppIcon className="h-5 w-5"/>
              </a>
              <a href="mailto:jamebouquets@gmail.com" aria-label="Email Jame Bouquets" title="Email"
                className="inline-flex h-11 w-11 items-center justify-center border border-stone-600 text-stone-200 transition-colors hover:border-stone-300 hover:bg-stone-800">
                <Mail className="h-5 w-5" strokeWidth={1.7}/>
              </a>
            </nav>
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
                  Browse Products
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
                <span className="text-stone-400">Berhampore deliveries · by confirmation</span>
              </li>
            </ul>
            <div className="border-t border-stone-700/70 pt-4">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-300">Customer information</p>
              <div className="flex flex-col items-start gap-3 text-xs text-stone-400">
                {([
                  ['delivery', 'Delivery & ordering'],
                  ['returns', 'Cancellations & concerns'],
                  ['privacy', 'Privacy notice'],
                  ['terms', 'Ordering terms'],
                ] as const).map(([policy, label]) => (
                  <button key={policy} type="button" onClick={() => onOpenPolicy(policy)}
                    className="text-left underline-offset-4 hover:text-white hover:underline">{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Care & Assurance (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Ribbon Flower Care
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>• Keep in room temperature away from direct rain</li>
              <li>• No watering needed for ribbon flowers</li>
              <li>• Gentle dusting with dry soft brush if required</li>
              <li>• Keep away from flames and unattended young children</li>
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
                {/^\+?[0-9\s()-]{10,20}$/.test(storeSettings.phone || '') ?
                  <a href={`tel:${storeSettings.phone.replace(/[^+0-9]/g, '')}`} className="hover:text-white">{storeSettings.phone}</a> :
                  <span>Support available after order confirmation</span>}
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {/^\+?[0-9\s()-]{10,20}$/.test(storeSettings.whatsapp || '') ?
                  <a href={`https://wa.me/${storeSettings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp our team</a> :
                  <button type="button" onClick={onOpenTracking} className="hover:text-white">Track or enquire about an order</button>}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright & Owner Portal trigger (Invisible unless logged in as Owner) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© 2026 Jame Bouquets · Handmade in Berhampore</p>

          <div className="flex items-center gap-4">
            {isOwner && <button
              onClick={onOpenOwnerLogin}
              className="text-stone-500 hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title={isOwner ? "Open Owner Dashboard" : "Owner Login"}
              aria-label={isOwner ? "Open Owner Dashboard" : "Owner Login"}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>}
          </div>
        </div>

      </div>
    </footer>
  );
}
