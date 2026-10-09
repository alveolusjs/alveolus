export interface Scaffold {
	readonly path: string;
	readonly content: string;
	readonly marker?: string;
}

const config = `import { defineConfig } from "@alveolus/arch";

export default defineConfig({
	boundedContexts: {},
	contextMap: {},
	root: "src",
});
`;

const skill = `---
name: alveolus
description: Domain-Driven Design with @alveolus/core and @alveolus/arch. Use when writing or changing a class of the domain, the application or an adapter, when a class extends an Alveolus building block, or when alveolus arch check reports a violation.
---

# Alveolus

The documentation is installed with the package: read it with \`npx alveolus explain <topic>\`, not on the web. \`npx alveolus explain\` lists every topic.

1. Before writing a class, read its building block: \`npx alveolus explain aggregates\`, \`entities\`, \`value-objects\`, \`domain-events\`, \`domain-errors\`, \`ports\`, \`repositories\`, \`command-handlers\`, \`query-handlers\`, \`result\`.
2. Where a file goes and what each layer may import: \`npx alveolus explain project-layout\`.
3. After each change, run \`npx alveolus arch check\`.
4. On a violation, read the rule before changing the code: \`npx alveolus explain <rule>\`, with the rule id of the report, such as \`layers/no-impure-domain\`. Fix the cause: never turn a rule off, add a disable comment, add a context to \`contextMap\` or edit \`alveolus.baseline.json\` by hand without asking.
`;

const agents = `## Alveolus

This project uses Alveolus for Domain-Driven Design: the building blocks of \`@alveolus/core\` and the architecture checks of \`@alveolus/arch\`. The documentation is installed with the package: \`npx alveolus explain\` lists the topics and \`npx alveolus explain <topic>\` prints one, so do not look for it on the web. Run \`npx alveolus arch check\` after each change, and read the rule reported with \`npx alveolus explain <rule>\` before fixing. See \`.claude/skills/alveolus/SKILL.md\`.
`;

export const scaffolds: readonly Scaffold[] = [
	{ content: config, path: "alveolus.config.ts" },
	{ content: skill, path: ".claude/skills/alveolus/SKILL.md" },
	{ content: agents, marker: "npx alveolus explain", path: "AGENTS.md" },
];
