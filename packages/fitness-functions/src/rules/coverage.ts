export type Coverage = 'full' | 'partial';

export type RuleCoverage = {
	readonly coverage: Coverage;
	readonly checks: string;
};
