import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { isReview, type Review } from '../../../docs/.vitepress/reviews.ts';
import { scopes } from '../../../docs/.vitepress/scopes.ts';
import { isStyleList, type Style } from '../../../docs/.vitepress/styles.ts';
import { type Theme, themes } from '../../../docs/.vitepress/themes.ts';

interface PackagedRule {
	code: string;
	title: string;
	theme: string;
	scope: string[];
	style: Style[];
	severity: string;
	severityNote?: string;
	context?: string;
	review: Review;
	body: string;
}

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const rulesDir = join(packageDir, '..', '..', 'docs', 'src', 'rules');
const outputFile = join(packageDir, 'generated', 'rules.json');

const keptSections = new Set(['Signal', 'Exceptions', 'Correction', 'Fix', 'Adaptation', 'Exemple', 'Example']);
const scopeIds = new Set(scopes.map((scope) => scope.id));

function sectionTitle(line: string): string {
	return line
		.replace(/^#+ /, '')
		.replace(/\s*\{#[\w-]+\}\s*$/, '')
		.trim();
}

function prose(line: string): string {
	return line
		.replace(/^(#{3,4}) /, '##$1 ')
		.replace(/\s*\{#[\w-]+\}\s*$/, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function compactBody(content: string): string {
	const kept: string[] = [];
	let inFence = false;
	let keep = false;

	for (const line of content.split('\n')) {
		const isFence = line.trimStart().startsWith('```');

		if (!inFence && /^#{1,2} /.test(line)) {
			keep = line.startsWith('## ') && keptSections.has(sectionTitle(line));

			if (keep) {
				kept.push(`#### ${sectionTitle(line)}`);
			}

			continue;
		}

		if (keep) {
			kept.push(inFence || isFence ? line : prose(line));
		}

		if (isFence) {
			inFence = !inFence;
		}
	}

	return kept
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function loadRule(theme: Theme, path: string): PackagedRule {
	const { data, content } = matter(readFileSync(path, 'utf8'));

	if (!isStyleList(data.style)) {
		throw new Error(`${path}: style must list tactical, transaction-script or both`);
	}

	if (!isReview(data.review)) {
		throw new Error(`${path}: review must be to-review, approved or rejected`);
	}

	const scope: unknown = data.scope;

	if (!Array.isArray(scope) || scope.length === 0 || !scope.every((id) => scopeIds.has(id))) {
		throw new Error(`${path}: scope must list known scopes`);
	}

	return {
		code: data.code,
		title: data.title,
		theme: theme.title,
		scope,
		style: data.style,
		severity: data.severity,
		severityNote: data.severityNote,
		context: data.context,
		review: data.review,
		body: compactBody(content),
	};
}

function loadThemeRules(theme: Theme): PackagedRule[] {
	const dir = join(rulesDir, theme.part, theme.slug);

	return readdirSync(dir)
		.filter((file) => file.endsWith('.md') && file !== 'index.md')
		.map((file) => loadRule(theme, join(dir, file)))
		.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
}

const rules = themes
	.filter((theme) => theme.status === 'written')
	.flatMap(loadThemeRules)
	.filter((rule) => rule.review === 'approved');

mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, `${JSON.stringify({ scopes: [...scopeIds], rules }, null, '\t')}\n`);

console.log(`${rules.length} rules written to ${outputFile}`);
