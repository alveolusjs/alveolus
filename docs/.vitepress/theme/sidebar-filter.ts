import { type FilterableRule, matchesRuleFilters } from './rule-filters';
import { data as rules } from './rules.data';

const ruleByUrl = new Map(rules.map((rule) => [rule.url, rule]));

function ruleOf(link: Element | null): FilterableRule | undefined {
	const href = link?.getAttribute('href');

	if (!href) {
		return undefined;
	}

	const path = new URL(href, window.location.origin).pathname.replace(/\.html$/, '');

	return ruleByUrl.get(path);
}

export function filterSidebar(): void {
	const items = [...document.querySelectorAll<HTMLElement>('.VPSidebar .VPSidebarItem')].reverse();

	for (const item of items) {
		const rule = ruleOf(item.querySelector(':scope > .item a[href]'));
		const children = item.querySelector(':scope > .items');
		const current = item.classList.contains('is-active') || item.classList.contains('has-active');
		let hidden = false;

		if (rule) {
			hidden = !matchesRuleFilters(rule);
		} else if (children) {
			const ruleItems = [...children.querySelectorAll('a[href]')]
				.filter((link) => ruleOf(link) !== undefined)
				.map((link) => link.closest('.VPSidebarItem'));

			hidden = ruleItems.length > 0 && ruleItems.every((ruleItem) => ruleItem?.classList.contains('rb-filtered'));
		}

		item.classList.toggle('rb-filtered', hidden && !current);
	}
}

export function revealActiveSidebarItem(): void {
	const sidebar = document.querySelector<HTMLElement>('.VPSidebar');
	const active = sidebar?.querySelector<HTMLElement>('.VPSidebarItem.is-active > .item');

	if (!sidebar || !active) {
		return;
	}

	const sidebarBox = sidebar.getBoundingClientRect();
	const activeBox = active.getBoundingClientRect();

	if (activeBox.top >= sidebarBox.top && activeBox.bottom <= sidebarBox.bottom) {
		return;
	}

	sidebar.scrollTop += activeBox.top - sidebarBox.top - sidebarBox.height / 2;
}
