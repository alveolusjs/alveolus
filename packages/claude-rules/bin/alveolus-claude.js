#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const styles = ['tactical', 'transaction-script'];
const bigBallOfMud = 'big-ball-of-mud';
const declarations = [...styles, bigBallOfMud];
const scopesWithoutFolder = { tactical: [], 'transaction-script': ['domain'] };
const outputDir = join('.claude', 'rules', 'alveolus');
const designDir = join('.claude', 'alveolus', 'design');
const parts = [
	'strategic-design',
	'domain-logic',
	'architecture-and-placement',
	'integration',
	'testing',
	'operations',
];
const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const rulesFile = join(packageDir, 'generated', 'rules.json');
const { version } = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));

const usage = `Usage: alveolus-claude install [options]
       alveolus-claude design check <design.md>...

install
Writes the Alveolus rules into ${outputDir}/, one folder per style and one file per scope, each loaded
by Claude Code only when it reads or edits a file of that scope, and one file per big ball of mud.
Writes the same rules into ${designDir}/, one folder per style and one file per part of the rules,
which the design agents read and Claude Code never loads on its own. Installs the skills
/alveolus-design, /alveolus-implement and /alveolus-review, and the agents.

  --architecture <file>  bounded contexts and their style (default: architecture.json)
  --src <dir>            folder holding one folder per bounded context, unless its "path" says otherwise
                         (default: src)
  --prisma <dir>         folder holding one Prisma schema per bounded context (default: prisma)
  --help                 show this help

design check
Checks designs written from the template of /alveolus-design: every section present, every identifier
defined once, every acceptance criterion and invariant proven by a test, every decision with a reason,
every question with an assumption, every increment safe, the rules cited approved. Checks the Mermaid
diagrams too when mermaid and happy-dom are installed. Exits with 1 when a design has a problem.`;

const scopePaths = {
	domain: ({ path }) => [`${path}/internal/domain/**`],
	application: ({ path }) => [`${path}/internal/application/**`],
	driving: ({ path }) => [`${path}/internal/driving/**`],
	driven: ({ path }) => [`${path}/internal/driven/**`],
	public: ({ path }) => [`${path}/public/**`],
	schema: ({ name }, { prisma }) => [`${prisma}/${name}.prisma`],
	tests: ({ path }) => [`${path}/**/__test__/**`, `${path}/**/*.spec.ts`, `${path}/**/*.test.ts`],
	structure: ({ path }) => [`${path}/composition/**`],
};

function fail(message) {
	console.error(message);
	process.exit(1);
}

function readContexts(file, src) {
	if (!existsSync(file)) {
		fail(`${file} not found: declare each bounded context and its style, as CTX-14 says.`);
	}

	const { contexts } = JSON.parse(readFileSync(file, 'utf8'));

	if (typeof contexts !== 'object' || contexts === null || Object.keys(contexts).length === 0) {
		fail(`${file}: "contexts" must map each bounded context to its style.`);
	}

	return Object.entries(contexts).map(([name, declaration]) => {
		const { style, path = `${src}/${name}` } =
			typeof declaration === 'string' ? { style: declaration } : (declaration ?? {});

		if (!declarations.includes(style)) {
			fail(`${file}: ${name} has style "${style}", expected one of ${declarations.join(', ')}.`);
		}

		if (typeof path !== 'string' || path.trim() === '') {
			fail(`${file}: ${name} has a "path" that is not a folder.`);
		}

		return { name, style, path: path.replace(/\/+$/, '') };
	});
}

function isOutsideProject(path) {
	return isAbsolute(path) || path === '..' || path.startsWith('../');
}

function groupByTheme(rules) {
	const themes = new Map();

	for (const rule of rules) {
		themes.set(rule.theme, [...(themes.get(rule.theme) ?? []), rule]);
	}

	return [...themes].map(([theme, themeRules]) => ({ theme, rules: themeRules }));
}

function renderPaths(paths) {
	return ['---', 'paths:', ...paths.map((path) => `  - "${path}"`), '---'].join('\n');
}

function renderContents(rules) {
	const lines = groupByTheme(rules).flatMap(({ theme, rules: themeRules }) => [
		`- ${theme}`,
		...themeRules.map((rule) => `  - ${rule.code} · ${rule.title}`),
	]);

	return ['## Contents', lines.join('\n')].join('\n\n');
}

