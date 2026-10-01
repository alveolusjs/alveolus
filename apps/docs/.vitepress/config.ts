import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";
import llmstxt from "vitepress-plugin-llms";

const repository = "https://github.com/alveolusjs/alveolus";

const sidebar = [
	{
		items: [
			{ link: "/guide/", text: "Introduction" },
			{ link: "/guide/getting-started", text: "Getting started" },
			{ link: "/guide/vocabulary", text: "Vocabulary" },
		],
		text: "Guide",
	},
	{
		items: [
			{ link: "/core/", text: "Overview" },
			{
				items: [
					{ link: "/core/domain/aggregates", text: "Aggregates" },
					{ link: "/core/domain/value-objects", text: "Value Objects" },
					{ link: "/core/domain/entities", text: "Entities" },
					{ link: "/core/domain/domain-events", text: "Domain Events" },
					{ link: "/core/domain/domain-errors", text: "Domain Errors" },
					{ link: "/core/domain/domain-services", text: "Domain Services" },
					{ link: "/core/domain/policies", text: "Policies" },
					{ link: "/core/domain/repositories", text: "Repositories" },
					{ link: "/core/domain/views", text: "Views" },
				],
				text: "Domain",
			},
			{
				items: [
					{ link: "/core/application/command-handlers", text: "Command handlers" },
					{ link: "/core/application/query-handlers", text: "Query handlers" },
					{ link: "/core/application/event-publishers", text: "Event publishers" },
					{ link: "/core/application/notifications", text: "Notifications" },
					{ link: "/core/application/ports", text: "Ports" },
				],
				text: "Application",
			},
			{
				items: [{ link: "/core/utilities/result", text: "Result" }],
				text: "Utilities",
			},
		],
		text: "Core",
	},
	{
		items: [
			{ link: "/testing/", text: "Overview" },
			{ link: "/testing/scenarios", text: "Scenarios" },
			{ link: "/testing/event-assertions", text: "Event assertions" },
		],
		text: "Testing",
	},
	{
		items: [
			{ link: "/arch/", text: "Overview" },
			{ link: "/arch/cli", text: "CLI" },
			{ link: "/arch/project-layout", text: "Project layout" },
			{
				items: [
					{ link: "/arch/rules/aggregates", text: "Aggregates" },
					{ link: "/arch/rules/entities", text: "Entities" },
					{ link: "/arch/rules/value-objects", text: "Value Objects" },
					{ link: "/arch/rules/domain-events", text: "Domain Events" },
					{ link: "/arch/rules/domain-services", text: "Domain Services" },
					{ link: "/arch/rules/policies", text: "Policies" },
					{ link: "/arch/rules/repositories", text: "Repositories" },
				],
				text: "Rules",
			},
		],
		text: "Arch",
	},
];

export default defineConfig({
	base: "/alveolus/",
	cleanUrls: true,
	description: "Building blocks and architecture tests for Domain-Driven Design in TypeScript",
	head: [
		["link", { href: "/alveolus/logo.svg", rel: "icon", type: "image/svg+xml" }],
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
		nav: [{ activeMatch: "^/(guide|core|testing|arch)/", link: "/guide/", text: "Guide" }],
		search: { provider: "local" },
		sidebar,
		socialLinks: [{ icon: "github", link: repository }],
	},
	title: "Alveolus",

	vite: {
		plugins: [groupIconVitePlugin(), llmstxt()],
	},
});
