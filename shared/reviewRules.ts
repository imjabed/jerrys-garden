// Product review rules are deliberately independent of the UI.
// Final purchase eligibility is checked against MongoDB orders by the API.
export function reviewInputError(rating: unknown, comment: unknown): string | null {
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'Choose a rating between one and five stars.';
  }
  if (typeof comment !== 'string' || comment.trim().length < 12 || comment.trim().length > 800) {
    return 'Please write a review between 12 and 800 characters.';
  }
  return null;
}

export function reviewerDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Verified customer';
  const first = parts[0].slice(0, 36);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : first;
}

export function customerReviewId(email: string, productId: string): string {
  // Collision-resistant deterministic key; uniqueness is enforced by MongoDB _id.
  const normalize = (value: string) => value.trim().toLowerCase();
  return `${normalize(email)}::${productId.trim()}`;
}
