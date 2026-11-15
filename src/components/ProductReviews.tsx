import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import {
  apiGetProductReviews, apiSubmitProductReview,
  type ProductReviewsResponse, type ReviewSummary,
} from '../services/api';

function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} aria-hidden="true"
          className={`${size} ${index < Math.round(value) ? 'text-[#AC7D55]' : 'text-stone-300'}`}
          fill={index < Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.6} />
      ))}
    </span>
  );
}

export default function ProductReviews({
  productId, activeUserEmail, onSignIn, onReviewSubmitted,
}: {
  productId: string;
  activeUserEmail?: string;
  onSignIn: () => void;
  onReviewSubmitted: () => void;
}) {
  const [data, setData] = useState<ProductReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFetchError('');
    apiGetProductReviews(productId)
      .then(result => { if (active) setData(result); })
      .catch((error: Error) => {
        if (active) { setData(null); setFetchError(error.message || 'Reviews are unavailable.'); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId, activeUserEmail, reload]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || !data?.canReview) return;
    setSubmitting(true);
    setSubmissionError('');
    try {
      await apiSubmitProductReview(productId, rating, comment.trim());
      setSubmittedNotice('Thank you. Your verified review is awaiting moderation before it appears publicly.');
      setComment('');
      setRating(5);
      setReload(value => value + 1);
      onReviewSubmitted();
    } catch (err: any) {
      setSubmissionError(err?.message || 'Unable to submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  const summary: ReviewSummary = data?.summary || { count: 0, average: 0 };

  return (
    <section aria-label="Customer reviews" className="mt-6 border-t border-stone-200 pt-6">
      {submittedNotice && <p role="status" className="mb-4 border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-700">{submittedNotice}</p>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">From our customers</p>
          <h3 className="mt-2 font-serif text-2xl font-normal text-stone-900">Customer Reviews</h3>
        </div>
        {summary.count > 0 && (
          <div className="flex items-center gap-2 text-stone-700">
            <Stars value={summary.average}/>
            <span className="text-sm font-semibold">{summary.average.toFixed(1)}</span>
            <span className="text-xs text-stone-500">({summary.count})</span>
          </div>
        )}
      </div>

      {loading ? <p className="mt-5 text-sm text-stone-500">Loading customer reviews…</p> :
        fetchError ? (
          <div className="mt-5 text-sm text-stone-600">
            {fetchError} <button type="button" className="underline" onClick={() => setReload(n => n + 1)}>Try again</button>
          </div>
        ) : (
          <>
            {summary.count === 0 ? (
              <p className="mt-5 text-sm leading-6 text-stone-600">
                No reviews yet. Reviews here come only from customers who have received this piece.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {data?.reviews.map(review => (
                  <article key={review.id} className="border-b border-stone-100 pb-4 last:border-b-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Stars value={review.rating} size="h-3.5 w-3.5"/>
                      <span className="text-[11px] text-stone-500">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-700 whitespace-pre-wrap break-words">{review.comment}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-stone-800">{review.customerName}</span>
                      <span className="inline-flex items-center gap-1 text-[#766C61]">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.7}/> Verified purchase
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {data?.canReview ? (
              <form onSubmit={submit} className="mt-6 border border-stone-200 bg-[#FAF8F5] p-4">
                <h4 className="font-serif text-lg text-stone-900">Review your purchase</h4>
                <p className="mt-1 text-xs leading-5 text-stone-500">Your review will be shown with your first name and last initial.</p>
                <div className="mt-4 flex items-center gap-1" role="group" aria-label="Choose star rating">
                  {Array.from({ length: 5 }, (_, index) => (
                    <button type="button" key={index} onClick={() => setRating(index + 1)}
                      aria-label={`Rate ${index + 1} star${index ? 's' : ''}`}
                      aria-pressed={rating === index + 1} className="rounded-sm p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-700">
                      <Star className={`h-6 w-6 ${index < rating ? 'text-[#AC7D55]' : 'text-stone-300'}`}
                        fill={index < rating ? 'currentColor' : 'none'} strokeWidth={1.5}/>
                    </button>
                  ))}
                </div>
                <label className="mt-4 block text-xs font-medium text-stone-700" htmlFor="product-review-text">
                  Your experience
                </label>
                <textarea id="product-review-text" required minLength={12} maxLength={800}
                  value={comment} onChange={event => setComment(event.target.value)}
                  placeholder="Tell others about the bouquet, packaging and gifting experience."
                  className="mt-2 min-h-28 w-full resize-y border border-stone-300 bg-white p-3 text-sm text-stone-900 outline-none focus:border-stone-700"/>
                {submissionError && <p role="alert" className="mt-2 text-xs text-red-700">{submissionError}</p>}
                <button type="submit" disabled={submitting || comment.trim().length < 12}
                  className="mt-3 w-full bg-stone-900 px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white hover:bg-stone-700 disabled:opacity-40">
                  {submitting ? 'Submitting…' : 'Publish review'}
                </button>
              </form>
            ) : (
              <p className="mt-5 border-t border-stone-100 pt-4 text-xs leading-5 text-stone-500">
                {!data?.isSignedIn ? (
                  <>Already purchased this piece? <button type="button" onClick={onSignIn} className="font-medium text-stone-900 underline underline-offset-2">Sign in</button> to leave a review after delivery.</>
                ) : data?.hasReviewed ? 'Thank you. Your review has already been submitted for this product.' :
                  'Reviews are available after your order containing this product has been delivered.'}
              </p>
            )}
          </>
        )}
    </section>
  );
}