function renderRule(rule) {
	const facts = [
		`Severity: ${rule.severity}${rule.severityNote ? `. ${rule.severityNote}` : '.'}`,
		`Kind: ${rule.kind}.`,
		...(rule.context ? [`Applies only when: ${rule.context}`] : []),
	];

	return [`### ${rule.code} · ${rule.title}`, facts.join('\n'), rule.body].join('\n\n');
}

function renderRules(rules) {
	return groupByTheme(rules).flatMap(({ theme, rules: themeRules }) => [
		`## ${theme}`,
		...themeRules.map(renderRule),
	]);
}

function renderFile(scope, style, paths, rules) {
	const intro = [
		`# Alveolus rules · ${scope} · ${style}`,
		[
			`The Alveolus rules for the \`${scope}\` scope of ${style} bounded contexts.`,
			'Follow every rule when you write or change these files.',
			'A deviation needs a waiver in the form the app sets: propose it, never deviate silently.',
			'Rule codes in the text point to other Alveolus rules.',
		].join(' '),
	].join('\n\n');

	return `${[renderPaths(paths), intro, renderContents(rules), ...renderRules(rules)].join('\n\n')}\n`;
}

function renderBigBallOfMud(mud, paths, rules) {
	const intro = [
		`# Alveolus rules · big ball of mud · ${mud.name}`,
		[
			`\`${mud.name}\` is a big ball of mud: a zone without clear boundaries, contained rather than modelled (MAP-04).`,
			'Fix bugs and make small changes here, in the style of the code around them.',
			'Do not model it: no aggregates, no value objects, no layers.',
			'A feature that deserves its own model goes to a bounded context of its own,',
			'which reads this zone only through an anticorruption layer in its `driven` folder:',
			'stop and propose it instead of building it here.',
		].join(' '),
	].join('\n\n');

	return `${[renderPaths(paths), intro, ...renderRules(rules)].join('\n\n')}\n`;
}

function renderThemes(rules) {
	return groupByTheme(rules)
		.map(({ theme, rules: themeRules }) => `${theme} (${themeRules.length})`)
		.join(', ');
}

function renderContext(context, files, options) {
	const rows = files
		.filter((file) => file.style === context.style)
		.map(({ scope, file, rules }) => {
			const paths = scopePaths[scope](context, options)
				.map((path) => `\`${path}\``)
				.join('<br>');

			return `| ${paths} | \`${file}\` | ${rules.length} | ${renderThemes(rules)} |`;
		});

	return [
		`## ${context.name} · ${context.style}`,
		['| Files | Rules file | Rules | Themes |', '| --- | --- | --- | --- |', ...rows].join('\n'),
	].join('\n\n');
}

function renderMud({ name, path, file }) {
	return file
		? `- \`${name}\`: \`${path}/\`, rules in \`${file}\``
		: `- \`${name}\`: \`${path}/\`, outside the project`;
}

