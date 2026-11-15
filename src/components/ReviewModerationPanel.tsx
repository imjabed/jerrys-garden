import { useEffect, useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { apiGetOwnerReviews, apiModerateReview, type OwnerReview, type ReviewModerationStatus } from '../services/api';

const statusLabel: Record<ReviewModerationStatus, string> = {
  pending: 'Pending review', approved: 'Published', hidden: 'Hidden',
};

export default function ReviewModerationPanel() {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [filter, setFilter] = useState<'all' | ReviewModerationStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try { setReviews(await apiGetOwnerReviews()); }
    catch (err: any) { setError(err?.message || 'Could not load reviews.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);

  const update = async (review: OwnerReview, status: ReviewModerationStatus) => {
    if (workingId) return;
    setWorkingId(review.id); setError(''); setNotice('');
    try {
      await apiModerateReview(review.id, status);
      setReviews(list => list.map(item => item.id === review.id ? { ...item, status } : item));
      setNotice(`Review marked ${status === 'approved' ? 'published' : status}.`);
    } catch (err: any) {
      setError(err?.message || 'Could not update this review.');
    } finally { setWorkingId(null); }
  };

  const filtered = reviews.filter(review => filter === 'all' || review.status === filter);
  const pending = reviews.filter(review => review.status === 'pending').length;
  return (
    <section aria-label="Review moderation" className="space-y-5">
      <div className="border border-stone-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-2xl text-stone-900">Customer review moderation</h3>
            <p className="mt-2 max-w-xl text-xs leading-6 text-stone-600">
              Only customers with a delivered order for the exact product can submit a review.
              Publish genuine feedback regardless of rating; hide only spam, abuse or inappropriate content.
            </p>
          </div>
          <button type="button" onClick={() => void reload()} disabled={loading}
            className="border border-stone-300 px-4 py-2 text-xs text-stone-800 hover:bg-stone-50 disabled:opacity-50">
            {loading ? 'Loading…' : 'Refresh reviews'}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(['pending', 'approved', 'hidden', 'all'] as const).map(status => (
            <button type="button" key={status} onClick={() => setFilter(status)}
              className={`px-3 py-2 text-xs transition ${filter === status ? 'bg-stone-900 text-white' : 'border border-stone-200 text-stone-700 hover:bg-stone-50'}`}>
              {status === 'all' ? 'All reviews' : statusLabel[status]}
              {status === 'pending' ? ` · ${pending}` : ''}
            </button>
          ))}
        </div>
      </div>
      {error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="border border-stone-200 bg-stone-100 px-4 py-3 text-sm text-stone-800">{notice}</p>}
      {!loading && filtered.length === 0 && !error && (
        <div className="border border-stone-200 bg-white px-6 py-12 text-center text-sm text-stone-600">
          {filter === 'pending' ? 'No reviews are waiting for moderation.' : 'No reviews in this group.'}
        </div>
      )}
      <div className="grid gap-3">
        {filtered.map(review => (
          <article key={review.id} className="border border-stone-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-900">{review.productTitle}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {review.customerName} · {new Date(review.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <span className="border border-stone-200 px-2.5 py-1 text-[11px] text-stone-600">{statusLabel[review.status]}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#956E49]">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4" fill="currentColor" strokeWidth={1.4} aria-hidden="true"/>
                {review.rating}/5
              </span>
              <CheckCircle2 className="h-4 w-4 text-stone-500" aria-hidden="true"/>
              <span className="text-stone-600">Delivered order verified</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">{review.comment}</p>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
              {review.status !== 'approved' && (
                <button type="button" disabled={Boolean(workingId)} onClick={() => void update(review, 'approved')}
                  className="bg-stone-900 px-4 py-2 text-xs text-white hover:bg-stone-700 disabled:opacity-40">
                  Publish genuine review
                </button>
              )}
              {review.status !== 'hidden' && (
                <button type="button" disabled={Boolean(workingId)} onClick={() => void update(review, 'hidden')}
                  className="border border-stone-300 px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 disabled:opacity-40">
                  Hide inappropriate review
                </button>
              )}
              {review.status !== 'pending' && (
                <button type="button" disabled={Boolean(workingId)} onClick={() => void update(review, 'pending')}
                  className="border border-stone-300 px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 disabled:opacity-40">
                  Return to pending
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
