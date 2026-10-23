import { data as rules } from './rules.data';
import { matchesStyleFilter } from './style-filter';

const styleByUrl = new Map(rules.map((rule) => [rule.url, rule.style]));

function ruleStyle(link: Element | null): readonly string[] | undefined {
	const href = link?.getAttribute('href');

	if (!href) {
		return undefined;
	}

	const path = new URL(href, window.location.origin).pathname.replace(/\.html$/, '');

	return styleByUrl.get(path);
}

export function filterSidebar(): void {
	const items = [...document.querySelectorAll<HTMLElement>('.VPSidebar .VPSidebarItem')].reverse();

	for (const item of items) {
		const style = ruleStyle(item.querySelector(':scope > .item a[href]'));
		const children = item.querySelector(':scope > .items');
		let hidden = false;

		if (style) {
			hidden = !matchesStyleFilter(style);
		} else if (children) {
			const ruleItems = [...children.querySelectorAll('a[href]')]
				.filter((link) => ruleStyle(link) !== undefined)
				.map((link) => link.closest('.VPSidebarItem'));

			hidden = ruleItems.length > 0 && ruleItems.every((ruleItem) => ruleItem?.classList.contains('rb-filtered'));
		}

		item.classList.toggle('rb-filtered', hidden);
	}
}
