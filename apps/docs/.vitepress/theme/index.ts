import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import type { Theme } from "vitepress";
import "virtual:group-icons.css";
import "./style.css";

export default {
	extends: DefaultTheme,
	Layout: () =>
		h(DefaultTheme.Layout, null, {
			"home-hero-info-before": () => h("span", { class: "al-preview" }, "Early preview"),
		}),
} satisfies Theme;
