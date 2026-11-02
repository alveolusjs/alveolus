import { computed } from 'vue';

import { kinds } from '../kinds';
import { styles } from '../styles';
import { kindFilter, setKindFilter } from './kind-filter';
import { setStyleFilter, styleFilter } from './style-filter';

export interface FilterableRule {
	readonly style: readonly string[];
	readonly kind?: string;
}

export function matchesRuleFilters(rule: FilterableRule): boolean {
	return (
		(!styleFilter.value || rule.style.includes(styleFilter.value)) &&
		(!kindFilter.value || rule.kind === kindFilter.value)
	);
}

export const filtering = computed(() => Boolean(styleFilter.value || kindFilter.value));

export const filterScope = computed(() => {
	const shown = kindFilter.value ? `les ${kinds[kindFilter.value].plural}` : 'les règles';

	return styleFilter.value ? `${shown} des ${styles[styleFilter.value].contexts}` : shown;
});

export function clearRuleFilters(): void {
	setStyleFilter('');
	setKindFilter('');
}
