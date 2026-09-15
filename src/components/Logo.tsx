interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function Logo({ size = 'md', showSubtitle = true }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl md:text-2xl',
    lg: 'text-2xl md:text-3xl',
  };

  return (
    <div className="flex items-center gap-2.5 group cursor-pointer select-none">
      {/* Handcrafted Ribbon Flower Emblem */}
      <div className={`relative flex items-center justify-center rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 shadow-sm transition-transform duration-300 group-hover:scale-105 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized Ribbon loops forming a rosette flower */}
          <path
            d="M20 12C20 8 16 6 13 8C10 10 11 15 20 20C29 15 30 10 27 8C24 6 20 8 20 12Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          <path
            d="M12 20C8 20 6 24 8 27C10 30 15 29 20 20C15 11 10 10 8 13C6 16 8 20 12 20Z"
            fill="currentColor"
            fillOpacity="0.75"
          />
          <path
            d="M28 20C32 20 34 24 32 27C30 30 25 29 20 20C25 11 30 10 32 13C34 16 32 20 28 20Z"
            fill="currentColor"
            fillOpacity="0.75"
          />
          <path
            d="M20 28C20 32 16 34 13 32C10 30 11 25 20 20C29 25 30 30 27 32C24 34 20 32 20 28Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          {/* Pearlescent center pin */}
          <circle cx="20" cy="20" r="3.2" fill="#FDFBF7" stroke="#E11D48" strokeWidth="1.5" />
          {/* Flowing Ribbon tails */}
          <path
            d="M18 25C17 29 14 34 11 36M22 25C23 29 26 34 29 36"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className={`font-serif font-bold tracking-tight text-stone-900 leading-none ${titleSizes[size]}`}>
            Jerry's Garden
          </span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-rose-400" />
        </div>
        {showSubtitle && (
          <p className="text-[10px] tracking-wider uppercase font-medium text-stone-500 mt-0.5">
            Handcrafted Ribbon Floristry
          </p>
        )}
      </div>
    </div>
  );
}
