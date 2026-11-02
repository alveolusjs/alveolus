<script setup lang="ts">
import { computed } from 'vue';

import { type Kind, kinds } from '../../kinds';
import { kindFilter, setKindFilter } from '../kind-filter';

const options: { value: Kind | ''; label: string; hint: string }[] = [
	{ value: '', label: 'Toutes', hint: 'Les règles de toutes les natures.' },
	{ value: 'safeguard', label: 'Garde-fous', hint: kinds.safeguard.meaning },
	{ value: 'structure', label: 'Structure', hint: kinds.structure.meaning },
	{ value: 'convention', label: 'Conventions', hint: kinds.convention.meaning },
];

const hint = computed(() => options.find((option) => option.value === kindFilter.value)?.hint);
</script>

<template>
	<fieldset class="style-filter kind-filter">
		<legend class="style-filter__legend">Nature</legend>
		<div class="style-filter__options">
			<button
				v-for="option in options"
				:key="option.value"
				type="button"
				:aria-pressed="kindFilter === option.value"
				:class="{ active: kindFilter === option.value }"
				@click="setKindFilter(option.value)"
			>
				{{ option.label }}
			</button>
		</div>
		<p class="style-filter__hint">{{ hint }}</p>
	</fieldset>
</template>
