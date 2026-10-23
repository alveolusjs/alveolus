import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { parts } from './parts';
import { type Rule, srcDir, writtenThemes } from './rules';
import { scopeLabel } from './scopes';
import { styleLegend, styleListLabel, styles } from './styles';
import { badgeLabel } from './theme/badges';
import { themes } from './themes';

const SNIPPET = /^<<< @\/([^\s#{]+)(?:#([\w-]+))?(?:\{([^}]*)\})?[ \t]*$/gm;
const COMPONENT = /^<(\w+)([^>]*?)\s*\/>[ \t]*$/gm;
const REGION_MARKER = /^\s*\/\/ #(?:end)?region\b/;

const allRules = writtenThemes.flatMap(({ rules }) => rules);

export function pageMarkdown(relativePath: string): string {
	const { content } = matter(readFileSync(join(srcDir, relativePath), 'utf8'));

	return `${content
		.replace(SNIPPET, (_, path: string, region: string | undefined, options: string | undefined) =>
			snippet(path, region, options ?? ''),
		)
		.replace(COMPONENT, (_, name: string, attributes: string) => component(name, attributes, relativePath))
		.replace(/\n{3,}/g, '\n\n')
		.trim()}\n`;
}

function snippet(path: string, region: string | undefined, options: string): string {
	const lines = readFileSync(join(srcDir, path), 'utf8').split('\n');
	const start = region ? lines.findIndex((line) => line.trim() === `// #region ${region}`) + 1 : 0;
	const end = region ? lines.findIndex((line) => line.trim() === `// #endregion ${region}`) : lines.length;
	const body = lines.slice(start, end).filter((line) => !REGION_MARKER.test(line));
	const indent = Math.min(
		...body.filter((line) => line.trim() !== '').map((line) => line.length - line.trimStart().length),
	);
	const language = options.trim().split(/\s+/).pop()?.replace(/:.*$/, '') ?? '';

	const fence = `\`\`\`${/^\d/.test(language) ? '' : language}`;

	return [fence, ...body.map((line) => line.slice(indent)), '```'].join('\n');
}

function component(name: string, attributes: string, relativePath: string): string {
	switch (name) {
		case 'RuleMeta':
			return ruleMeta(relativePath);
		case 'RuleTable':
			return ruleTable(relativePath.split('/')[2] ?? '');
		case 'ThemeTable':
			return themeTable(/part="([\w-]+)"/.exec(attributes)?.[1]);
		case 'RuleIndex':
			return ruleIndex();
		case 'StyleLegend':
			return styleLegend.map((entry) => `- **${styleListLabel(entry.styles)}** : ${entry.meaning}`).join('\n');
		default:
			return '';
	}
}

function ruleMeta(relativePath: string): string {
	const rule = allRules.find((candidate) => `${candidate.link.slice(1)}.md` === relativePath);

	if (!rule) {
		return '';
	}

	const withNote = (value: string, note: string | undefined): string => (note ? `${value} (${note})` : value);

	return [
		...(rule.context ? [`- **Condition** : ${rule.context}`] : []),
		`- **Style** : ${rule.style.map((style) => styles[style].label).join(', ')}`,
		`- **Sévérité** : ${withNote(badgeLabel(rule.severity), rule.severityNote)}`,
		`- **Détection** : ${withNote(badgeLabel(rule.detection), rule.detectionNote)}`,
		...(rule.fitness ? [`- **Contrôle automatique** : ${rule.fitness}`] : []),
		`- **S’applique à** : ${rule.scope.map(scopeLabel).join(', ')}`,
	].join('\n');
}

function ruleRows(rules: readonly Rule[]): string[] {
	return [
		'| Code | Règle | Sévérité | Détection |',
		'| --- | --- | --- | --- |',
		...rules.map(
			(rule) =>
				`| [${rule.code}](${rule.link}) | ${rule.title} | ${badgeLabel(rule.severity)} | ${badgeLabel(rule.detection)} |`,
		),
	];
}

function ruleTable(themeSlug: string): string {
	const rules = writtenThemes.find(({ theme }) => theme.slug === themeSlug)?.rules ?? [];

	return [...Map.groupBy(rules, (rule) => rule.group)]
		.map(([group, groupRules]) => [`### ${group}`, '', ...ruleRows(groupRules)].join('\n'))
		.join('\n\n');
}

function themeTable(part: string | undefined): string {
	return parts
		.filter((candidate) => !part || candidate.slug === part)
		.map((candidate) => {
			const rows = themes
				.filter((theme) => theme.part === candidate.slug)
				.map((theme) =>
					theme.status === 'written'
						? `| [${theme.title}](/rules/${theme.part}/${theme.slug}/) | ${theme.prefix} | ${theme.summary} |`
						: `| ${theme.title} (à venir) | ${theme.prefix} | ${theme.summary} |`,
				);
			const table = ['| Thème | Préfixe | Ce qu’il couvre |', '| --- | --- | --- |', ...rows].join('\n');

			return part
				? table
				: `### [${candidate.title}](/rules/${candidate.slug}/)\n\n${candidate.summary}\n\n${table}`;
		})
		.join('\n\n');
}

function ruleIndex(): string {
	return writtenThemes
		.map(({ theme, rules }) => [`## ${theme.title}`, '', ...ruleRows(rules)].join('\n'))
		.join('\n\n');
}
