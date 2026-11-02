import { type Theme, useData, useRoute, useRouter, withBase } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h, nextTick, onMounted, watch } from 'vue';

import CopyMarkdown from './components/CopyMarkdown.vue';
import PackTable from './components/PackTable.vue';
import PartEyebrow from './components/PartEyebrow.vue';
import RuleAside from './components/RuleAside.vue';
import RuleFiltersMenu from './components/RuleFiltersMenu.vue';
import RuleIndex from './components/RuleIndex.vue';
import RuleMeta from './components/RuleMeta.vue';
import RuleTable from './components/RuleTable.vue';
import StyleLegend from './components/StyleLegend.vue';
import ThemeRulesLink from './components/ThemeRulesLink.vue';
import ThemeTable from './components/ThemeTable.vue';
import { kindFilter, loadKindFilter } from './kind-filter';
import { data as rules } from './rules.data';
import { filterSidebar, revealActiveSidebarItem } from './sidebar-filter';
import { loadStyleFilter, styleFilter } from './style-filter';
import './theme.css';
import './style.css';
import './home.css';
import './layout.css';
import './getting-started.css';

const RULE_CODE_SEGMENT = /\/([a-z]{2,4}-\d{2})\/?$/i;

function ruleUrlFor(path: string): string | undefined {
	const code = RULE_CODE_SEGMENT.exec(path)?.[1]?.toUpperCase();

	return rules.find((rule) => rule.code === code)?.url;
}

export default {
	extends: DefaultTheme,
	Layout: () =>
		h(DefaultTheme.Layout, null, {
			'home-hero-info-before': () => h('span', { class: 'al-preview' }, 'Aperçu'),
			'aside-top': () => h(RuleAside),
			'doc-before': () => h('div', { class: 'doc-top' }, [h(PartEyebrow), h(ThemeRulesLink), h(CopyMarkdown)]),
			'nav-bar-content-after': () => h(RuleFiltersMenu),
		}),
	setup() {
		const route = useRoute();
		const router = useRouter();
		const { page } = useData();

		function redirectRuleCode(): void {
			const url = page.value.isNotFound ? ruleUrlFor(route.path) : undefined;

			if (url) {
				void router.go(withBase(url));
			}
		}

		function revealAfterRender(): void {
			requestAnimationFrame(revealActiveSidebarItem);
		}

		onMounted(() => {
			loadStyleFilter();
			loadKindFilter();
			redirectRuleCode();

			const sidebar = document.querySelector('.VPSidebar');

			if (sidebar) {
				new MutationObserver(filterSidebar).observe(sidebar, { childList: true, subtree: true });
			}

			filterSidebar();
			revealAfterRender();
		});

		watch(
			() => [styleFilter.value, kindFilter.value, route.path],
			() => nextTick(filterSidebar),
		);

		watch(
			() => route.path,
			() => {
				redirectRuleCode();
				void nextTick(revealAfterRender);
			},
		);
	},
	enhanceApp({ app }) {
		app.component('PackTable', PackTable);
		app.component('RuleIndex', RuleIndex);
		app.component('RuleMeta', RuleMeta);
		app.component('RuleTable', RuleTable);
		app.component('StyleLegend', StyleLegend);
		app.component('ThemeTable', ThemeTable);
	},
} satisfies Theme;
