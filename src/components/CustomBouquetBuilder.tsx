import { useState } from 'react';
import { Sparkles, Check, Heart, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';
import { RibbonBouquet } from '../types';

interface CustomBouquetBuilderProps {
  onAddCustomBouquet: (bouquet: RibbonBouquet, customRibbonColor: string, customWrapping: string, giftNote?: string) => void;
  onInstantCheckout: (bouquet: RibbonBouquet, customRibbonColor: string, customWrapping: string, giftNote?: string) => void;
}

const FLOWER_TYPES = [
  {
    id: 'satin_roses',
    name: 'French Satin Ribbon Roses',
    description: 'Tightly rolled high-density satin with delicate folded petals',
    icon: '🌹',
    baseMultiplier: 1,
    img: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'ribbon_tulips',
    name: 'Korean Ribbon Tulips',
    description: 'Smooth rounded satin tulip cups with wire-shaped silk stems',
    icon: '🌷',
    baseMultiplier: 1.05,
    img: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'ribbon_peonies',
    name: 'Fluffy Ribbon Peonies',
    description: 'Multi-layer ruffled petals creating lavish, voluminous blooms',
    icon: '🌸',
    baseMultiplier: 1.15,
    img: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'botanical_mix',
    name: 'Artisan Garden Mix',
    description: 'A harmonious blend of satin roses, baby ribbon buds & leaves',
    icon: '💐',
    baseMultiplier: 1.1,
    img: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80',
  },
];

const FLOWER_COUNTS = [
  { count: 9, label: '9 Blooms', subtitle: 'Petite Table Keepsake', price: 599 },
  { count: 18, label: '18 Blooms', subtitle: 'Classic Signature Bouquet', price: 999 },
  { count: 27, label: '27 Blooms', subtitle: 'Luxe Celebration Display', price: 1449 },
  { count: 36, label: '36 Blooms', subtitle: 'Grand Royal Statement', price: 1899 },
];

const PALETTES = [
  { name: 'Blush & Champagne', hex: ['#f43f5e', '#fef08a', '#fff1f2'], desc: 'Warm romantic pastel' },
  { name: 'Royal Sapphire & Silver', hex: ['#1e40af', '#e2e8f0', '#0f172a'], desc: 'Regal and striking' },
  { name: 'Sage Green & Ivory White', hex: ['#84cc16', '#f8fafc', '#4d7c0f'], desc: 'Calm botanical aesthetic' },
  { name: 'Crimson Velvet & Wine', hex: ['#991b1b', '#7f1d1d', '#fecdd3'], desc: 'Passionate deep reds' },
  { name: 'Lilac & Lavender Mist', hex: ['#c084fc', '#e9d5ff', '#6b21a8'], desc: 'Enchanting fairytale purple' },
  { name: 'Peach Apricot & Cream', hex: ['#fdba74', '#fed7aa', '#ffffff'], desc: 'Sunny and joyful warmth' },
];

const WRAPPINGS = [
  { name: 'Korean Matte Blush & Gold Foil Trim', desc: 'Waterproof luxury floral wrapping' },
  { name: 'Frosted Translucent Mist Wrap', desc: 'Delicate ethereal frosted aesthetic' },
  { name: 'Vintage Ribbed Kraft & Velvet Tie', desc: 'Rustic artisan boutique feel' },
  { name: 'Midnight Noir with Gold Silk Bow', desc: 'High-contrast dramatic luxury' },
];

const ACCENTS = [
  { name: 'Pearl Pin Centers on each flower', price: 0 },
  { name: 'Sparkling Crystal Dew Drop Pins', price: 99 },
  { name: 'Gold Glitter Edge Ribbon Piping', price: 149 },
  { name: 'Organza Butterfly Ribbon Charms', price: 129 },
];

export default function CustomBouquetBuilder({ onAddCustomBouquet, onInstantCheckout }: CustomBouquetBuilderProps) {
  const [selectedType, setSelectedType] = useState(FLOWER_TYPES[0]);
  const [selectedCount, setSelectedCount] = useState(FLOWER_COUNTS[1]); // 18 blooms
  const [selectedPalette, setSelectedPalette] = useState(PALETTES[0]);
  const [selectedWrapping, setSelectedWrapping] = useState(WRAPPINGS[0]);
  const [selectedAccent, setSelectedAccent] = useState(ACCENTS[0]);
  const [giftNote, setGiftNote] = useState('');
  const [recipientName, setRecipientName] = useState('');

  // Calculate customized price
  const calculatedPrice = Math.round(selectedCount.price * selectedType.baseMultiplier) + selectedAccent.price;

  const buildBouquetObject = (): RibbonBouquet => {
    return {
      id: `custom-${Date.now()}`,
      title: `Custom ${selectedType.name} (${selectedCount.label})`,
      price: calculatedPrice,
      originalPrice: Math.round(calculatedPrice * 1.25),
      imageUrl: selectedType.img,
      description: `Custom handcrafted arrangement with ${selectedCount.count} ${selectedType.name} in ${selectedPalette.name} colorway. Wrapped in ${selectedWrapping.name} with ${selectedAccent.name}.`,
      ribbonColors: [selectedPalette.name],
      ribbonMaterial: 'Double-faced Satin',
      flowerCount: selectedCount.count,
      category: 'Celebration',
      inStock: true,
      createdAt: new Date().toISOString(),
    };
  };

  const handleAddToCart = () => {
    const customBouquet = buildBouquetObject();
    const finalNote = recipientName ? `To: ${recipientName} — ${giftNote}` : giftNote;
    onAddCustomBouquet(customBouquet, selectedPalette.name, selectedWrapping.name, finalNote || undefined);
  };

  const handleBuyNow = () => {
    const customBouquet = buildBouquetObject();
    const finalNote = recipientName ? `To: ${recipientName} — ${giftNote}` : giftNote;
    onInstantCheckout(customBouquet, selectedPalette.name, selectedWrapping.name, finalNote || undefined);
  };

  return (
    <section id="custom-builder" className="py-16 bg-gradient-to-b from-[#FAF8F5] via-rose-50/30 to-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Interactive Custom Ribbon Studio</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            Design Your Bespoke Ribbon Bouquet
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600">
            Customize every folded flower, satin color tone, Korean paper wrap, and personalized greeting. Hand-crafted specifically for your loved one.
          </p>
        </div>

        {/* Builder Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Customization Steps (7 cols) */}
          <div className="lg:col-span-7 space-y-8 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
            
            {/* Step 1: Ribbon Flower Type */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Step 1 • Ribbon Flower Type
                </span>
                <span className="text-xs text-stone-400 font-medium">Select your fold style</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FLOWER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex items-start gap-3 cursor-pointer ${
                      selectedType.id === type.id
                        ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-1 ring-rose-600'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/30'
                    }`}
                  >
                    <span className="text-2xl p-1 bg-white rounded-xl shadow-xs shrink-0">{type.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-900">{type.name}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{type.description}</p>
                    </div>
                    {selectedType.id === type.id && (
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Flower Count */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Step 2 • Size & Bloom Count
                </span>
                <span className="text-xs text-stone-400 font-medium">How many ribbon flowers?</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FLOWER_COUNTS.map((cnt) => (
                  <button
                    key={cnt.count}
                    type="button"
                    onClick={() => setSelectedCount(cnt)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedCount.count === cnt.count
                        ? 'border-rose-600 bg-rose-50/80 text-rose-950 ring-1 ring-rose-600'
                        : 'border-stone-200 bg-stone-50/40 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <span className="block text-sm font-bold">{cnt.label}</span>
                    <span className="block text-[10px] text-stone-500 mt-0.5 line-clamp-1">{cnt.subtitle}</span>
                    <span className="block text-xs font-semibold text-rose-700 mt-1">₹{cnt.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Color Palette */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Step 3 • Satin Ribbon Color Scheme
                </span>
                <span className="text-xs text-stone-400 font-medium">Hand-dyed ribbon tones</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PALETTES.map((pal) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => setSelectedPalette(pal)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPalette.name === pal.name
                        ? 'border-rose-600 bg-rose-50/60 ring-1 ring-rose-600'
                        : 'border-stone-200 bg-stone-50/30 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {pal.hex.map((h, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-stone-200 shadow-xs"
                          style={{ backgroundColor: h }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-stone-900 leading-tight">{pal.name}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{pal.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Wrapping Style */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Step 4 • Korean Floral Wrap & Ribbons
                </span>
              </div>
              <div className="space-y-2">
                {WRAPPINGS.map((wrap) => (
                  <label
                    key={wrap.name}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedWrapping.name === wrap.name
                        ? 'border-rose-600 bg-rose-50/40 text-stone-900'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="custom_wrapping"
                        checked={selectedWrapping.name === wrap.name}
                        onChange={() => setSelectedWrapping(wrap)}
                        className="text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <div>
                        <span className="text-xs font-bold block">{wrap.name}</span>
                        <span className="text-[11px] text-stone-500 block">{wrap.desc}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-600">Included</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 5: Artisan Accents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Step 5 • Luxury Accents & Embellishments
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACCENTS.map((acc) => (
                  <button
                    key={acc.name}
                    type="button"
                    onClick={() => setSelectedAccent(acc)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      selectedAccent.name === acc.name
                        ? 'border-rose-600 bg-rose-50/60 font-semibold text-rose-950'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <span>{acc.name}</span>
                    <span className="text-xs font-bold text-stone-800">
                      {acc.price === 0 ? 'Free' : `+₹${acc.price}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 6: Recipient & Personal Note */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Step 6 • Free Gift Message Card
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Recipient's Name (optional)"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <textarea
                  rows={2}
                  placeholder="Handwritten message to print on artisan ribbon tag (e.g. Happy Anniversary Kabir & Rhea!)..."
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

          </div>

          {/* Right Live Order Preview & Summary (5 cols sticky) */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-lg">
              
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Custom Order Preview</span>
                  <h3 className="font-serif text-xl font-bold text-stone-900">Your Handcrafted Creation</h3>
                </div>
                <span className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base">
                  🎀
                </span>
              </div>

              {/* Visual Photo Card */}
              <div className="relative rounded-2xl overflow-hidden mt-4 aspect-16/10 bg-stone-100 border border-stone-200">
                <img
                  src={selectedType.img}
                  alt={selectedType.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs font-bold">{selectedCount.count} × {selectedType.name}</p>
                  <p className="text-[11px] text-white/80">{selectedPalette.name}</p>
                </div>
              </div>

              {/* Breakdown Specs */}
              <div className="space-y-2.5 py-4 border-b border-stone-100 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Flower Style:</span>
                  <span className="font-medium text-stone-900">{selectedType.name}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Bloom Count:</span>
                  <span className="font-medium text-stone-900">{selectedCount.label} ({selectedCount.subtitle})</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Ribbon Palette:</span>
                  <span className="font-medium text-stone-900">{selectedPalette.name}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Korean Paper:</span>
                  <span className="font-medium text-stone-900 text-right max-w-[200px] truncate">{selectedWrapping.name}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Embellishment:</span>
                  <span className="font-medium text-stone-900">{selectedAccent.name}</span>
                </div>
                {recipientName && (
                  <div className="flex justify-between text-stone-600">
                    <span>Card Addressed To:</span>
                    <span className="font-medium text-rose-700">{recipientName}</span>
                  </div>
                )}
              </div>

              {/* Pricing & CTA */}
              <div className="pt-4 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Custom Price</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-stone-900">₹{calculatedPrice}</span>
                    <p className="text-[10px] text-emerald-600 font-medium">Free Gift Box & Artisan Ribbon Sash</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Instant Order with UPI / QR</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3 rounded-xl border border-stone-300 hover:bg-rose-50 hover:border-rose-300 text-stone-800 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-stone-600" />
                    <span>Save & Add to Cart</span>
                  </button>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center gap-2 text-[11px] text-stone-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Handcrafted by our master ribbon artisans. Ready in 24-48 hours.</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
