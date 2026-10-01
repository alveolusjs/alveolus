import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";
import llmstxt from "vitepress-plugin-llms";

const repository = "https://github.com/alveolusjs/alveolus";

const packages = [
	{ id: "core", items: ["result", "building-blocks", "application-contracts"] },
	{ id: "arch", items: ["rules"] },
	{ id: "testing", items: [] },
] as const;

const titles: Record<string, string> = {
	result: "Result",
	"building-blocks": "Building blocks",
	"application-contracts": "Application contracts",
	rules: "Rules",
};

export default defineConfig({
	title: "Alveolus",
	description: "Building blocks and architecture tests for Domain-Driven Design in TypeScript",
	base: "/alveolus/",
	cleanUrls: true,
	lastUpdated: true,
	head: [["link", { rel: "icon", type: "image/svg+xml", href: "/alveolus/logo.svg" }]],

	themeConfig: {
		logo: "/logo.svg",
		nav: [
			{ text: "Guide", link: "/guide/", activeMatch: "^/guide/" },
			{
				text: "Packages",
				activeMatch: "^/(core|arch|testing)/",
				items: packages.map(({ id }) => ({ text: `@alveolus/${id}`, link: `/${id}/` })),
			},
		],
		sidebar: {
			"/guide/": [
				{
					text: "Guide",
					items: [
						{ text: "Introduction", link: "/guide/" },
						{ text: "Project layout", link: "/guide/project-layout" },
					],
				},
			],
			...Object.fromEntries(
				packages.map(({ id, items }) => [
					`/${id}/`,
					[
						{
							text: `@alveolus/${id}`,
							items: [
								{ text: "Overview", link: `/${id}/` },
								...items.map((item) => ({ text: titles[item], link: `/${id}/${item}` })),
							],
						},
					],
				]),
			),
		},
		socialLinks: [{ icon: "github", link: repository }],
		search: { provider: "local" },
		editLink: {
			pattern: `${repository}/edit/main/apps/docs/:path`,
			text: "Edit this page on GitHub",
		},
		footer: {
			message: "Released under the MIT License.",
			copyright: "Copyright © 2026-present Alveolus contributors",
		},
	},

	markdown: {
		config(md) {
			md.use(groupIconMdPlugin);
		},
	},

	vite: {
		plugins: [groupIconVitePlugin(), llmstxt()],
	},
});
