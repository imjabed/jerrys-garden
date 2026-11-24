import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { SiteContent } from '../../shared/siteEditor';

export type PolicyType = 'delivery' | 'returns' | 'privacy' | 'terms';
const titles: Record<PolicyType, string> = {
  delivery: 'Delivery & ordering',
  returns: 'Cancellations & concerns',
  privacy: 'Privacy notice',
  terms: 'Ordering terms',
};

export default function StorePolicies({
  selected, onClose, onSelect, policyCopy,
}: {
  selected: PolicyType;
  onClose: () => void;
  onSelect: (policy: PolicyType) => void;
  policyCopy?: SiteContent['policyCopy'];
}) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="policy-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/65 p-3 sm:p-6">
      <div className="jb-customer-panel flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden bg-[#FCFAF7] text-stone-800 shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5 sm:px-9">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Jame Bouquets · Customer information</p>
            <h2 id="policy-title" className="mt-2 font-serif text-3xl font-normal">{titles[selected]}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close policies"
            className="rounded-sm p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900">
            <X className="h-5 w-5"/>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-stone-200 px-5 py-3 sm:px-9">
          {(Object.keys(titles) as PolicyType[]).map(key => (
            <button type="button" key={key} onClick={() => onSelect(key)}
              className={`shrink-0 px-3 py-2 text-xs transition-colors ${selected === key ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
              {titles[key]}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto px-6 py-7 text-sm leading-7 text-stone-700 sm:px-9">
          {policyCopy?.[selected]?.trim() ? <div className="whitespace-pre-wrap">{policyCopy[selected]}</div> : null}
          {!policyCopy?.[selected]?.trim() && selected === 'delivery' && (
            <div className="space-y-5">
              <p><strong>Where we deliver:</strong> We currently accept deliveries within Berhampore, Murshidabad, West Bengal only. We verify that your delivery location is serviceable before confirming an order.</p>
              <p><strong>How an order works:</strong> Submit your selected products and contact details without paying online. Our team will contact you to confirm the arrangement, availability, preferred date, address, final amount and payment arrangements.</p>
              <p><strong>Timing:</strong> A preferred delivery date is a request, not a guaranteed delivery slot. Custom event bouquets require at least seven days' notice. Same-day delivery is not guaranteed.</p>
              <p>For questions about a pending order, use the order-tracking reference or email <a className="underline underline-offset-2" href="mailto:jamebouquets@gmail.com">jamebouquets@gmail.com</a>.</p>
            </div>
          )}
          {!policyCopy?.[selected]?.trim() && selected === 'returns' && (
            <div className="space-y-5">
              <p><strong>Cancellations:</strong> If you need to change or cancel an order, contact us with the order reference as early as possible. Whether a change can be made depends on whether we have begun making or arranging your order.</p>
              <p><strong>Damaged or incorrect items:</strong> If something arrives damaged or not as agreed, contact us promptly with your order reference, a description and photographs where possible. We will review the issue and discuss an appropriate resolution.</p>
              <p><strong>Made-to-order pieces:</strong> Ribbon colours, wrapping and handmade arrangements may be prepared specifically for you. Please confirm your preferences carefully when our team contacts you. Nothing here limits any rights you may have under applicable law.</p>
              <p>Reach us at <a className="underline underline-offset-2" href="mailto:jamebouquets@gmail.com">jamebouquets@gmail.com</a>.</p>
            </div>
          )}
          {!policyCopy?.[selected]?.trim() && selected === 'privacy' && (
            <div className="space-y-5">
              <p>We collect details you choose to provide when registering, placing an order or making an enquiry, such as your name, email, phone number, delivery address, product choices and order history.</p>
              <p>We use these details to verify accounts, process and follow up on orders, send confirmations, provide customer support and verify genuine product reviews. Public reviews show a shortened display name, not a customer's email address.</p>
              <p>We use service providers for website hosting, database storage, email delivery and product-image hosting. Session cookies support account sign-in and browser storage helps retain your shopping bag.</p>
              <p>To ask about information associated with your account, request a correction or raise a privacy concern, contact <a className="underline underline-offset-2" href="mailto:jamebouquets@gmail.com">jamebouquets@gmail.com</a>.</p>
            </div>
          )}
          {!policyCopy?.[selected]?.trim() && selected === 'terms' && (
            <div className="space-y-5">
              <p>Jame Bouquets offers handmade ribbon bouquets, keepsakes and gifts. Submitting an order request does not take payment online and does not guarantee the availability of a particular item or delivery date.</p>
              <p>Our team confirms availability, customization, delivery details, final price and payment arrangements before proceeding. Custom event price ranges are indicative estimates, not confirmed totals.</p>
              <p>Because products are crafted by hand, small differences in arrangement and finish may occur. We aim to describe every product accurately; please ask our team about a particular colour or detail before confirming.</p>
              <p>For changes, concerns or questions, contact <a className="underline underline-offset-2" href="mailto:jamebouquets@gmail.com">jamebouquets@gmail.com</a> with your order number.</p>
            </div>
          )}
          <p className="mt-9 border-t border-stone-200 pt-4 text-xs text-stone-500">Jame Bouquets · Berhampore, Murshidabad, West Bengal</p>
        </div>
      </div>
    </div>
  );
}
