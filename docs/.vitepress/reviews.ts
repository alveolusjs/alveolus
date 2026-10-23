export type Review = 'to-review' | 'approved' | 'rejected';

export const reviews: Record<Review, { readonly emoji: string; readonly label: string }> = {
	'to-review': { emoji: '⚠️', label: 'À relire' },
	approved: { emoji: '✅', label: 'Relue' },
	rejected: { emoji: '❌', label: 'Rejetée' },
};

export const reviewOrder: Review[] = ['to-review', 'approved', 'rejected'];

export function isReview(value: unknown): value is Review {
	return value === 'to-review' || value === 'approved' || value === 'rejected';
}
