import { ref } from 'vue';

import type { Style } from '../styles';

const STORAGE_KEY = 'alveolus-style-filter';

export const styleFilter = ref<Style | ''>('');

function apply(): void {
	document.documentElement.dataset.ruleStyle = styleFilter.value || 'all';
}

export function loadStyleFilter(): void {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);

		if (stored === 'tactical' || stored === 'transaction-script') {
			styleFilter.value = stored;
		}
	} catch {
		styleFilter.value = '';
	}

	apply();
}

export function setStyleFilter(value: Style | ''): void {
	styleFilter.value = value;

	try {
		if (value) {
			localStorage.setItem(STORAGE_KEY, value);
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		styleFilter.value = value;
	}

	apply();
}

export function matchesStyleFilter(style: readonly string[]): boolean {
	return !styleFilter.value || style.includes(styleFilter.value);
}
