import { createContentLoader } from 'vitepress';
import type { Review } from '../reviews';
import type { Style } from '../styles';

interface RuleSummary {
	code: string;
	title: string;
	group: string;
	severity: string;
	/** Applicability condition, when the rule is not universal. */
	context?: string;
	scope: string[];
	theme: string;
	url: string;
	review: Review;
	style: Style[];
}

declare const data: RuleSummary[];

export { data };

export default createContentLoader('rules/*/*/*.md', {
	transform: (pages): RuleSummary[] =>
		pages
			.filter((page) => page.frontmatter.code)
			.map((page) => ({
				code: page.frontmatter.code,
				title: page.frontmatter.title,
				group: page.frontmatter.group ?? 'Rules',
				severity: page.frontmatter.severity,
				context: page.frontmatter.context,
				scope: page.frontmatter.scope ?? [],
				theme: page.url.split('/').filter(Boolean)[2] ?? '',
				url: page.url,
				review: page.frontmatter.review,
				style: page.frontmatter.style ?? [],
			}))
			.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true })),
});