function renderIndex(contexts, files, muds, options) {
	return `${[
		'# Alveolus rules',
		[
			`This app follows the Alveolus rules. Its rules live in \`${outputDir}/\`, one folder per style and one file`,
			'per scope, and one file per big ball of mud. Claude Code loads a file of rules when you read or edit a file',
			'it matches, but a new file only loads them after it is written. Before you create a file, read the rules',
			'file of its folder. Each rules file starts with its contents.',
		].join(' '),
		`Installed from \`@alveolus/claude-rules ${version}\`.`,
		...contexts.map((context) => renderContext(context, files, options)),
		...(muds.length === 0
			? []
			: [
					[
						'## Big balls of mud',
						[
							'These folders are big balls of mud, contained by MAP-04. Code outside them never imports from them,',
							'except an anticorruption layer in a `driven` folder.',
						].join(' '),
						muds.map(renderMud).join('\n'),
					].join('\n\n'),
				]),
	].join('\n\n')}\n`;
}

function writeScopeFiles(scopes, rules, contexts, options) {
	const files = [];

	for (const style of styles) {
		const styleContexts = contexts.filter((context) => context.style === style);

		for (const scope of scopes) {
			const scopeRules = rules.filter((rule) => rule.scope.includes(scope) && rule.style.includes(style));

			if (styleContexts.length === 0 || scopeRules.length === 0 || scopesWithoutFolder[style].includes(scope)) {
				continue;
			}

			const paths = styleContexts.flatMap((context) => scopePaths[scope](context, options));
			const file = join(outputDir, style, `${scope}.md`);
			const text = renderFile(scope, style, paths, scopeRules);

			mkdirSync(dirname(file), { recursive: true });
			writeFileSync(file, text);
			files.push({ style, scope, file, rules: scopeRules });
			console.log(`${file}: ${scopeRules.length} rules, ${Math.round(Buffer.byteLength(text) / 1024)} KB`);
		}
	}

	return files;
}

function writeMudFiles(muds, rules) {
	const containment = rules.filter((rule) => rule.code === 'MAP-04');

	return muds.map((mud) => {
		if (isOutsideProject(mud.path)) {
			console.log(`${mud.name}: big ball of mud outside the project, listed in the index only`);

			return mud;
		}

		const file = join(outputDir, bigBallOfMud, `${mud.name}.md`);

		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, renderBigBallOfMud(mud, [`${mud.path}/**`], containment));
		console.log(`${file}: big ball of mud, contained by MAP-04`);

		return { ...mud, file };
	});
}

function renderDesignBundle(part, style, rules) {
	const intro = [
		`# Alveolus rules · ${part} · ${style}`,
		[
			`The Alveolus rules of the \`${part}\` part, for ${style} bounded contexts.`,
			'A design agent reads this file whole before it decides anything in its part of a design.',
			'Rule codes in the text point to other Alveolus rules.',
		].join(' '),
	].join('\n\n');

	return `${[intro, renderContents(rules), ...renderRules(rules)].join('\n\n')}\n`;
}

function writeDesignBundles(rules, contexts) {
	rmSync(designDir, { recursive: true, force: true });

	for (const style of styles) {
		if (!contexts.some((context) => context.style === style)) {
			continue;
		}

		for (const part of parts) {
			const partRules = rules.filter((rule) => rule.part === part && rule.style.includes(style));

			if (partRules.length === 0) {
				continue;
			}

			const file = join(designDir, style, `${part}.md`);
			const text = renderDesignBundle(part, style, partRules);

			mkdirSync(dirname(file), { recursive: true });
			writeFileSync(file, text);
			console.log(`${file}: ${partRules.length} rules, ${Math.round(Buffer.byteLength(text) / 1024)} KB`);
		}
	}
}

function install(options) {
	if (!existsSync(rulesFile)) {
		fail(`${rulesFile} not found: build the package first.`);
	}

	const { scopes, rules } = JSON.parse(readFileSync(rulesFile, 'utf8'));
	const contexts = readContexts(options.architecture, options.src);
	const modelled = contexts.filter((context) => context.style !== bigBallOfMud);

	rmSync(outputDir, { recursive: true, force: true });
	mkdirSync(outputDir, { recursive: true });

	const files = writeScopeFiles(scopes, rules, modelled, options);
	const muds = writeMudFiles(
		contexts.filter((context) => context.style === bigBallOfMud),
		rules,
	);

	writeFileSync(join(outputDir, 'index.md'), renderIndex(modelled, files, muds, options));
	console.log(`${join(outputDir, 'index.md')}: always loaded, points each folder to its rules`);

	writeDesignBundles(rules, modelled);

	installWorkflow();
}

function installWorkflow() {
	for (const skill of readdirSync(join(packageDir, 'skills'))) {
		const target = join('.claude', 'skills', skill);

		rmSync(target, { recursive: true, force: true });
		cpSync(join(packageDir, 'skills', skill), target, { recursive: true });
		console.log(`${target}: skill /${skill}`);
	}

	mkdirSync(join('.claude', 'agents'), { recursive: true });

	for (const agent of readdirSync(join(packageDir, 'agents'))) {
		const target = join('.claude', 'agents', agent);

		cpSync(join(packageDir, 'agents', agent), target);
		console.log(`${target}: agent ${agent.replace(/\.md$/, '')}`);
	}
}

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		architecture: { type: 'string', default: 'architecture.json' },
		src: { type: 'string', default: 'src' },
		prisma: { type: 'string', default: 'prisma' },
		help: { type: 'boolean', default: false },
	},
});

if (values.help) {
	console.log(usage);
	process.exit(0);
}

if (positionals[0] === 'install') {
	install(values);
} else if (positionals[0] === 'design' && positionals[1] === 'check' && positionals.length > 2) {
	const { DesignCommand } = await import('../dist/design.mjs');

	process.exit(await new DesignCommand(rulesFile).check(positionals.slice(2)));
} else {
	console.log(usage);
	process.exit(1);
}
