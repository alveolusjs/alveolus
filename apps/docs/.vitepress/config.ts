import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";
import llmstxt from "vitepress-plugin-llms";

const repository = "https://github.com/alveolusjs/alveolus";

const sidebar = [
	{
		items: [
			{ link: "/guide/getting-started", text: "Getting started" },
			{ link: "/guide/project-layout", text: "Project layout" },
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
		items: [{ link: "/core/", text: "Overview" }],
		text: "Building blocks",
	},
	{
		collapsed: false,
		items: [
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
	{
		items: [
			{ link: "/rules/", text: "Overview" },
			{ link: "/rules/bc-isolation", text: "bc-isolation" },
			{ link: "/rules/domain-purity", text: "domain-purity" },
			{ link: "/rules/layer-direction", text: "layer-direction" },
			{ link: "/rules/driven-adapters-extend-port", text: "driven-adapters-extend-port" },
			{ link: "/rules/building-blocks-only", text: "building-blocks-only" },
			{ link: "/rules/placement", text: "placement" },
			{ link: "/rules/reference-by-identity", text: "reference-by-identity" },
			{ link: "/rules/command-query-separation", text: "command-query-separation" },
			{ link: "/rules/errors-as-values", text: "errors-as-values" },
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
				"data-website-id": "f08d2258-37c3-4859-870a-145181b8b3d1",
				defer: "",
				src: "https://cloud.umami.is/script.js",
			},
		],
	],
	lastUpdated: true,

	markdown: {
		config(md) {
			md.use(groupIconMdPlugin);
		},
	},

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
		search: { provider: "local" },
		sidebar,
		socialLinks: [{ icon: "github", link: repository }],
	},
	title: "Alveolus",

	vite: {
		plugins: [groupIconVitePlugin(), llmstxt()],
	},
});
