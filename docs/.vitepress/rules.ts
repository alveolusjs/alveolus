import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import type { DefaultTheme, MarkdownRenderer } from 'vitepress';
import { iconSvg } from './icons';
import { parts } from './parts';
import { isReview, type Review } from './reviews';
import { isStyleList, type Style } from './styles';
import { type Theme, themes } from './themes';

export const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function themePath(theme: Theme): string {
	return `rules/${theme.part}/${theme.slug}`;
}

function overviewItem(path: string): DefaultTheme.SidebarItem {
	const { data } = matter(readFileSync(join(srcDir, path, 'index.md'), 'utf8'));

	return { text: typeof data.menu === 'string' ? data.menu : 'Overview', link: `/${path}/` };
}

export interface Rule {
	code: string;
	title: string;
	group: string;
	review: Review;
	severity: string;
	severityNote?: string;
	detection: string;
	detectionNote?: string;
	fitness?: string;
	context?: string;
	scope: string[];
	style: Style[];
	link: string;
}

function loadThemeRules(theme: Theme): Rule[] {
	const dir = join(srcDir, themePath(theme));

	return readdirSync(dir)
		.filter((file) => file.endsWith('.md') && file !== 'index.md')
		.map((file) => {
			const { data } = matter(readFileSync(join(dir, file), 'utf8'));

			if (!isStyleList(data.style)) {
				throw new Error(`${themePath(theme)}/${file}: style must list tactical, transaction-script or both`);
			}

			if (!isReview(data.review)) {
				throw new Error(`${themePath(theme)}/${file}: review must be to-review, approved or rejected`);
			}

			return {
				code: data.code,
				title: data.title,
				group: data.group ?? 'Rules',
				review: data.review,
				severity: data.severity,
				severityNote: data.severityNote,
				detection: data.detection,
				detectionNote: data.detectionNote,
				fitness: data.fitness,
				context: data.context,
				scope: data.scope ?? [],
				style: data.style,
				link: `/${themePath(theme)}/${file.replace(/\.md$/, '')}`,
			};
		})
		.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
}

function themeProblems(): string[] {
	const partSlugs = new Set(parts.map((part) => part.slug));
	const prefixes = themes.map((theme) => theme.prefix);

	return themes.flatMap((theme) => {
		const written = existsSync(join(srcDir, themePath(theme), 'index.md'));

		return [
			...(partSlugs.has(theme.part) ? [] : [`${theme.slug}: unknown part ${theme.part}`]),
			...(prefixes.indexOf(theme.prefix) === prefixes.lastIndexOf(theme.prefix)
				? []
				: [`${theme.slug}: prefix ${theme.prefix} is used by another theme`]),
			...(theme.status === 'written' && !written ? [`${theme.slug}: written, but has no index.md`] : []),
			...(theme.status === 'coming' && written ? [`${theme.slug}: coming, but already has an index.md`] : []),
		];
	});
}

const problems = themeProblems();

if (problems.length > 0) {
	throw new Error(`Rule themes are inconsistent:\n${problems.join('\n')}`);
}

export const writtenThemes = themes
	.filter((theme) => theme.status === 'written')
	.map((theme) => ({ theme, rules: loadThemeRules(theme) }));

function escapeHtml(text: string): string {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function ruleItemText(rule: Rule): string {
	return [
		'<span class="rb-rule-item">',
		`<span class="rb-rule-item__code">${rule.code}</span>`,
		`<span class="rb-rule-item__label">${escapeHtml(rule.title)}</span>`,
		'</span>',
	].join('');
}

function themeItem({ theme, rules }: { theme: Theme; rules: Rule[] }): DefaultTheme.SidebarItem {
	return {
		text: theme.title,
		collapsed: true,
		items: [
			overviewItem(themePath(theme)),
			...rules.map((rule) => ({ text: ruleItemText(rule), link: rule.link })),
		],
	};
}

export function rulesSidebar(): DefaultTheme.SidebarItem[] {
	return [
		{
			text: 'Commencer ici',
			items: [
				{ text: 'Présentation', link: '/start/overview' },
				{ text: 'Premiers pas', link: '/start/getting-started' },
				{ text: 'Architecture de référence', link: '/start/reference-architecture' },
				{ text: 'Choix par défaut', link: '/start/default-choices' },
				{ text: 'Mettre en place un projet', link: '/start/prerequisites' },
				{ text: 'Glossaire', link: '/start/glossary' },
			],
		},
		...parts.map((part) => ({
			text: `<span class="rb-part-icon">${iconSvg(part.icon)}</span>${part.title}`,
			items: [
				overviewItem(`rules/${part.slug}`),
				...(part.slug === 'domain-logic'
					? [{ text: 'Choisir un style', link: '/rules/domain-logic/choosing-a-style' }]
					: []),
				...writtenThemes.filter(({ theme }) => theme.part === part.slug).map(themeItem),
			],
		})),
	];
}

const RULE_CODE = /\b[A-Z]{2,4}-\d{2}\b/g;

/**
 * Turns every mention of an existing rule code (e.g. `AGG-04`) into a link to its page.
 * Skips headings, text already inside a link, inline code and mentions of the current page.
 */
export function ruleLinks(md: MarkdownRenderer): void {
	const links = new Map(writtenThemes.flatMap(({ rules }) => rules.map((rule) => [rule.code, rule.link] as const)));

	md.core.ruler.push('rule-links', (state) => {
		const currentPage = `/${(state.env?.relativePath ?? '').replace(/\.md$/, '')}`;

		state.tokens.forEach((block, index) => {
			if (block.type !== 'inline' || !block.children) {
				return;
			}

			if (state.tokens[index - 1]?.type === 'heading_open') {
				return;
			}

			let linkDepth = 0;
			block.children = block.children.flatMap((token) => {
				if (token.type === 'link_open') {
					linkDepth++;
				}

				if (token.type === 'link_close') {
					linkDepth--;
				}

				if (token.type !== 'text' || linkDepth > 0) {
					return [token];
				}

				const result = [];
				let last = 0;
				for (const match of token.content.matchAll(RULE_CODE)) {
					const href = links.get(match[0]);
					if (!href || href === currentPage) {
						continue;
					}

					const before = new state.Token('text', '', 0);
					before.content = token.content.slice(last, match.index);
					const open = new state.Token('link_open', 'a', 1);
					open.attrs = [['href', href]];
					const label = new state.Token('text', '', 0);
					label.content = match[0];
					const close = new state.Token('link_close', 'a', -1);
					result.push(before, open, label, close);
					last = match.index + match[0].length;
				}

				if (last === 0) {
					return [token];
				}

				const after = new state.Token('text', '', 0);
				after.content = token.content.slice(last);
				result.push(after);

				return result;
			});
		});
	});
}
