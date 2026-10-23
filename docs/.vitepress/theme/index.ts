import { type Theme, useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h, nextTick, onMounted, watch } from 'vue';
import CopyMarkdown from './components/CopyMarkdown.vue';
import HomeAnatomy from './components/HomeAnatomy.vue';
import HomeSearch from './components/HomeSearch.vue';
import HomeStyles from './components/HomeStyles.vue';
import HomeUses from './components/HomeUses.vue';
import PartEyebrow from './components/PartEyebrow.vue';
import RuleAside from './components/RuleAside.vue';
import RuleIndex from './components/RuleIndex.vue';
import RuleMeta from './components/RuleMeta.vue';
import RuleTable from './components/RuleTable.vue';
import StyleFilterSwitch from './components/StyleFilterSwitch.vue';
import StyleLegend from './components/StyleLegend.vue';
import ThemeTable from './components/ThemeTable.vue';
import { filterSidebar } from './sidebar-filter';
import { loadStyleFilter, styleFilter } from './style-filter';
import './theme.css';
import './style.css';
import './home.css';
import './layout.css';

export default {
	extends: DefaultTheme,
	Layout: () =>
		h(DefaultTheme.Layout, null, {
			'home-hero-info-before': () => h('span', { class: 'al-preview' }, 'Aperçu'),
			'aside-top': () => h(RuleAside),
			'doc-before': () => h('div', { class: 'doc-top' }, [h(PartEyebrow), h(CopyMarkdown)]),
			'nav-bar-content-after': () => h(StyleFilterSwitch),
			'nav-screen-content-after': () => h(StyleFilterSwitch),
		}),
	setup() {
		const route = useRoute();

		onMounted(() => {
			loadStyleFilter();

			const sidebar = document.querySelector('.VPSidebar');

			if (sidebar) {
				new MutationObserver(filterSidebar).observe(sidebar, { childList: true, subtree: true });
			}

			filterSidebar();
		});

		watch(
			() => [styleFilter.value, route.path],
			() => nextTick(filterSidebar),
		);
	},
	enhanceApp({ app }) {
		app.component('HomeAnatomy', HomeAnatomy);
		app.component('HomeSearch', HomeSearch);
		app.component('HomeStyles', HomeStyles);
		app.component('HomeUses', HomeUses);
		app.component('RuleIndex', RuleIndex);
		app.component('RuleMeta', RuleMeta);
		app.component('RuleTable', RuleTable);
		app.component('StyleLegend', StyleLegend);
		app.component('ThemeTable', ThemeTable);
	},
} satisfies Theme;
