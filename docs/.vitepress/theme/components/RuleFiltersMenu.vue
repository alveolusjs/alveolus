<script setup lang="ts">
import { useRoute } from 'vitepress';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { activeFilterCount, clearRuleFilters, filtering } from '../rule-filters';
import KindFilterSwitch from './KindFilterSwitch.vue';
import StyleFilterSwitch from './StyleFilterSwitch.vue';

const route = useRoute();
const open = ref(false);
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();

const triggerLabel = computed(() => {
	const count = activeFilterCount.value;

	if (count === 0) {
		return 'Filtrer les règles';
	}

	return count === 1 ? 'Filtrer les règles, 1 filtre actif' : `Filtrer les règles, ${count} filtres actifs`;
});

function closeOnOutsideClick(event: PointerEvent): void {
	if (event.target instanceof Node && !root.value?.contains(event.target)) {
		open.value = false;
	}
}

function closeOnEscape(event: KeyboardEvent): void {
	if (event.key === 'Escape' && open.value) {
		open.value = false;
		trigger.value?.focus();
	}
}

onMounted(() => {
	document.addEventListener('pointerdown', closeOnOutsideClick);
	document.addEventListener('keydown', closeOnEscape);
});

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', closeOnOutsideClick);
	document.removeEventListener('keydown', closeOnEscape);
});

watch(
	() => route.path,
	() => {
		open.value = false;
	},
);
</script>

<template>
	<div ref="root" class="rule-filters-menu">
		<button
			ref="trigger"
			type="button"
			:class="['rule-filters-menu__trigger', { active: filtering }]"
			:aria-label="triggerLabel"
			:aria-expanded="open"
			aria-controls="rule-filters-panel"
			@click="open = !open"
		>
			<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
				<path
					d="M3 4h18l-7 8.5V19l-4 2v-8.5z"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linejoin="round"
				/>
			</svg>
			<span class="rule-filters-menu__label">Filtres</span>
			<span v-if="activeFilterCount > 0" class="rule-filters-menu__count">{{ activeFilterCount }}</span>
		</button>
		<div v-show="open" id="rule-filters-panel" class="rule-filters-menu__panel">
			<StyleFilterSwitch />
			<KindFilterSwitch />
			<button v-if="filtering" type="button" class="rule-filters-menu__reset" @click="clearRuleFilters()">
				Réinitialiser les filtres
			</button>
		</div>
	</div>
</template>
