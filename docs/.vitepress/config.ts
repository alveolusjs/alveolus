import { defineConfig } from 'vitepress';

import { iconSvg, withIcons } from './icons';
import { pageMarkdown } from './page-markdown';
import { parts } from './parts';
import { ruleLinks, rulesSidebar } from './rules';
import { sectionIconsCss } from './section-icons';
import { reloadSidebarOnFrontmatterChange } from './sidebar-reload';
import { groupAnchor, themes } from './themes';

export default defineConfig({
	lang: 'fr-FR',
	title: 'Alveolus',
	titleTemplate: ':title | Alveolus',
	description:
		'Des règles pour construire en TypeScript / NestJS : Domain-Driven Design, architecture, tests et exploitation',
	srcDir: 'src',
	cleanUrls: true,
	lastUpdated: true,
	sitemap: { hostname: 'https://alveolus.dev' },
	head: [
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
		['style', {}, sectionIconsCss()],
		[
			'script',
			{
				defer: '',
				src: 'https://cloud.umami.is/script.js',
				'data-website-id': 'f08d2258-37c3-4859-870a-145181b8b3d1',
				'data-domains': 'alveolus.dev',
			},
		],
	],
	markdown: {
		config: ruleLinks,
	},
	vite: {
		plugins: [reloadSidebarOnFrontmatterChange()],
	},
	transformPageData(pageData) {
		if (Array.isArray(pageData.frontmatter.features)) {
			pageData.frontmatter.features = withIcons(pageData.frontmatter.features);
		}

		const location = /^rules\/([\w-]+)\/(?:([\w-]+)\/)?([\w-]+)\.md$/.exec(pageData.relativePath);
		const partIndex = location ? parts.findIndex((part) => part.slug === location[1]) : -1;

		if (location && partIndex >= 0) {
			const [, partSlug, themeSlug, page] = location;
			const part = parts[partIndex];
			const partCrumb = { text: `Partie ${partIndex + 1} · ${part.title}`, link: `/rules/${partSlug}/` };
			const theme = themes.find((candidate) => candidate.slug === themeSlug);

			if (page === 'index' && !themeSlug) {
				pageData.frontmatter.partEyebrow = {
					icon: iconSvg(part.icon),
					label: `Partie ${partIndex + 1} sur ${parts.length}`,
				};
			} else if (page === 'index' && theme) {
				pageData.frontmatter.partEyebrow = { icon: iconSvg(part.icon), crumbs: [partCrumb] };
				pageData.frontmatter.themeRules = theme.slug;
			} else if (theme && pageData.frontmatter.code) {
				const themeLink = `/rules/${partSlug}/${theme.slug}/`;
				const group = String(pageData.frontmatter.group ?? '');
				pageData.frontmatter.partEyebrow = {
					icon: iconSvg(part.icon),
					crumbs: [
						partCrumb,
						{ text: theme.title, link: themeLink },
						...(group ? [{ text: group, link: `${themeLink}#${groupAnchor(group)}` }] : []),
					],
				};
			}
		}

		if (pageData.frontmatter.layout !== 'page') {
			pageData.frontmatter.copyMarkdown = pageMarkdown(pageData.relativePath);
		}
	},
	themeConfig: {
		logo: { src: '/logo.svg', alt: 'Alveolus' },
		nav: [
			{ text: 'Présentation', link: '/start/overview', activeMatch: '^/start/(?!getting-started)' },
			{ text: 'Premiers pas', link: '/start/getting-started', activeMatch: '^/start/getting-started' },
			{ text: 'Règles', link: '/rules/', activeMatch: '^/rules/' },
		],
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/alveolusjs/alveolus' },
			{ icon: 'npm', link: 'https://www.npmjs.com/org/alveolus' },
		],
		sidebar: {
			'/': rulesSidebar(),
		},
		footer: { message: '<a href="/start/about">À propos et sources</a>' },
		docFooter: { prev: 'Page précédente', next: 'Page suivante' },
		darkModeSwitchLabel: 'Apparence',
		lightModeSwitchTitle: 'Passer au thème clair',
		darkModeSwitchTitle: 'Passer au thème sombre',
		sidebarMenuLabel: 'Menu',
		returnToTopLabel: 'Retour en haut',
		skipToContentLabel: 'Aller au contenu',
		search: {
			provider: 'local',
			options: {
				translations: {
					button: { buttonText: 'Rechercher', buttonAriaLabel: 'Rechercher' },
					modal: {
						displayDetails: 'Afficher la liste détaillée',
						resetButtonTitle: 'Effacer la recherche',
						backButtonTitle: 'Fermer la recherche',
						noResultsText: 'Aucun résultat pour',
						footer: {
							selectText: 'pour ouvrir',
							selectKeyAriaLabel: 'entrée',
							navigateText: 'pour naviguer',
							navigateUpKeyAriaLabel: 'flèche haut',
							navigateDownKeyAriaLabel: 'flèche bas',
							closeText: 'pour fermer',
							closeKeyAriaLabel: 'échap',
						},
					},
				},
			},
		},
		outline: { level: [2, 3], label: 'Sur cette page' },
		lastUpdated: { text: 'Mis à jour', formatOptions: { dateStyle: 'long', forceLocale: true } },
		notFound: {
			title: 'Page introuvable',
			quote: 'Cette adresse ne mène à aucune page. Cherchez une règle par son code avec la recherche, en haut.',
			linkLabel: 'Revenir à l’accueil',
			linkText: 'Revenir à l’accueil',
		},
	},
});
