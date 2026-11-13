import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Flower2, Gift, Minus, Plus, Sparkles } from 'lucide-react';
import {
  estimateCustomBouquet, indiaDate, leadDays, minimumWrappers,
  type WrapperType,
} from '../../shared/customPricing';

interface CustomOrderSectionProps {
  onSubmit: (payload: CustomEnquiryPayload) => Promise<{ orderNumber: string }>;
}
export interface CustomEnquiryPayload {
  occasion: string;
  flowers: number;
  flowerColors: string;
  wrapperColor: string;
  wrapperType: WrapperType;
  wrappers: number;
  gypsy: boolean;
  glitter: boolean;
  extraNotes: string;
  deliveryDate: string;
  address: string;
  name: string;
  email: string;
  phone: string;
}

const occasions = ['Wedding', 'Anniversary', 'Birthday', 'Event', 'Other'];

export default function CustomOrderSection({ onSubmit }: CustomOrderSectionProps) {
  const [occasion, setOccasion] = useState('Wedding');
  const [flowers, setFlowers] = useState(25);
  const [flowerColors, setFlowerColors] = useState('');
  const [wrapperColor, setWrapperColor] = useState('');
  const [wrapperType, setWrapperType] = useState<WrapperType>('paper');
  const [wrappers, setWrappers] = useState(minimumWrappers(25));
  const [gypsy, setGypsy] = useState(false);
  const [glitter, setGlitter] = useState(false);
  const [extraNotes, setExtraNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const minWrappers = minimumWrappers(flowers);
  const dateMin = indiaDate(7);
  const quote = useMemo(() => estimateCustomBouquet({
    flowers, wrappers, wrapperType, gypsy, glitter, deliveryDate,
  }), [flowers, wrappers, wrapperType, gypsy, glitter, deliveryDate]);
  const adjustFlowers = (count: number) => {
    const next = Math.max(25, Math.min(100, Math.round(count / 5) * 5));
    // Keep manually added wrappers while automatically recalculating the baseline.
    const extraWrappers = Math.max(0, wrappers - minimumWrappers(flowers));
    setFlowers(next);
    setWrappers(Math.min(100, minimumWrappers(next) + extraWrappers));
  };

  async function send(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (flowers < 25 || flowers > 100 || flowers % 5 !== 0 || wrappers < minWrappers) {
      setError('Please review the flower and wrapper quantities.');
      return;
    }
    if (!deliveryDate || leadDays(deliveryDate) < 7) {
      setError('Please choose a delivery date at least 7 days from today.');
      return;
    }
    if (!flowerColors.trim() || !wrapperColor.trim() || !address.trim() || !name.trim() || !phone.trim()) {
      setError('Please complete all required fields.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const result = await onSubmit({
        occasion, flowers, flowerColors: flowerColors.trim(), wrapperColor: wrapperColor.trim(),
        wrapperType, wrappers, gypsy, glitter, extraNotes: extraNotes.trim(),
        deliveryDate, address: address.trim(), name: name.trim(),
        email: email.trim(), phone: phone.trim(),
      });
      setConfirmed(result.orderNumber);
    } catch (err: any) {
      setError(err?.message || 'We could not send your enquiry. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const fieldClass = 'mt-2 w-full border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-700 focus:ring-0';
  const labelClass = 'block text-[11px] uppercase tracking-[0.14em] text-stone-600';
  return (
    <section id="custom-builder" className="bg-[#F1ECE5] border-y border-stone-200/70 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-[10px] uppercase tracking-[0.32em] text-stone-500">Your celebration, your bouquet</p>
            <h2 className="mt-5 font-serif text-5xl leading-[1.1] tracking-tight text-stone-900 sm:text-6xl">
              Made for <span className="italic text-[#9E777C]">your moment.</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-stone-600">
              Weddings, anniversaries, birthdays and everything worth celebrating. Choose the details; our team will bring them together.
            </p>
            <div className="mt-10 border border-stone-300/80 bg-[#FCFAF7] p-7 sm:p-9">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">Approximate price</p>
                  <p className="mt-3 font-serif text-3xl tracking-tight text-stone-900 sm:text-4xl">
                    ₹{quote.minimum.toLocaleString('en-IN')} – ₹{quote.maximum.toLocaleString('en-IN')}
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-[#9E777C]" strokeWidth={1.5}/>
              </div>
              <div className="mt-5 h-1.5 bg-stone-100">
                <div className="h-full bg-[#B79499] transition-all duration-300" style={{ width: `${((flowers - 25) / 75) * 80 + 20}%` }}/>
              </div>
              <div className="mt-4 flex justify-between gap-4 text-xs text-stone-500">
                <span>{flowers} handmade flowers</span>
                <span>{wrappers} wrappers</span>
              </div>
              <p className="mt-5 text-xs leading-5 text-stone-500">
                Live estimate only, not a payment request. Final design, delivery and price will be confirmed by our team.
              </p>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-stone-500"><Gift className="h-4 w-4"/> No online payment required</p>
          </div>

          <div className="border border-stone-200/80 bg-[#FCFAF7] p-6 shadow-sm sm:p-10">
            {confirmed && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/60 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Custom enquiry received">
                <div className="w-full max-w-md border border-stone-200 bg-[#FCFAF7] px-8 py-12 text-center shadow-2xl">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-stone-700" strokeWidth={1.25}/>
                  <h3 className="mt-6 font-serif text-3xl text-stone-900">Enquiry received.</h3>
                  <p className="mt-4 text-sm leading-7 text-stone-600">
                    Our team will contact <strong>{name}</strong> at <strong>{phone}</strong> to discuss your custom order.
                  </p>
                  <p className="mt-4 text-xs text-stone-500">Reference: {confirmed}</p>
                  <button type="button" onClick={() => { setConfirmed(null); setError(''); }}
                    className="mt-8 bg-stone-900 px-8 py-3 text-xs uppercase tracking-widest text-white hover:bg-stone-700">Close</button>
                </div>
              </div>
            )}
            <form onSubmit={send}>
                <div className="flex items-center gap-3 border-b border-stone-200 pb-6">
                  <Flower2 className="h-6 w-6 text-[#9E777C]" strokeWidth={1.4}/>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Custom order</p>
                    <h3 className="mt-1 font-serif text-2xl text-stone-900">Create your arrangement</h3>
                  </div>
                </div>

                <div className="space-y-7 py-7">
                  <div>
                    <span className={labelClass}>Occasion</span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {occasions.map(value => (
                        <button key={value} type="button" onClick={() => setOccasion(value)}
                          className={`border px-3.5 py-2.5 text-xs transition ${occasion === value ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-500'}`}>
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className={labelClass}>Number of flowers · 25–100</span>
                    <div className="mt-3 flex items-center gap-5">
                      <button type="button" onClick={() => adjustFlowers(flowers - 5)} disabled={flowers <= 25} aria-label="Remove five flowers" className="border border-stone-300 p-3 disabled:opacity-30"><Minus size={15}/></button>
                      <span className="min-w-14 text-center font-serif text-3xl text-stone-900">{flowers}</span>
                      <button type="button" onClick={() => adjustFlowers(flowers + 5)} disabled={flowers >= 100} aria-label="Add five flowers" className="border border-stone-300 p-3 disabled:opacity-30"><Plus size={15}/></button>
                    </div>
                    <input aria-label="Choose flowers" className="mt-4 w-full accent-stone-800" type="range" min="25" max="100" step="5" value={flowers} onChange={e => adjustFlowers(Number(e.target.value))}/>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className={labelClass}>Flower colour(s) *
                      <input required maxLength={200} value={flowerColors} onChange={e => setFlowerColors(e.target.value)}
                        placeholder="e.g. Ivory, blush pink" className={fieldClass}/>
                    </label>
                    <label className={labelClass}>Wrapper colour *
                      <input required maxLength={120} value={wrapperColor} onChange={e => setWrapperColor(e.target.value)}
                        placeholder="e.g. Matte black" className={fieldClass}/>
                    </label>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className={labelClass}>Wrapper material
                      <select value={wrapperType} onChange={e => setWrapperType(e.target.value as WrapperType)} className={fieldClass}>
                        <option value="paper">Paper</option>
                        <option value="net">Net</option>
                      </select>
                    </label>
                    <div>
                      <span className={labelClass}>Number of wrappers · Min {minWrappers}</span>
                      <div className="mt-2 flex items-center gap-4">
                        <button type="button" onClick={() => setWrappers(n => Math.max(minWrappers,n-1))} disabled={wrappers <= minWrappers} className="border border-stone-300 p-3 disabled:opacity-30" aria-label="Remove wrapper"><Minus size={15}/></button>
                        <span className="min-w-8 text-center text-lg text-stone-900">{wrappers}</span>
                        <button type="button" onClick={() => setWrappers(n => Math.min(100,n+1))} className="border border-stone-300 p-3" aria-label="Add wrapper"><Plus size={15}/></button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={labelClass}>Decorations</span>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="flex cursor-pointer items-center gap-3 border border-stone-200 px-4 py-4 text-sm text-stone-800">
                        <input type="checkbox" checked={gypsy} onChange={e => setGypsy(e.target.checked)} className="h-4 w-4 accent-stone-900"/> Gypsy accents
                      </label>
                      <label className="flex cursor-pointer items-center gap-3 border border-stone-200 px-4 py-4 text-sm text-stone-800">
                        <input type="checkbox" checked={glitter} onChange={e => setGlitter(e.target.checked)} className="h-4 w-4 accent-stone-900"/> Glitter finish
                      </label>
                    </div>
                  </div>
                  <label className={labelClass}>Anything extra?
                    <textarea maxLength={1200} rows={3} value={extraNotes} onChange={e => setExtraNotes(e.target.value)}
                      placeholder="Your preferred style, card, wrapping or other details…" className={fieldClass}/>
                  </label>
                  <label className={labelClass}>Delivery date · 7 days notice *
                    <input required type="date" min={dateMin} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={fieldClass}/>
                  </label>
                </div>

                <div className="border-t border-stone-200 pt-7">
                  <p className="text-[10px] uppercase tracking-[0.23em] text-stone-500">Your contact details</p>
                  <h4 className="mt-2 font-serif text-2xl text-stone-900">Where should we reach you?</h4>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <label className={labelClass}>Full name *
                      <input required maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" className={fieldClass}/>
                    </label>
                    <label className={labelClass}>Phone number *
                      <input required type="tel" inputMode="tel" minLength={10} maxLength={20} autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Contact number" className={fieldClass}/>
                    </label>
                    <label className={labelClass}>Email · optional
                      <input type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" className={fieldClass}/>
                    </label>
                    <label className={labelClass}>Delivery location *
                      <input required maxLength={500} autoComplete="street-address" value={address} onChange={e=>setAddress(e.target.value)}
                        placeholder="Address, area and PIN code" className={fieldClass}/>
                    </label>
                  </div>
                </div>
                {error && <p className="mt-5 text-sm text-red-700" role="alert">{error}</p>}
                <button disabled={sending} type="submit" className="mt-8 flex w-full items-center justify-center gap-3 bg-stone-900 px-6 py-4 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-stone-700 disabled:opacity-50">
                  {sending ? 'Sending enquiry…' : 'Send Enquiry'} <ArrowRight size={17}/>
                </button>
                <p className="mt-4 text-center text-[11px] text-stone-500">Our team will call to confirm the design, availability and final price.</p>
              </form>
          </div>
        </div>
      </div>
    </section>
  );
}
