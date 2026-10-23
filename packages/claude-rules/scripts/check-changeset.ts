import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const packageName = '@alveolus/claude-rules';
const base = process.argv[2];

if (!base) {
	throw new Error('Usage: node check-changeset.ts <base ref>');
}

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();

function git(...args: string[]): string {
	return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function contentAtHead(file: string): string | undefined {
	const path = join(root, file);

	return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
}

function changedFiles(...paths: string[]): string[] {
	return git('diff', '--name-only', '--diff-filter=ACDMR', `${base}...HEAD`, '--', ...paths)
		.split('\n')
		.filter((file) => file.endsWith('.md'));
}

function contentAtBase(file: string): string | undefined {
	try {
		return git('show', `${base}:${file}`);
	} catch {
		return undefined;
	}
}

function isApproved(content: string | undefined): boolean {
	return content !== undefined && matter(content).data.review === 'approved';
}

function shipsChange(file: string): boolean {
	return isApproved(contentAtBase(file)) || isApproved(contentAtHead(file));
}

const shippedRules = changedFiles('docs/src/rules')
	.filter((file) => !file.endsWith('/index.md'))
	.filter(shipsChange);

if (shippedRules.length === 0) {
	process.exit(0);
}

const releasesPackage = changedFiles('.changeset')
	.filter((file) => !file.endsWith('README.md'))
	.map(contentAtHead)
	.some((content) => content !== undefined && packageName in matter(content).data);

if (!releasesPackage) {
	console.error(`These approved rules change what ${packageName} ships, but no changeset releases it:`);

	for (const file of shippedRules) {
		console.error(`- ${file}`);
	}

	console.error(`Run pnpm changeset and pick ${packageName}.`);
	process.exit(1);
}
