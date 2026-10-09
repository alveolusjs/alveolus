import { transformerNotationWordHighlight } from "@shikijs/transformers";
import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";
import llmstxt, { copyOrDownloadAsMarkdownButtons } from "vitepress-plugin-llms";

import { PageHead } from "./seo/page-head";

const repository = "https://github.com/alveolusjs/alveolus";
const npm = "https://www.npmjs.com/org/alveolus";

const sidebar = [
	{
		items: [
			{ link: "/guide/learning-path", text: "Learning path" },
			{ link: "/guide/getting-started", text: "Getting started" },
			{ link: "/guide/existing-project", text: "Existing project" },
			{ link: "/guide/project-layout", text: "Project layout" },
			{ link: "/guide/agents", text: "Coding agents" },
			{ link: "/guide/versioning", text: "Versioning" },
		],
		text: "Guide",
	},
	{
		items: [
			{ link: "/integrations/", text: "Overview" },
			{ link: "/integrations/nestjs", text: "NestJS" },
		],
		text: "Integrations",
	},
	{
		items: [
			{ link: "/core/", text: "Overview" },
			{
				collapsed: false,
				items: [
					{ link: "/core/domain/", text: "Overview" },
					{ link: "/core/domain/aggregates", text: "Aggregates" },
					{ link: "/core/domain/entities", text: "Entities" },
					{ link: "/core/domain/value-objects", text: "Value objects" },
					{ link: "/core/domain/domain-events", text: "Domain events" },
					{ link: "/core/domain/domain-errors", text: "Domain errors" },
					{ link: "/core/domain/domain-services", text: "Domain services" },
					{ link: "/core/domain/ports", text: "Ports" },
					{ link: "/core/domain/repositories", text: "Repositories" },
					{ link: "/core/domain/views", text: "Views" },
				],
				text: "Domain",
			},
			{
				collapsed: false,
				items: [
					{ link: "/core/application/", text: "Overview" },
					{ link: "/core/application/command-handlers", text: "Command handlers" },
					{ link: "/core/application/query-handlers", text: "Query handlers" },
					{ link: "/core/application/event-translators", text: "Event translators" },
					{ link: "/core/application/integration-events", text: "Integration events" },
					{ link: "/core/application/event-publishers", text: "Event publishers" },
					{ link: "/core/application/unit-of-work", text: "Unit of Work" },
					{ link: "/core/application/outbox", text: "Outbox" },
				],
				text: "Application",
			},
			{
				collapsed: false,
				items: [
					{ link: "/core/strategic/", text: "Overview" },
					{ link: "/core/strategic/published-language", text: "Published Language" },
					{ link: "/core/strategic/open-host-services", text: "Open host services" },
					{ link: "/core/strategic/anti-corruption-layers", text: "Anti-corruption layers" },
				],
				text: "Strategic",
			},
			{
				collapsed: false,
				items: [{ link: "/core/utilities/result", text: "Result" }],
				text: "Utilities",
			},
		],
		text: "Building blocks",
	},
	{
		items: [
			{ link: "/rules/", text: "Overview" },
			{
				collapsed: false,
				items: [
					{ link: "/rules/strategic/no-cross-context-import", text: "no-cross-context-import" },
					{ link: "/rules/strategic/no-fat-shared-kernel", text: "no-fat-shared-kernel" },
					{ link: "/rules/strategic/no-leaky-host-service", text: "no-leaky-host-service" },
					{ link: "/rules/strategic/no-unmapped-context", text: "no-unmapped-context" },
				],
				text: "Strategic",
			},
			{
				collapsed: false,
				items: [
					{ link: "/rules/layers/no-driving-shortcut", text: "no-driving-shortcut" },
					{ link: "/rules/layers/no-impure-domain", text: "no-impure-domain" },
					{ link: "/rules/layers/no-outward-import", text: "no-outward-import" },
					{ link: "/rules/layers/no-portless-adapter", text: "no-portless-adapter" },
				],
				text: "Layers",
			},
			{
				collapsed: false,
				items: [
					{ link: "/rules/tactical/no-aggregate-reference", text: "no-aggregate-reference" },
					{ link: "/rules/tactical/no-foreign-command-dependency", text: "no-foreign-command-dependency" },
					{ link: "/rules/tactical/no-foreign-query-dependency", text: "no-foreign-query-dependency" },
					{ link: "/rules/tactical/no-loose-code", text: "no-loose-code" },
					{ link: "/rules/tactical/no-misplaced-class", text: "no-misplaced-class" },
					{ link: "/rules/tactical/no-public-field", text: "no-public-field" },
					{ link: "/rules/tactical/no-stateful-service", text: "no-stateful-service" },
					{ link: "/rules/tactical/no-thrown-failure", text: "no-thrown-failure" },
				],
				text: "Tactical",
			},
			{
				collapsed: false,
				items: [{ link: "/rules/tooling/no-loose-disable", text: "no-loose-disable" }],
				text: "Tooling",
			},
		],
		text: "Rules",
	},
];

export default defineConfig({
	cleanUrls: true,
	description: "Building blocks for Domain-Driven Design in TypeScript",
	head: [
		["link", { href: "/logo.svg", rel: "icon", type: "image/svg+xml" }],
		[
			"script",
			{
				"data-domains": "alveolus.dev",
				"data-exclude-hash": "true",
				"data-website-id": "f08d2258-37c3-4859-870a-145181b8b3d1",
				defer: "",
				src: "https://cloud.umami.is/script.js",
			},
		],
	],
	lastUpdated: true,

	markdown: {
		codeTransformers: [transformerNotationWordHighlight()],
		config(md) {
			md.use(groupIconMdPlugin);
			md.use(copyOrDownloadAsMarkdownButtons);
		},
	},

	sitemap: { hostname: PageHead.hostname },

	themeConfig: {
		editLink: {
			pattern: `${repository}/edit/main/apps/docs/:path`,
			text: "Edit this page on GitHub",
		},
		footer: {
			copyright: "Copyright © 2026-present Alveolus contributors",
			message: "Released under the MIT License.",
		},
		logo: "/logo.svg",
		nav: [{ activeMatch: "^/(guide|integrations|core|rules)/", link: "/guide/getting-started", text: "Guide" }],
		outline: { level: "deep" },
		search: { provider: "local" },
		sidebar,
		socialLinks: [
			{ icon: "github", link: repository },
			{ icon: "npm", link: npm },
		],
	},
	title: "Alveolus",
	titleTemplate: ":title | Alveolus, DDD for TypeScript",

	transformPageData(page) {
		page.frontmatter.head ??= [];
		page.frontmatter.head.push(...new PageHead(page).tags());
	},

	vite: {
		plugins: [groupIconVitePlugin(), llmstxt()],
	},
});
