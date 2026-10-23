import { defineConfig } from 'vitepress';
import { iconSvg, withIcons } from './icons';
import { pageMarkdown } from './page-markdown';
import { parts } from './parts';
import { ruleLinks, rulesSidebar } from './rules';
import { sectionIconsCss } from './section-icons';
import { reloadSidebarOnFrontmatterChange } from './sidebar-reload';

export default defineConfig({
	lang: 'fr-FR',
	title: 'Alveolus',
	titleTemplate: ':title | Alveolus',
	description: 'Des règles de Domain-Driven Design et d’architecture pour relire du code TypeScript / NestJS',
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

		const overview = /^rules\/([\w-]+)\/(?:([\w-]+)\/)?index\.md$/.exec(pageData.relativePath);
		const partIndex = overview ? parts.findIndex((part) => part.slug === overview[1]) : -1;

		if (overview && partIndex >= 0) {
			const part = parts[partIndex];
			pageData.frontmatter.partEyebrow = {
				icon: iconSvg(part.icon),
				label: overview[2]
					? `Partie ${partIndex + 1} · ${part.title}`
					: `Partie ${partIndex + 1} sur ${parts.length}`,
			};
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
		lastUpdated: { text: 'Mis à jour' },
	},
});
