export const criteria = ['fidelity', 'questions', 'rules', 'reuse', 'coherence', 'proportion', 'readability'] as const;

export type Criterion = (typeof criteria)[number];

export type Verdict = {
	readonly scores: { readonly [criterion in Criterion]: number };
	readonly reasons: { readonly [criterion in Criterion]: string };
	readonly problems: readonly string[];
	readonly verdict: 'approve' | 'revise' | 'reject';
};
