export type Review = 'to-review' | 'approved' | 'rejected';

export function isReview(value: unknown): value is Review {
	return value === 'to-review' || value === 'approved' || value === 'rejected';
}
