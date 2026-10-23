import { createContentLoader } from 'vitepress';
import type { Style } from '../styles';

interface RuleExcerpt {
	section: string;
	text: string;
}

interface FeaturedRule {
	code: string;
	title: string;
	url: string;
	severity: string;
	scope: string[];
	style: Style[];
	excerpts: RuleExcerpt[];
}

declare const data: FeaturedRule;

export { data };

const featuredRule = 'rules/domain-logic/aggregates/agg-15.md';
const excerptedSections = ['Signal', 'Pourquoi', 'Correction'];

function sectionLines(src: string, section: string): string[] {
	const chunk = src.split(/^## /m).find((part) => part.split('\n')[0].trim() === section);

	if (!chunk) {
		throw new Error(`${featuredRule}: no section ${section}`);
	}

	return chunk
		.split('\n')
		.slice(1)
		.map((line) => line.trim())
		.filter((line) => line !== '');
}

function firstSentence(lines: string[]): string {
	const opening = lines.find((line) => !line.endsWith(':')) ?? '';
	const text = opening.replace(/^(-|\d+\.)\s+/, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
	const sentence = /^.+?[.!?](?=\s|$)/.exec(text);

	return sentence ? sentence[0] : text;
}

export default createContentLoader(featuredRule, {
	includeSrc: true,
	transform: ([page]): FeaturedRule => ({
		code: page.frontmatter.code,
		title: page.frontmatter.title,
		url: page.url,
		severity: page.frontmatter.severity,
		scope: page.frontmatter.scope ?? [],
		style: page.frontmatter.style ?? [],
		excerpts: excerptedSections.map((section) => ({
			section,
			text: firstSentence(sectionLines(page.src ?? '', section)),
		})),
	}),
});
