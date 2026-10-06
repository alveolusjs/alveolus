import DefaultTheme from "vitepress/theme";
import CopyOrDownloadAsMarkdownButtons from "vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue";
import { h } from "vue";
import type { Theme } from "vitepress";
import "virtual:group-icons.css";
import "./style.css";

export default {
	enhanceApp({ app }) {
		app.component("CopyOrDownloadAsMarkdownButtons", CopyOrDownloadAsMarkdownButtons);
	},
	extends: DefaultTheme,
	Layout: () =>
		h(DefaultTheme.Layout, null, {
			"home-hero-info-before": () => h("span", { class: "al-preview" }, "Early preview"),
		}),
} satisfies Theme;
