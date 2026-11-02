import { ref } from 'vue';

import { isKind, type Kind } from '../kinds';

const STORAGE_KEY = 'alveolus-kind-filter';

export const kindFilter = ref<Kind | ''>('');

function apply(): void {
	document.documentElement.dataset.ruleKind = kindFilter.value || 'all';
}

export function loadKindFilter(): void {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);

		if (isKind(stored)) {
			kindFilter.value = stored;
		}
	} catch {
		kindFilter.value = '';
	}

	apply();
}

export function setKindFilter(value: Kind | ''): void {
	kindFilter.value = value;

	try {
		if (value) {
			localStorage.setItem(STORAGE_KEY, value);
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		kindFilter.value = value;
	}

	apply();
}
