import { type Theme, useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h, nextTick, onMounted, watch } from 'vue';

import CopyMarkdown from './components/CopyMarkdown.vue';
import KindFilterSwitch from './components/KindFilterSwitch.vue';
import PackTable from './components/PackTable.vue';
import PartEyebrow from './components/PartEyebrow.vue';
import RuleAside from './components/RuleAside.vue';
import RuleIndex from './components/RuleIndex.vue';
import RuleMeta from './components/RuleMeta.vue';
import RuleTable from './components/RuleTable.vue';
import StyleFilterSwitch from './components/StyleFilterSwitch.vue';
import StyleLegend from './components/StyleLegend.vue';
import ThemeTable from './components/ThemeTable.vue';
import { kindFilter, loadKindFilter } from './kind-filter';
import { filterSidebar } from './sidebar-filter';
import { loadStyleFilter, styleFilter } from './style-filter';
import './theme.css';
import './style.css';
import './home.css';
import './layout.css';
import './getting-started.css';

export default {
	extends: DefaultTheme,
	Layout: () =>
		h(DefaultTheme.Layout, null, {
			'home-hero-info-before': () => h('span', { class: 'al-preview' }, 'Aperçu'),
			'aside-top': () => h(RuleAside),
			'doc-before': () => h('div', { class: 'doc-top' }, [h(PartEyebrow), h(CopyMarkdown)]),
			'nav-bar-content-after': () => [h(StyleFilterSwitch), h(KindFilterSwitch)],
			'nav-screen-content-after': () => [h(StyleFilterSwitch), h(KindFilterSwitch)],
		}),
	setup() {
		const route = useRoute();

		onMounted(() => {
			loadStyleFilter();
			loadKindFilter();

			const sidebar = document.querySelector('.VPSidebar');

			if (sidebar) {
				new MutationObserver(filterSidebar).observe(sidebar, { childList: true, subtree: true });
			}

			filterSidebar();
		});

		watch(
			() => [styleFilter.value, kindFilter.value, route.path],
			() => nextTick(filterSidebar),
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
