import CustomerCopy from './CustomerCopy';
import { CheckCircle2, Star } from 'lucide-react';
import type { ProductReview } from '../services/api';

export default function CustomerReviewsSection({
  reviews, onSelect,
}: {
  key?: string;
  reviews: ProductReview[];
  onSelect: (productId: string) => void;
}) {
  // Never substitute invented testimonials when no delivered customers have reviewed.
  if (reviews.length === 0) return null;
  return (
    <section aria-labelledby="customer-reviews-heading" className="border-y border-stone-200 bg-[#F7F3EF] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500"><CustomerCopy id={"reviewSection.0"} fallback={"Customer notes"}/></p>
        <h2 id="customer-reviews-heading" className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-stone-900">
          In their own words.
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-stone-600">
          Real impressions from customers who have received their Jame Bouquets pieces.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {reviews.map((review, index) => (
            <article key={review.id || `${review.productId}-${index}`} className="flex h-full flex-col justify-between border border-stone-200 bg-white p-6">
              <div>
                <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} aria-hidden="true" className={`h-4 w-4 ${i < review.rating ? 'text-[#AC7D55]' : 'text-stone-300'}`}
                      fill={i < review.rating ? 'currentColor' : 'none'} strokeWidth={1.5}/>
                  ))}
                </div>
                <p className="mt-5 line-clamp-5 text-sm leading-7 text-stone-800">“{review.comment}”</p>
              </div>
              <div className="mt-6 border-t border-stone-100 pt-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-stone-900">{review.customerName}</span>
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-stone-500"/>
                  <span className="text-stone-500"><CustomerCopy id={"reviewSection.1"} fallback={"Verified purchase"}/></span>
                </div>
                <button type="button" onClick={() => onSelect(review.productId)}
                  className="mt-3 text-left text-xs text-stone-600 underline underline-offset-4 hover:text-stone-900">
                  {review.productTitle || 'View the piece'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
